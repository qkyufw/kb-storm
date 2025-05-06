import { useCallback, useState } from 'react';
import { useMindMapCore } from './useMindMapCore';
import { createCardMovementHandlers } from '../../handlers/cardInteractionHandlers';
import { saveMindMapToStorage, loadMindMapFromStorage } from '../../utils/storageUtils';

// 中央状态钩子
export const useCentralState = () => {
  const core = useMindMapCore();
  const { cards, connections, history } = core;
  
  // 保存思维导图
  const saveMindMap = useCallback(() => {
    saveMindMapToStorage({ 
      cards: cards.cards, 
      connections: connections.connections 
    });
  }, [cards.cards, connections.connections]);
  
  // 加载思维导图
  const loadMindMap = useCallback(() => {
    const data = loadMindMapFromStorage();
    if (data) {
      cards.setCardsData(data.cards);
      connections.setConnectionsData(data.connections);
      cards.setSelectedCardId(null);
      history.addToHistory();
    }
  }, [cards, connections, history]);
  
  // 连续移动卡片的处理函数
  const { startContinuousMove, stopContinuousMove } = createCardMovementHandlers(
    cards.selectedCardId,
    cards.moveCard,
    (interval) => {
      if (core.moveInterval) clearInterval(core.moveInterval);
      core.setMoveInterval(interval);
    }
  );
  
  // 创建连接卡片的函数
  const createConnectedCard = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!cards.selectedCardId) return;
    
    const selectedCard = cards.cards.find(c => c.id === cards.selectedCardId);
    if (!selectedCard) return;
    
    // 计算新卡片位置
    const offset = 180; // 卡片间距
    let newPosition = { x: selectedCard.x, y: selectedCard.y };
    
    switch (direction) {
      case 'up':
        newPosition.y -= offset;
        break;
      case 'down':
        newPosition.y += offset;
        break;
      case 'left':
        newPosition.x -= offset;
        break;
      case 'right':
        newPosition.x += offset;
        break;
    }
    
    // 创建新卡片
    const newCard = cards.createCardAtPosition(newPosition);
    
    // 创建连接线
    const newConnection = {
      id: `conn-${Date.now()}`,
      startCardId: cards.selectedCardId,
      endCardId: newCard.id,
      label: ''
    };
    
    connections.setConnectionsData([...connections.connections, newConnection]);
    
    // 选择新创建的卡片
    cards.setSelectedCardId(newCard.id);
    cards.setEditingCardId(newCard.id);
    
    return newCard;
  }, [cards, connections]);
  
  // 根据方向选择最近的卡片
  const selectNearestCard = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!cards.selectedCardId) return;
    
    const selectedCard = cards.cards.find(c => c.id === cards.selectedCardId);
    if (!selectedCard) return;
    
    let nearestCardId: string | null = null;
    let minDistance = Infinity;
    
    cards.cards.forEach(card => {
      if (card.id === cards.selectedCardId) return;
      
      const xDiff = card.x - selectedCard.x;
      const yDiff = card.y - selectedCard.y;
      
      // 根据方向过滤卡片
      if (
        (direction === 'up' && yDiff >= 0) ||
        (direction === 'down' && yDiff <= 0) ||
        (direction === 'left' && xDiff >= 0) ||
        (direction === 'right' && xDiff <= 0)
      ) {
        return;
      }
      
      // 计算距离
      const distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCardId = card.id;
      }
    });
    
    if (nearestCardId) {
      cards.setSelectedCardId(nearestCardId);
    }
  }, [cards.cards, cards.selectedCardId, cards.setSelectedCardId]);
  
  // 自由连线模式状态
  const [freeConnectionMode, setFreeConnectionMode] = useState(false);
  
  return {
    ...core,
    // 添加新的函数
    saveMindMap,
    loadMindMap,
    startContinuousMove,
    stopContinuousMove,
    createConnectedCard,
    selectNearestCard,
    setFreeConnectionMode,
    freeConnectionMode
  };
};
