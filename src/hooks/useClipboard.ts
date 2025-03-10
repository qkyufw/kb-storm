import { useState, useCallback } from 'react';
import { ICard, IConnection } from '../types';

/**
 * 剪贴板操作钩子函数
 */
export const useClipboard = (
  cards: ICard[],
  connections: IConnection[],
  selectedCardIds: string[],
  selectedConnectionIds: string[],
  deleteCards: (cardIds: string[]) => void,
  deleteSelectedConnections: () => void,
  clearSelection: () => void,
  clearConnectionSelection: () => void,
  setCardsData: (cards: ICard[]) => void,
  setConnectionsData: (connections: IConnection[]) => void,
  selectCards: (cardIds: string[]) => void
) => {
  // 剪贴板状态
  const [clipboard, setClipboard] = useState<{
    cards: ICard[],
    connections: IConnection[]
  }>({ cards: [], connections: [] });

  // 复制选中的卡片和连接线
  const handleCopy = useCallback(() => {
    // 复制选中的卡片
    const cardsToCopy = cards.filter(card => selectedCardIds.includes(card.id));
    
    // 复制选中的连接线
    const connectionsToCopy = connections.filter(conn => 
      selectedConnectionIds.includes(conn.id) || 
      (selectedCardIds.includes(conn.startCardId) && selectedCardIds.includes(conn.endCardId))
    );
    
    // 保存到剪贴板
    setClipboard({
      cards: JSON.parse(JSON.stringify(cardsToCopy)), // 深拷贝
      connections: JSON.parse(JSON.stringify(connectionsToCopy)) // 深拷贝
    });
  }, [cards, connections, selectedCardIds, selectedConnectionIds]);
  
  // 剪切选中的卡片和连接线
  const handleCut = useCallback(() => {
    // 先复制
    const cardsToCopy = cards.filter(card => selectedCardIds.includes(card.id));
    const connectionsToCopy = connections.filter(conn => 
      selectedConnectionIds.includes(conn.id) || 
      (selectedCardIds.includes(conn.startCardId) && selectedCardIds.includes(conn.endCardId))
    );
    
    // 保存到剪贴板
    setClipboard({
      cards: JSON.parse(JSON.stringify(cardsToCopy)),
      connections: JSON.parse(JSON.stringify(connectionsToCopy))
    });
    
    // 删除选中的卡片
    if (selectedCardIds.length > 0) {
      deleteCards(selectedCardIds);
    }
    
    // 删除选中的连接线
    if (selectedConnectionIds.length > 0) {
      deleteSelectedConnections();
    }
    
    // 清除选择
    clearSelection();
    clearConnectionSelection();
  }, [cards, connections, selectedCardIds, selectedConnectionIds, deleteCards, deleteSelectedConnections, clearSelection, clearConnectionSelection]);
  
  // 粘贴卡片和连接线到鼠标位置
  const handlePaste = useCallback((mousePosition: { x: number, y: number }) => {
    if (clipboard.cards.length === 0 && clipboard.connections.length === 0) {
      return;
    }
    
    // 生成新ID的映射
    const idMap: Record<string, string> = {};
    
    // 计算卡片的中心位置
    const centerX = clipboard.cards.reduce((sum, card) => sum + card.x + card.width/2, 0) / Math.max(1, clipboard.cards.length);
    const centerY = clipboard.cards.reduce((sum, card) => sum + card.y + card.height/2, 0) / Math.max(1, clipboard.cards.length);
    
    // 计算偏移量使卡片组中心对准鼠标位置
    const offsetX = mousePosition.x - centerX;
    const offsetY = mousePosition.y - centerY;
    
    // 粘贴卡片，生成新ID并偏移位置
    const newCards = clipboard.cards.map(card => {
      const newId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      idMap[card.id] = newId;
      
      return {
        ...card,
        id: newId,
        x: card.x + offsetX,
        y: card.y + offsetY
      };
    });
    
    // 粘贴连接线，更新引用的卡片ID
    const newConnections = clipboard.connections.map(conn => {
      const newId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 只有当连接的两端卡片都在新粘贴的卡片中时才创建新连接
      if (idMap[conn.startCardId] && idMap[conn.endCardId]) {
        return {
          ...conn,
          id: newId,
          startCardId: idMap[conn.startCardId],
          endCardId: idMap[conn.endCardId]
        };
      }
      return null;
    }).filter(conn => conn !== null) as IConnection[];
    
    // 更新状态
    setCardsData([...cards, ...newCards]);
    setConnectionsData([...connections, ...newConnections]);
    
    // 选择新粘贴的卡片
    selectCards(newCards.map(card => card.id));
  }, [clipboard, cards, connections, setCardsData, setConnectionsData, selectCards]);

  return {
    handleCopy,
    handleCut,
    handlePaste
  };
};
