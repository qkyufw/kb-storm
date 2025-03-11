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
  selectConnections: (connectionIds: string[]) => void,
  deleteCards?: (cardIds: string[]) => void // 添加可选的批量删除方法
) => {
  // 修改删除处理逻辑，实现一次性批量删除
  const handleDelete = useCallback(() => {
    // 保存要删除的ID，避免状态变化导致删除不完整
    const cardsToDelete = [...selectedCardIds];
    const connectionsToDelete = [...selectedConnectionIds];
    
    // 如果选中了卡片，优先处理卡片
    if (cardsToDelete.length > 0) {
      // 如果有批量删除API，优先使用
      if (deleteCards) {
        // 先删除所有相关连接线
        cardsToDelete.forEach(cardId => {
          deleteCardConnections(cardId);
        });
        
        // 一次性批量删除所有卡片
        deleteCards(cardsToDelete);
        
        clearSelection();
      } else {
        // 如果没有批量API，则逐个删除
        cardsToDelete.forEach(cardId => {
          deleteCardConnections(cardId);
          deleteCard(cardId);
        });
        
        clearSelection();
      }
    }
    
    // 删除所有选中的连接线
    if (connectionsToDelete.length > 0) {
      connectionsToDelete.forEach(connectionId => {
        deleteConnection(connectionId);
      });
      
      clearConnectionSelection();
    }
  }, [selectedCardIds, selectedConnectionIds, deleteCardConnections, deleteCard, deleteConnection, clearSelection, clearConnectionSelection, deleteCards]);

  // 选择所有卡片
  const selectAllCards = useCallback(() => {
    selectCards(cards.map(card => card.id));
  }, [cards, selectCards]);

  return {
    handleDelete,
    selectAllCards
  };
};
