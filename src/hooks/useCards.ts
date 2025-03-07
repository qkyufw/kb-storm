// 卡片管理Hook
import { useState, useCallback } from 'react';
import { ICard, IPosition, ISize } from '../types';
import { getRandomColor } from '../utils/colorUtils';
import { calculateNewCardPosition } from '../utils/positionUtils';

export const useCards = () => {
  const [cards, setCards] = useState<ICard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [lastCardPosition, setLastCardPosition] = useState<IPosition>({ x: 100, y: 100 });
  
  // 创建新卡片
  const createCard = useCallback((mapSize: ISize) => {
    const position = calculateNewCardPosition(lastCardPosition, mapSize);
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
  }, [lastCardPosition]);
  
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
    setCardsData
  };
};
