// 卡片管理Hook，后续把移动卡片的逻辑从这里提取出来
import { useState, useCallback} from 'react';
import { ICard, IPosition, ISize } from '../../types/CoreTypes';
import { getRandomColor } from '../../utils/ui/colors';
import { calculateNewCardPosition, LayoutAlgorithm, LayoutOptions } from '../../utils/layoutUtils';
import { Logger } from '../../utils/log'; // 添加导入

export const useCardDragging = (
  zoomLevel: number,
  moveCard: (cardId: string, deltaX: number, deltaY: number) => void,
  moveMultipleCards: (cardIds: string[], deltaX: number, deltaY: number) => void
) => {
  const handleCardMove = useCallback((cardId: string, deltaX: number, deltaY: number) => {
    const scaledDeltaX = deltaX / zoomLevel;
    const scaledDeltaY = deltaY / zoomLevel;
    moveCard(cardId, scaledDeltaX, scaledDeltaY);
  }, [moveCard, zoomLevel]);

  const handleMultipleCardMove = useCallback((cardIds: string[], deltaX: number, deltaY: number) => {
    const scaledDeltaX = deltaX / zoomLevel;
    const scaledDeltaY = deltaY / zoomLevel;
    moveMultipleCards(cardIds, scaledDeltaX, scaledDeltaY);
  }, [moveMultipleCards, zoomLevel]);

  return {
    handleCardMove,
    handleMultipleCardMove
  };
};

export const useCards = (zoomLevel: number = 1) => {
  const [cards, setCards] = useState<ICard[]>([]);
  const [selectedCardId, setSelectedCardIdState] = useState<string | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]); // 添加多选数组
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [lastCardPosition, setLastCardPosition] = useState<IPosition>({ x: 100, y: 100 });
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<LayoutAlgorithm>('random'); // 设置默认为随机布局
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>({
    spacing: 180,
    jitter: 10  // 降低默认抖动值，使布局更整齐
  });
  
  // 选择卡片
  const setSelectedCardId = useCallback((cardId: string | null) => {
    // 记录这个卡片选择操作
    if (cardId === null) {
      Logger.selection('取消选择', '卡片', selectedCardId); // 记录取消选择
    } else {
      // 查找卡片内容用于日志输出
      const card = cards.find(c => c.id === cardId);
      const cardInfo = card ? `${cardId} (${card.content.substring(0, 15)}${card.content.length > 15 ? '...' : ''})` : cardId;
      Logger.selection('选择', '卡片', cardInfo);
    }
    
    // 更新选择状态
    setSelectedCardIdState(cardId);
    // 如果选择了一张卡片，则更新选中卡片数组为只包含这张卡片
    if (cardId !== null) {
      setSelectedCardIds([cardId]);
    } else {
      setSelectedCardIds([]);
    }
  }, [cards, selectedCardId]);

  // 创建新卡片
  const createCard = useCallback((
    mapSize: ISize, 
    viewportInfo?: { 
      viewportWidth: number, 
      viewportHeight: number, 
      zoom: number, 
      pan: { x: number, y: number } 
    }
  ) => {
    const position = calculateNewCardPosition(
      lastCardPosition, 
      mapSize, 
      cards, 
      layoutAlgorithm, 
      layoutOptions,
      viewportInfo // 传递视口信息到布局函数
    );
    setLastCardPosition(position);
    
    const newCard: ICard = {
      id: `card-${Date.now()}`,
      content: '新建卡片',
      x: position.x,
      y: position.y,
      width: 160,
      height: 80,
      color: getRandomColor(),
    };
    
    setCards(prevCards => [...prevCards, newCard]);
    setSelectedCardId(newCard.id);
    setEditingCardId(newCard.id);
    
    return newCard;
  }, [lastCardPosition, cards, layoutAlgorithm, layoutOptions, setSelectedCardId]);
  
  // 在指定位置创建卡片
  const createCardAtPosition = useCallback((position: IPosition) => {
    const newCard: ICard = {
      id: `card-${Date.now()}`,
      content: '新建卡片',
      x: position.x,
      y: position.y,
      width: 160,
      height: 80,
      color: getRandomColor(),
    };
    
    setCards(prevCards => [...prevCards, newCard]);
    setSelectedCardId(newCard.id);
    setEditingCardId(newCard.id);
    
    return newCard;
  }, [setSelectedCardId]);
  
  // 更新卡片内容
  const updateCardContent = useCallback((cardId: string, content: string) => {
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, content } : card
      )
    );
  }, []);
  
  // 移动卡片
  const moveCard = useCallback((cardId: string, deltaX: number, deltaY: number) => {
    setCards(prevCards => prevCards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          x: card.x + deltaX,
          y: card.y + deltaY
        };
      }
      return card;
    }));
  }, []);
  
  // 更新卡片位置
  const updateCardPosition = useCallback((cardId: string, position: IPosition) => {
    setCards(prevCards => prevCards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          x: position.x,
          y: position.y
        };
      }
      return card;
    }));
  }, []);
  
  // 更新卡片尺寸
  const updateCardSize = useCallback((cardId: string, size: ISize) => {
    setCards(prevCards => prevCards.map(card => {
      if (card.id === cardId) {
        return {
          ...card,
          width: size.width,
          height: size.height
        };
      }
      return card;
    }));
  }, []);
  
  // 删除卡片
  const deleteCards = useCallback(async (cardIds: string[]) => {
    if (!cardIds.length) return;
  
    try {
      console.log('准备批量删除卡片:', cardIds);
  
      // 一次性更新状态
      setCards(prevCards => {
        const filteredCards = prevCards.filter(card => !cardIds.includes(card.id));
        console.log(`卡片数量变化: ${prevCards.length} -> ${filteredCards.length}`);
        return filteredCards;
      });
  
      // 清理选择状态
      setSelectedCardIds(prev => {
        const newSelection = prev.filter(id => !cardIds.includes(id));
        console.log(`选中卡片变化: ${prev.length} -> ${newSelection.length}`);
        return newSelection;
      });
  
      // 更新单选和编辑状态
      if (selectedCardId && cardIds.includes(selectedCardId)) {
        setSelectedCardId(null);
      }
      if (editingCardId && cardIds.includes(editingCardId)) {
        setEditingCardId(null);
      }
  
    } catch (error) {
      console.error('删除卡片失败:', error);
      throw error; // 向上传递错误
    }
  }, [selectedCardId, editingCardId, setSelectedCardId]);
  
  const handleCardsDelete = useCallback(async (deleteCardConnections?: (cardId: string) => void) => {
    if (selectedCardIds.length === 0) return;
  
    try {
      // 复制选中的卡片ID数组
      const cardsToDelete = [...selectedCardIds];
      console.log('开始批量删除卡片，选中的卡片:', cardsToDelete);
  
      // 记录要删除的所有卡片
      const deleteInfo = cardsToDelete.map(id => {
        const card = cards.find(c => c.id === id);
        return card ? `${id} (${card.content.substring(0, 10)}...)` : id;
      }).join(', ');
      Logger.selection('批量删除', '卡片', deleteInfo);
  
      // 1. 先删除所有相关连接
      if (deleteCardConnections) {
        await Promise.all(
          cardsToDelete.map(cardId => deleteCardConnections(cardId))
        );
      }

      await deleteCards(cardsToDelete);
  
    } catch (error) {
      console.error('批量删除操作失败:', error);
    }
  }, [cards, selectedCardIds, deleteCards]);

  // 批量设置卡片
  const setCardsData = useCallback((newCards: ICard[]) => {
    setCards(newCards);
  }, []);
  
  // 更改布局算法
  const changeLayoutAlgorithm = useCallback((algorithm: LayoutAlgorithm, options?: LayoutOptions) => {
    setLayoutAlgorithm(algorithm);
    if (options) {
      setLayoutOptions(prev => ({ ...prev, ...options }));
    }
  }, []);
  
  // 获取当前布局设置
  const getLayoutSettings = useCallback(() => {
    return {
      algorithm: layoutAlgorithm,
      options: layoutOptions
    };
  }, [layoutAlgorithm, layoutOptions]);
  
  // 扩展选择卡片功能以支持多选
  const selectCard = useCallback((cardId: string, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      // 多选模式
      setSelectedCardIds(prev => {
        if (prev.includes(cardId)) {
          // 如果已经在选择中，则移除
          return prev.filter(id => id !== cardId);
        } else {
          // 否则添加
          return [...prev, cardId];
        }
      });
      
      // 保持兼容性，设置单选卡片为此卡片
      setSelectedCardId(cardId);
    } else {
      // 单选模式
      setSelectedCardId(cardId);
      setSelectedCardIds([cardId]);
    }
  }, [setSelectedCardId]);
  
  // 批量选择卡片
  const selectCards = useCallback((cardIds: string[]) => {
    if (cardIds.length === 0) {
      Logger.selection('清空选择', '卡片', selectedCardIds);
    } else {
      // 记录所有选择的卡片
      const cardInfos = cardIds.map(id => {
        const card = cards.find(c => c.id === id);
        return card ? `${id} (${card.content.substring(0, 10)}...)` : id;
      });
      
      Logger.selection(
        cardIds.length === 1 ? '选择单张' : '批量选择',
        '卡片',
        cardIds.length > 3 
          ? `[${cardInfos.slice(0, 3).join(', ')} 和 ${cardIds.length - 3} 张其他卡片]`
          : `[${cardInfos.join(', ')}]`
      );
    }
    
    // 更新选择状态
    setSelectedCardIds(cardIds);
    // 更新单选状态
    setSelectedCardIdState(cardIds.length === 1 ? cardIds[0] : null);
  
  }, [cards]);
  
  // 清除所有选择
  const clearSelection = useCallback(() => {
    setSelectedCardId(null);
    setSelectedCardIds([]);
  }, [setSelectedCardId]); 

  // 批量移动卡片
  const moveMultipleCards = useCallback((cardIds: string[], deltaX: number, deltaY: number) => {
    setCards(prevCards => prevCards.map(card => {
      if (cardIds.includes(card.id)) {
        return {
          ...card,
          x: card.x + deltaX,
          y: card.y + deltaY
        };
      }
      return card;
    }));
  }, []);

  // 切换卡片选择状态（用于多选）
  const toggleCardSelection = useCallback((cardId: string, ctrlKey: boolean = false) => {
    const card = cards.find(c => c.id === cardId);
    const cardInfo = card ? `${cardId} (${card.content.substring(0, 15)}${card.content.length > 15 ? '...' : ''})` : cardId;
    
    if (ctrlKey) {
      // Ctrl+点击进行多选或取消选择
      setSelectedCardIds(prev => {
        if (prev.includes(cardId)) {
          Logger.selection('取消选择', '卡片', cardInfo);
          return prev.filter(id => id !== cardId);
        } else {
          Logger.selection('添加选择', '卡片', cardInfo);
          return [...prev, cardId];
        }
      });
      // 仅在单选时更新当前选中卡片
      if (selectedCardIds.length <= 1) {
        setSelectedCardIdState(cardId);
      }
    } else {
      // 普通点击，替换当前选择
      Logger.selection('选择', '卡片', cardInfo);
      setSelectedCardIds([cardId]);
      setSelectedCardIdState(cardId);
    }
  }, [cards, selectedCardIds]); // 添加缺少的依赖

  // 选择下一张卡片
  const selectNextCard = useCallback((reverse: boolean = false) => {
    if (cards.length === 0) return;
    
    // 如果没有选中的卡片，选择第一张
    if (!selectedCardId) {
      const firstCard = cards[0];
      const cardInfo = `${firstCard.id} (${firstCard.content.substring(0, 15)}${firstCard.content.length > 15 ? '...' : ''})`;
      Logger.selection('选择第一张', '卡片', cardInfo);
      setSelectedCardId(firstCard.id);
      return;
    }
    
    // 查找当前选中卡片的索引
    const currentIndex = cards.findIndex(card => card.id === selectedCardId);
    if (currentIndex === -1) return;
    
    // 计算下一张卡片的索引
    const nextIndex = reverse 
      ? (currentIndex - 1 + cards.length) % cards.length 
      : (currentIndex + 1) % cards.length;
    
    // 选择下一张卡片
    const nextCard = cards[nextIndex];
    const cardInfo = `${nextCard.id} (${nextCard.content.substring(0, 15)}${nextCard.content.length > 15 ? '...' : ''})`;
    Logger.selection(reverse ? '选择上一张' : '选择下一张', '卡片', cardInfo);
    setSelectedCardId(nextCard.id);
  }, [cards, selectedCardId, setSelectedCardId]);

  return {
    cards,
    selectedCardId,
    selectedCardIds,
    editingCardId,
    createCard,
    createCardAtPosition,
    updateCardContent,
    moveCard,
    updateCardPosition,
    updateCardSize,
    setSelectedCardId,
    setEditingCardId,
    setCardsData,
    changeLayoutAlgorithm,
    getLayoutSettings,
    selectCard, // 添加新的选择函数
    selectCards, // 添加批量选择函数
    clearSelection, // 添加清除选择函数
    moveMultipleCards, // 添加批量移动函数
    deleteCards, // 添加批量删除函数
    handleCardsDelete, // 添加处理卡片删除操作的函数
    toggleCardSelection, // 添加这个新函数到返回对象中
    selectNextCard,
  };
};
