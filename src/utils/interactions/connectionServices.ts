import { useCardStore } from '../../store/cardStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useHistoryStore } from '../../store/historyStore';
import { IConnection } from '../../types/CoreTypes';
import { findNearestCardInDirection } from '../../utils/cardPositioning';

/**
 * 创建连接线服务
 */
export const createConnectionService = (
  startCardId: string | null, 
  endCardId: string | null,
  points: { x: number; y: number; }[] = []
): void => {
  if (!startCardId || !endCardId || startCardId === endCardId) return;
  
  const history = useHistoryStore.getState();
  const connections = useConnectionStore.getState();
  
  // 创建新的连接 - 修改为使用lastArrowType
  const newConnection: IConnection = {
    id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    startCardId,
    endCardId,
    label: '',
    arrowType: connections.lastArrowType  // 使用最后选择的箭头类型
  };
  
  connections.setConnectionsData([...connections.connections, newConnection]);
  history.addToHistory();
};

/**
 * 查找指定方向上的最近卡片服务
 */
export const findNearestCardService = (
  currentCardId: string, 
  direction: 'up' | 'down' | 'left' | 'right'
): string | null => {
  const cards = useCardStore.getState();
  const connections = useConnectionStore.getState();
  
  const currentCard = cards.cards.find(card => card.id === currentCardId);
  if (!currentCard) return null;
  
  const possibleTargets = cards.cards.filter(card => 
    card.id !== currentCardId && 
    card.id !== connections.connectionStart
  );
  
  const nearestCard = findNearestCardInDirection(
    currentCard,
    possibleTargets,
    direction
  );
  
  return nearestCard?.id || null;
};
