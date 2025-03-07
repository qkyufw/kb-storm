// 位置计算相关工具
import { ICard, IPosition, ISize } from '../types';

/**
 * 计算新卡片的位置
 */
export const calculateNewCardPosition = (
  lastPosition: IPosition,
  mapSize: ISize,
  gridSize: number = 180
): IPosition => {
  let { x, y } = lastPosition;
  
  // 移动到下一个网格位置
  x += gridSize;
  
  // 如果到达边界，换行
  if (x > mapSize.width - gridSize) {
    x = 100;
    y += gridSize;
  }
  
  // 如果已经填满了可视区域，重新从左上角开始
  if (y > mapSize.height - gridSize) {
    x = 100;
    y = 100;
  }
  
  // 添加随机偏移
  const offsetX = Math.random() * 30 - 15;
  const offsetY = Math.random() * 30 - 15;
  
  return { x: x + offsetX, y: y + offsetY };
};

/**
 * 查找指定方向上最近的卡片
 */
export const findNearestCardInDirection = (
  currentCard: ICard,
  cards: ICard[],
  direction: 'up' | 'down' | 'left' | 'right'
): ICard | null => {
  if (cards.length <= 1) return null;
  
  const { x: currentX, y: currentY } = currentCard;
  
  // 根据方向筛选可能的卡片
  let possibleCards = cards.filter(card => {
    if (card.id === currentCard.id) return false;
    
    // 根据方向确定筛选条件
    switch (direction) {
      case 'up':
        return card.y < currentY;
      case 'down':
        return card.y > currentY;
      case 'left':
        return card.x < currentX;
      case 'right':
        return card.x > currentX;
      default:
        return false;
    }
  });
  
  if (possibleCards.length === 0) return null;
  
  // 计算每张卡片的距离
  const cardsWithDistance = possibleCards.map(card => {
    let distance;
    switch (direction) {
      case 'up':
      case 'down':
        // 垂直方向优先考虑y轴距离，但也要考虑x轴
        distance = Math.pow(card.y - currentY, 2) + Math.pow(card.x - currentX, 2) * 0.5;
        break;
      case 'left':
      case 'right':
        // 水平方向优先考虑x轴距离，但也要考虑y轴
        distance = Math.pow(card.x - currentX, 2) + Math.pow(card.y - currentY, 2) * 0.5;
        break;
      default:
        distance = 0;
    }
    return { card, distance };
  });
  
  // 找到最近的卡片
  cardsWithDistance.sort((a, b) => a.distance - b.distance);
  return cardsWithDistance[0].card;
};

/**
 * 计算指定方向上的新卡片位置
 */
export const calculateConnectedCardPosition = (
  sourceCard: ICard,
  direction: 'up' | 'down' | 'left' | 'right',
  distance: number = 180
): IPosition => {
  const { x, y } = sourceCard;
  
  switch (direction) {
    case 'up':
      return { x, y: y - distance };
    case 'down':
      return { x, y: y + distance };
    case 'left':
      return { x: x - distance, y };
    case 'right':
      return { x: x + distance, y };
    default:
      return { x, y };
  }
};
