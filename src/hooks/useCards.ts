// 卡片管理Hook
import { useState, useCallback } from 'react';
import { ICard, IPosition, ISize } from '../types';
import { getRandomColor } from '../utils/colorUtils';
import { calculateNewCardPosition, LayoutAlgorithm, LayoutOptions } from '../utils/layoutUtils';

export const useCards = () => {
  const [cards, setCards] = useState<ICard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
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
  
  return {
    cards,
    selectedCardId,
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
    getLayoutSettings
  };
};
