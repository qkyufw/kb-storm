// 位置计算相关工具
import { ICard, IPosition, ISize } from '../types';
import { calculateNewCardPosition } from './layoutUtils';

// 既有的位置计算函数被移到了layoutUtils.ts中，这里提供向后兼容性
export { calculateNewCardPosition };

/**
 * 查找指定方向上最近的卡片
 */
export const findNearestCardInDirection = (
  currentCard: ICard,
  cards: ICard[],
  direction: 'up' | 'down' | 'left' | 'right'
): ICard | null => {
  if (cards.length <= 1) return null;
  
  const { x: currentX, y: currentY, width: currentWidth, height: currentHeight } = currentCard;
  const currentCenterX = currentX + currentWidth / 2;
  const currentCenterY = currentY + currentHeight / 2;
  
  // 根据方向筛选可能的卡片
  let possibleCards = cards.filter(card => {
    if (card.id === currentCard.id) return false;
    
    const cardCenterX = card.x + card.width / 2;
    const cardCenterY = card.y + card.height / 2;
    
    // 根据方向确定筛选条件，使用更精确的扇形区域判断
    switch (direction) {
      case 'up':
        // 上方 120° 扇形区域内的卡片
        return cardCenterY < currentCenterY && 
               Math.abs(cardCenterX - currentCenterX) < Math.abs(cardCenterY - currentCenterY) * 2;
      case 'down':
        // 下方 120° 扇形区域内的卡片
        return cardCenterY > currentCenterY && 
               Math.abs(cardCenterX - currentCenterX) < Math.abs(cardCenterY - currentCenterY) * 2;
      case 'left':
        // 左方 120° 扇形区域内的卡片
        return cardCenterX < currentCenterX && 
               Math.abs(cardCenterY - currentCenterY) < Math.abs(cardCenterX - currentCenterX) * 2;
      case 'right':
        // 右方 120° 扇形区域内的卡片
        return cardCenterX > currentCenterX && 
               Math.abs(cardCenterY - currentCenterY) < Math.abs(cardCenterX - currentCenterX) * 2;
      default:
        return false;
    }
  });
  
  if (possibleCards.length === 0) return null;
  
  // 计算每张卡片的距离和方向优先级
  const cardsWithScore = possibleCards.map(card => {
    const cardCenterX = card.x + card.width / 2;
    const cardCenterY = card.y + card.height / 2;
    
    // 计算欧几里得距离
    const distance = Math.sqrt(
      Math.pow(cardCenterX - currentCenterX, 2) + 
      Math.pow(cardCenterY - currentCenterY, 2)
    );
    
    // 计算方向精确度（越接近指定方向，分数越低）
    let directionScore;
    switch (direction) {
      case 'up':
      case 'down':
        // 垂直方向优先，横向偏差越小越好
        directionScore = Math.abs(cardCenterX - currentCenterX) / Math.max(1, Math.abs(cardCenterY - currentCenterY));
        break;
      case 'left':
      case 'right':
        // 水平方向优先，纵向偏差越小越好
        directionScore = Math.abs(cardCenterY - currentCenterY) / Math.max(1, Math.abs(cardCenterX - currentCenterX));
        break;
      default:
        directionScore = 0;
    }
    
    // 最终分数 = 距离 × (1 + 方向因子)
    const finalScore = distance * (1 + directionScore);
    
    return { card, finalScore };
  });
  
  // 按最终分数排序，选择分数最低的卡片
  cardsWithScore.sort((a, b) => a.finalScore - b.finalScore);
  return cardsWithScore[0].card;
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
