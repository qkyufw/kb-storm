import { useCallback } from 'react';
import { ICard, IConnection } from '../types';

/**
 * 选择和删除操作钩子函数
 */
export const useSelection = (
  cards: ICard[],
  selectedCardIds: string[],
  selectedConnectionIds: string[],
  deleteCard: (cardId: string) => void,
  deleteCardConnections: (cardId: string) => void,
  deleteConnection: (connectionId: string) => void,
  clearSelection: () => void,
  clearConnectionSelection: () => void,
  selectCards: (cardIds: string[]) => void,
  selectConnections: (connectionIds: string[]) => void
) => {
  // 修改删除处理逻辑，支持批量删除
  const handleDelete = useCallback(() => {
    // 如果选中了卡片，一次性删除所有选中的卡片
    if (selectedCardIds.length > 0) {
      // 对每个卡片删除其连接线
      selectedCardIds.forEach(cardId => {
        deleteCardConnections(cardId);
      });
      
      // 然后删除所有卡片
      selectedCardIds.forEach(cardId => {
        deleteCard(cardId);
      });
      
      clearSelection();
    }
    
    // 如果选中了连接线，一次性删除所有选中的连接线
    if (selectedConnectionIds.length > 0) {
      selectedConnectionIds.forEach(connectionId => {
        deleteConnection(connectionId);
      });
      
      clearConnectionSelection();
    }
  }, [selectedCardIds, selectedConnectionIds, deleteCard, deleteCardConnections, deleteConnection, clearSelection, clearConnectionSelection]);

  // 选择所有卡片
  const selectAllCards = useCallback(() => {
    selectCards(cards.map(card => card.id));
  }, [cards, selectCards]);

  return {
    handleDelete,
    selectAllCards
  };
};
