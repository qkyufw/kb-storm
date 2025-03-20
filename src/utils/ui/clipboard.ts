import { ICard, IConnection } from '../../types/CoreTypes';

/**
 * 深拷贝函数
 */
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * 创建卡片和连接线的副本
 */
export const createCardCopies = (
  cards: ICard[], 
  cardIds: string[],
  offset: { x: number, y: number } = { x: 50, y: 50 }
): { newCards: ICard[], idMap: Record<string, string> } => {
  const idMap: Record<string, string> = {};
  const sourceCards = cards.filter(card => cardIds.includes(card.id));
  
  const newCards = sourceCards.map(card => {
    const newId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    idMap[card.id] = newId;
    
    return {
      ...deepClone(card),
      id: newId,
      x: card.x + offset.x,
      y: card.y + offset.y
    };
  });
  
  return { newCards, idMap };
};

/**
 * 创建连接线的副本
 */
export const createConnectionCopies = (
  connections: IConnection[],
  connectionIds: string[],
  idMap: Record<string, string>
): IConnection[] => {
  // 筛选选中的连接线
  const sourceConnections = connections.filter(conn => connectionIds.includes(conn.id));
  
  // 创建连接线副本
  return sourceConnections
    .map(conn => {
      // 只有当连接线两端的卡片都存在于idMap中才创建副本
      if (idMap[conn.startCardId] && idMap[conn.endCardId]) {
        return {
          ...deepClone(conn),
          id: `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          startCardId: idMap[conn.startCardId],
          endCardId: idMap[conn.endCardId]
        };
      }
      return null;
    })
    .filter(conn => conn !== null) as IConnection[];
};

/**
 * 计算卡片组的中心点
 */
export const calculateCardsCenter = (cards: ICard[]): { x: number, y: number } => {
  if (cards.length === 0) {
    return { x: 0, y: 0 };
  }
  
  const sumX = cards.reduce((sum, card) => sum + card.x + card.width/2, 0);
  const sumY = cards.reduce((sum, card) => sum + card.y + card.height/2, 0);
  
  return {
    x: sumX / cards.length,
    y: sumY / cards.length
  };
};
