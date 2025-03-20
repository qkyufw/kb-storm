import { useCallback, useEffect, useRef } from 'react';
import { ICard, IConnection } from '../../types/CoreTypes';

/**
 * 选择和删除操作钩子函数
 */
export const useDeleteOperation = (
  cards: ICard[],
  selectedCardIds: string[],
  selectedConnectionIds: string[],
  deleteCard: (cardId: string) => void,
  deleteCardConnections: (cardId: string) => void,
  deleteConnection: (connectionId: string) => void,
  clearSelection: () => void,
  clearConnectionSelection: () => void,
  deleteCards?: (cardIds: string[]) => void // 添加可选的批量删除方法
) => {
  // 添加一个引用来跟踪是否正在处理删除操作
  const isProcessingDelete = useRef(false);
  
  // 修改删除处理逻辑，实现一次性批量删除
  const handleDelete = useCallback(() => {
    // 如果已经在处理删除，则忽略此次调用
    if (isProcessingDelete.current) {
      return;
    }
    
    // 标记为正在处理删除
    isProcessingDelete.current = true;
    
    // 如果没有选中项，直接返回
    if (selectedCardIds.length === 0 && selectedConnectionIds.length === 0) {
      isProcessingDelete.current = false;
      return;
    }
    
    // 复制一份当前选择的卡片和连接线ID，避免状态变化影响删除过程
    const cardsToDelete = [...selectedCardIds];
    const connectionsToDelete = [...selectedConnectionIds];
    
   
    // 首先删除连接线，避免连接线状态变更影响卡片删除
    if (connectionsToDelete.length > 0) {
      connectionsToDelete.forEach(connectionId => {
        deleteConnection(connectionId);
      });
      
      // 在删除卡片前先清除连接线选择状态
      clearConnectionSelection();
    }
    
    // 使用批量删除API删除卡片（如果可用）
    if (cardsToDelete.length > 0) {
      // 在删除卡片前，先删除所有相关连接
      cardsToDelete.forEach(cardId => {
        deleteCardConnections(cardId);
      });
      
      try {
        // 然后再单独处理卡片删除
        if (deleteCards) {
          // 使用批量删除功能
          deleteCards(cardsToDelete);
        } else {
          // 逐个删除卡片
          for (const cardId of cardsToDelete) {
            deleteCard(cardId);
          }
        }
      } finally {
        // 无论成功失败，都清除选择状态
        clearSelection();
        // 重置处理状态
        isProcessingDelete.current = false;
      }
    } else {
      isProcessingDelete.current = false;
    }
  }, [selectedCardIds, selectedConnectionIds, deleteCardConnections, deleteCard, deleteConnection, clearSelection, clearConnectionSelection, deleteCards]);

  // 监听键盘删除事件，确保我们只使用一个删除路径
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && 
          (selectedCardIds.length > 0 || selectedConnectionIds.length > 0)) {
        e.preventDefault();
        handleDelete();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDelete, selectedCardIds, selectedConnectionIds]);

  return {
    handleDelete
  };
};
