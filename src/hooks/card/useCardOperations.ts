import { useCallback } from 'react';
import { ICard, IPosition, IConnection } from '../../types/CoreTypes';
import { calculateConnectedCardPosition } from '../../utils/positionUtils';

// 用于处理卡片操作的高级操作
export const useCardOperations = (
  cards: ICard[],
  connections: IConnection[],
  selectedCardId: string | null,
  createCardAtPosition: (position: IPosition) => ICard,
  setConnectionsData: (connections: IConnection[]) => void,
  setSelectedCardId: (id: string | null) => void
) => {
  // 创建连接卡片
  const createConnectedCard = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const selectedCard = cards.find(card => card.id === selectedCardId);
    if (!selectedCard) return;
    
    const position = calculateConnectedCardPosition(selectedCard, direction);
    const newCard = createCardAtPosition(position);
    
    // 创建连线
    const connection = {
      id: `conn-${Date.now()}`,
      startCardId: selectedCardId!,
      endCardId: newCard.id,
    };
    
    setConnectionsData([...connections, connection]);
    return newCard;
  }, [cards, connections, selectedCardId, createCardAtPosition, setConnectionsData]);

  // 按方位选择最近的卡片功能封装在这里
  // ...可以添加其他卡片操作功能

  return {
    createConnectedCard
  };
};

export default useCardOperations;
