import { IPosition, ISize, ICard } from '../types/CoreTypes';
import { getRandomColor } from './ui/colors';

/**
 * 定义不同的卡片布局算法类型 - 删除了tree类型
 */
export type LayoutAlgorithm = 
  'grid' | 
  'random' | 
  'spiral' | 
  'circular';

/**
 * 默认布局配置
 */
export interface LayoutOptions {
  spacing?: number;
  jitter?: number;
  direction?: 'clockwise' | 'counterclockwise';
  startAngle?: number;
  levels?: number;
}

/**
 * 完全随机布局 - 在可视区域内随机分布，但避免边缘
 * 修改为使用当前视口范围而不是整个地图大小
 */
export const randomLayout = (
  lastPosition: IPosition,
  mapSize: ISize,
  existingCards: ICard[] = [],
  options: LayoutOptions = {},
  viewportInfo?: { 
    viewportWidth: number, 
    viewportHeight: number, 
    zoom: number, 
    pan: { x: number, y: number } 
  }
): IPosition => {
  // 使用视口信息计算可见区域
  let availableWidth, availableHeight, offsetX, offsetY;
  
  if (viewportInfo) {
    // 计算视口在画布中的实际尺寸（考虑缩放）
    availableWidth = viewportInfo.viewportWidth / viewportInfo.zoom;
    availableHeight = viewportInfo.viewportHeight / viewportInfo.zoom;
    
    // 计算视口左上角在画布中的坐标（考虑平移）
    // 重要：这里是负值，因为平移是相反方向
    offsetX = -viewportInfo.pan.x / viewportInfo.zoom;
    offsetY = -viewportInfo.pan.y / viewportInfo.zoom;
  } else {
    // 没有视口信息时，使用默认地图尺寸
    availableWidth = mapSize.width;
    availableHeight = mapSize.height;
    offsetX = 0;
    offsetY = 0;
  }
  console.log("视口信息:", viewportInfo);
  
  // 边缘边距，避免卡片生成在边缘位置
  const margin = 80; 
  
  // 避免卡片重叠的最小距离
  const minDistanceToOtherCards = 150;
  
  // 确保在真正可见的区域内生成卡片
  const visibleAreaX = offsetX;
  const visibleAreaY = offsetY;
  const visibleAreaWidth = availableWidth;
  const visibleAreaHeight = availableHeight;
  
  // 初始化变量并提供默认值
  let x: number = visibleAreaX + margin + Math.random() * (visibleAreaWidth - 2 * margin);
  let y: number = visibleAreaY + margin + Math.random() * (visibleAreaHeight - 2 * margin);
  let attempts = 0;
  let validPosition = false;
  
  // 尝试找到一个不会和已有卡片重叠的位置
  while (!validPosition && attempts < 30) {
    // 生成随机位置，在视口范围内
    x = visibleAreaX + margin + Math.random() * (visibleAreaWidth - 2 * margin);
    y = visibleAreaY + margin + Math.random() * (visibleAreaHeight - 2 * margin);
    
    // 检查与现有卡片的距离
    validPosition = true;
    for (const card of existingCards) {
      const distance = Math.sqrt(
        Math.pow(card.x - x, 2) + Math.pow(card.y - y, 2)
      );
      
      if (distance < minDistanceToOtherCards) {
        validPosition = false;
        break;
      }
    }
    
    attempts++;
  }
  
  console.log("生成卡片在视口中的位置:", { x, y });
  return { x, y };
};


/**
 * 根据指定的算法计算新卡片的位置
 */
export const calculateNewCardPosition = (
  lastPosition: IPosition,
  mapSize: ISize,
  existingCards: ICard[] = [],
  algorithm: LayoutAlgorithm = 'random',
  options: LayoutOptions = {},
  viewportInfo?: { 
    viewportWidth: number, 
    viewportHeight: number, 
    zoom: number, 
    pan: { x: number, y: number } 
  }
): IPosition => {
  switch (algorithm) {
    case 'random':
    default:
      return randomLayout(lastPosition, mapSize, existingCards, options, viewportInfo);
  }
};

/**
 * 创建新卡片
 */
export const createNewCard = (
  position: IPosition, 
  content: string = '新建卡片'
): ICard => {
  return {
    id: `card-${Date.now()}`,
    content,
    x: position.x,
    y: position.y,
    width: 160,
    height: 80,
    color: getRandomColor(),
  };
};
