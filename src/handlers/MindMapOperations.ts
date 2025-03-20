// 操作函数集合

/**
 * 提供思维导图操作的通用函数
 */
import { IPosition, ICard, IConnection } from '../types/CoreTypes';

/**
 * 获取元素中心位置
 */
export const getElementCenter = (element: ICard): IPosition => {
  return {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2
  };
};

/**
 * 计算两点间的距离
 */
export const calculateDistance = (point1: IPosition, point2: IPosition): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * 检查区域是否重叠
 */
export const checkOverlap = (
  rect1: { x: number, y: number, width: number, height: number },
  rect2: { x: number, y: number, width: number, height: number }
): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

/**
 * 自动调整卡片位置，避免重叠
 */
export const autoArrangeCards = (cards: ICard[], spacing: number = 20): ICard[] => {
  if (cards.length <= 1) return cards;
  
  // 排序卡片确保处理顺序一致
  const sortedCards = [...cards].sort((a, b) => a.y - b.y || a.x - b.x);
  
  // 创建新数组以存储调整后的卡片
  const adjustedCards: ICard[] = [];
  
  // 添加第一张卡片
  adjustedCards.push({ ...sortedCards[0] });
  
  // 为每张卡片找到不重叠的位置
  for (let i = 1; i < sortedCards.length; i++) {
    let newCard = { ...sortedCards[i] };
    let overlapping = true;
    let attempts = 0;
    
    while (overlapping && attempts < 10) {
      overlapping = false;
      
      // 检查与已调整卡片的重叠
      for (const adjCard of adjustedCards) {
        if (checkOverlap(
          { x: newCard.x - spacing, y: newCard.y - spacing, 
            width: newCard.width + 2 * spacing, height: newCard.height + 2 * spacing },
          adjCard
        )) {
          overlapping = true;
          
          // 移到右侧和下方
          newCard.x += adjCard.width + spacing;
          newCard.y += 10;
          break;
        }
      }
      
      attempts++;
    }
    
    adjustedCards.push(newCard);
  }
  
  return adjustedCards;
};

/**
 * 识别卡片间的关系模式
 */
export const identifyRelationships = (
  cards: ICard[],
  connections: IConnection[]
): { centralCardIds: string[], leafCardIds: string[] } => {
  // 计算每张卡片的连接数
  const connectionCounts: Record<string, { incoming: number, outgoing: number }> = {};
  
  cards.forEach(card => {
    connectionCounts[card.id] = { incoming: 0, outgoing: 0 };
  });
  
  connections.forEach(conn => {
    if (connectionCounts[conn.startCardId]) {
      connectionCounts[conn.startCardId].outgoing++;
    }
    if (connectionCounts[conn.endCardId]) {
      connectionCounts[conn.endCardId].incoming++;
    }
  });
  
  // 识别中心卡片（有多个出连接）和叶子卡片（只有入连接）
  const centralCardIds: string[] = [];
  const leafCardIds: string[] = [];
  
  Object.entries(connectionCounts).forEach(([cardId, counts]) => {
    if (counts.outgoing > 2) {
      centralCardIds.push(cardId);
    }
    if (counts.incoming > 0 && counts.outgoing === 0) {
      leafCardIds.push(cardId);
    }
  });
  
  return { centralCardIds, leafCardIds };
};

/**
 * 批量操作卡片
 */
export const batchOperateCards = (
  cards: ICard[],
  cardIds: string[],
  operation: (card: ICard) => ICard
): ICard[] => {
  return cards.map(card => 
    cardIds.includes(card.id) ? operation(card) : card
  );
};
