import { ICard, IConnection, IPosition } from '../../types/CoreTypes';
import { generateUniqueCardId, generateUniqueConnectionId } from '../idGenerator';

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
    const newId = generateUniqueCardId();
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
          id: generateUniqueConnectionId(),
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

/**
 * 粘贴服务 - 计算鼠标位置并执行粘贴
 * 合并自 interactions/clipboardServices.ts
 */
export const calculatePastePosition = (
  mapRef: React.RefObject<HTMLDivElement | null>,
  pan: { x: number, y: number },
  zoomLevel: number,
  viewportInfo: { viewportWidth: number, viewportHeight: number }
): IPosition => {
  // 计算鼠标位置
  let mousePosition: IPosition;

  if (mapRef.current) {
    // 尝试从全局事件获取鼠标位置
    const lastEvent = window.event as MouseEvent;
    if (lastEvent && lastEvent.clientX) {
      const rect = mapRef.current.getBoundingClientRect();
      mousePosition = {
        x: (lastEvent.clientX - rect.left - pan.x) / zoomLevel,
        y: (lastEvent.clientY - rect.top - pan.y) / zoomLevel
      };
    } else {
      // 回退到视口中心
      mousePosition = {
        x: (viewportInfo.viewportWidth / 2 - pan.x) / zoomLevel,
        y: (viewportInfo.viewportHeight / 2 - pan.y) / zoomLevel
      };
    }
  } else {
    // 如果没有参考点，使用默认坐标
    mousePosition = { x: 100, y: 100 };
  }

  return mousePosition;
};
