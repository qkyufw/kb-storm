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
  // 删除选中的单个元素而不是所有
  const handleDelete = useCallback(() => {
    // 如果只选中了一个卡片，只删除它
    if (selectedCardIds.length === 1) {
      const cardId = selectedCardIds[0];
      deleteCardConnections(cardId);
      deleteCard(cardId);
      clearSelection();
    }
    // 如果只选中了一个连接线，只删除它
    else if (selectedConnectionIds.length === 1) {
      const connectionId = selectedConnectionIds[0];
      deleteConnection(connectionId);
      clearConnectionSelection();
    }
    // 如果同时选中了多个元素，优先删除卡片
    else if (selectedCardIds.length > 0) {
      const cardId = selectedCardIds[0];
      deleteCardConnections(cardId);
      deleteCard(cardId);
      selectCards(selectedCardIds.filter(id => id !== cardId));
    }
    else if (selectedConnectionIds.length > 0) {
      const connectionId = selectedConnectionIds[0];
      deleteConnection(connectionId);
      selectConnections(selectedConnectionIds.filter(id => id !== connectionId));
    }
  }, [selectedCardIds, selectedConnectionIds, deleteCard, deleteCardConnections, deleteConnection, clearSelection, clearConnectionSelection, selectCards, selectConnections]);

  // 选择所有卡片
  const selectAllCards = useCallback(() => {
    selectCards(cards.map(card => card.id));
  }, [cards, selectCards]);

  return {
    handleDelete,
    selectAllCards
  };
};
