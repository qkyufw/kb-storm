import { useCardStore } from '../../store/cardStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useHistoryStore } from '../../store/historyStore';
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

  // 使用 store 中的 createConnection 方法，它包含重复检查逻辑
  const newConnection = connections.createConnection(startCardId, endCardId);

  if (newConnection) {
    // 只有成功创建连接时才添加到历史记录
    history.addToHistory();
  } else {
    console.log('连接创建失败：可能是重复连线或其他原因');
  }
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
  
  // 这里可以使用calculateConnectionPoints函数来帮助寻找最近的卡片
  const nearestCard = findNearestCardInDirection(
    currentCard,
    possibleTargets,
    direction
  );
  
  return nearestCard?.id || null;
};
