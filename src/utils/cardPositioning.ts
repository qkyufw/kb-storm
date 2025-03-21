// 位置计算相关工具
import { ICard, IPosition } from '../types/CoreTypes';
import { calculateNewCardPosition } from './layoutUtils';

// 既有的位置计算函数被移到了layoutUtils.ts中，这里提供向后兼容性
export { calculateNewCardPosition };

/**
 * 查找指定方向上最近的卡片
 * 增强版功能，可以排除特定卡片并优化搜索角度
 */
export const findNearestCardInDirection = (
  currentCard: ICard,
  cards: ICard[],
  direction: 'up' | 'down' | 'left' | 'right'
): ICard | null => {
  if (cards.length <= 1) return null;
  
  // 获取当前卡片中心点
  const { x: currentX, y: currentY, width: currentWidth, height: currentHeight } = currentCard;
  const currentCenterX = currentX + currentWidth / 2;
  const currentCenterY = currentY + currentHeight / 2;
  
  // 根据方向筛选可能的卡片
  let possibleCards = cards.filter(card => {
    if (card.id === currentCard.id) return false;
    
    const cardCenterX = card.x + card.width / 2;
    const cardCenterY = card.y + card.height / 2;
    
    // 使用更宽的扇形区域，增加方向180°扇形区域内的卡片作为候选
    switch (direction) {
      case 'up':
        // 上方 180° 扇形区域内的卡片
        return cardCenterY < currentCenterY;
      case 'down':
        // 下方 180° 扇形区域内的卡片
        return cardCenterY > currentCenterY;
      case 'left':
        // 左方 180° 扇形区域内的卡片
        return cardCenterX < currentCenterX;
      case 'right':
        // 右方 180° 扇形区域内的卡片
        return cardCenterX > currentCenterX;
      default:
        return false;
    }
  });
  
  if (possibleCards.length === 0) return null;
  
  // 计算每张卡片的方向得分和距离
  const cardsWithScore = possibleCards.map(card => {
    const cardCenterX = card.x + card.width / 2;
    const cardCenterY = card.y + card.height / 2;
    
    // 计算欧几里得距离
    const distance = Math.sqrt(
      Math.pow(cardCenterX - currentCenterX, 2) + 
      Math.pow(cardCenterY - currentCenterY, 2)
    );
    
    // 计算方向精确度（使用余弦相似度）
    let directionScore;
    let dx = cardCenterX - currentCenterX;
    let dy = cardCenterY - currentCenterY;
    
    // 根据方向计算方向得分（越小越符合方向）
    switch (direction) {
      case 'up':
        // y越小越接近上方，x越接近中心越好
        directionScore = Math.abs(dx) / Math.max(1, -dy);
        break;
      case 'down':
        // y越大越接近下方，x越接近中心越好
        directionScore = Math.abs(dx) / Math.max(1, dy);
        break;
      case 'left':
        // x越小越接近左方，y越接近中心越好
        directionScore = Math.abs(dy) / Math.max(1, -dx);
        break;
      case 'right':
        // x越大越接近右方，y越接近中心越好
        directionScore = Math.abs(dy) / Math.max(1, dx);
        break;
      default:
        directionScore = 0;
    }
    
    // 最终得分 = 距离 × (1 + 方向因子)
    // 增加权重因子，使当前方向上的卡片更可能被选中
    const finalScore = distance * (1 + directionScore * 0.5);
    
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
