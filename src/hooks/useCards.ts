// 卡片管理Hook
import { useState, useCallback } from 'react';
import { debugLog } from '../utils/debugUtils';
import { ICard, IPosition, ISize } from '../types';
import { getRandomColor } from '../utils/colorUtils';
import { calculateNewCardPosition, LayoutAlgorithm, LayoutOptions } from '../utils/layoutUtils';

export const useCards = () => {
  const [cards, setCards] = useState<ICard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]); // 添加多选数组
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [lastCardPosition, setLastCardPosition] = useState<IPosition>({ x: 100, y: 100 });
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<LayoutAlgorithm>('random'); // 设置默认为随机布局
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>({
    spacing: 180,
    jitter: 10  // 降低默认抖动值，使布局更整齐
  });
  
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
  }, [lastCardPosition, cards, layoutAlgorithm, layoutOptions]);
  
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
  }, []);
  
  // 更新卡片内容
  const updateCardContent = useCallback((cardId: string, content: string) => {
    setCards(prevCards => 
      prevCards.map(card => 
        card.id === cardId ? { ...card, content } : card
      )
    );
  }, []);
  
  // 删除卡片
  const deleteCard = useCallback((cardId: string) => {
    setCards(prevCards => prevCards.filter(card => card.id !== cardId));
    
    if (selectedCardId === cardId) {
      setSelectedCardId(null);
    }
    if (editingCardId === cardId) {
      setEditingCardId(null);
    }
    setSelectedCardIds(prev => prev.filter(id => id !== cardId));
  }, [selectedCardId, editingCardId]);
  
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
  }, []);
  
  // 批量选择卡片
  const selectCards = useCallback((cardIds: string[]) => {
    setSelectedCardIds(cardIds);
    setSelectedCardId(cardIds.length > 0 ? cardIds[cardIds.length - 1] : null);
  }, []);
  
  // 清除所有选择
  const clearSelection = useCallback(() => {
    setSelectedCardId(null);
    setSelectedCardIds([]);
  }, []);
  
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
  
  // 批量删除卡片
  const deleteCards = useCallback((cardIds: string[]) => {
    setCards(prevCards => {
      const remainCards = prevCards.filter(card => !cardIds.includes(card.id));
      return remainCards;
    });

    setSelectedCardIds(prev => {
      const remainSelected = prev.filter(id => !cardIds.includes(id));
      return remainSelected;
    });

    if (selectedCardId && cardIds.includes(selectedCardId)) {
      setSelectedCardId(null);
    }

    if (editingCardId && cardIds.includes(editingCardId)) {
      setEditingCardId(null);
    }
  }, [selectedCardId, editingCardId]);

  return {
    cards,
    selectedCardId,
    selectedCardIds, // 返回多选数组
    editingCardId,
    createCard,
    createCardAtPosition,
    updateCardContent,
    deleteCard,
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
    deleteCards // 添加批量删除函数
  };
};
