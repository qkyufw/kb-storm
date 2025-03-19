import { IPosition, ISize, ICard } from '../types/CoreTypes';
import { getRandomColor } from './colorUtils';

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
 * 网格布局 - 整齐的矩阵排列
 */
export const gridLayout = (
  lastPosition: IPosition,
  mapSize: ISize,
  existingCards: ICard[] = [],
  options: LayoutOptions = {}
): IPosition => {
  const spacing = options.spacing || 200;
  const jitter = options.jitter || 10;
  
  // 计算当前网格行列数
  const gridColumns = Math.floor(mapSize.width / spacing);
  const cardsCount = existingCards.length;
  
  // 计算当前应该在的行和列
  const col = cardsCount % gridColumns;
  const row = Math.floor(cardsCount / gridColumns);
  
  // 计算位置，从左上角开始排列
  const baseX = 120;
  const baseY = 100;
  
  const x = baseX + col * spacing;
  const y = baseY + row * spacing;
  
  // 添加轻微的随机偏移，使布局更自然
  const offsetX = Math.random() * jitter * 2 - jitter;
  const offsetY = Math.random() * jitter * 2 - jitter;
  
  return { x: x + offsetX, y: y + offsetY };
};

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
  let availableWidth: number, availableHeight: number, offsetX: number, offsetY: number;
  
  if (viewportInfo && viewportInfo.viewportWidth && viewportInfo.viewportHeight) {
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
 * 螺旋布局 - 以优化的黄金螺旋形式扩展
 */
export const spiralLayout = (
  lastPosition: IPosition,
  mapSize: ISize,
  existingCards: ICard[],
  options: LayoutOptions = {}
): IPosition => {
  const centerX = mapSize.width / 2;
  const centerY = mapSize.height / 2;
  const spacing = options.spacing || 120;
  
  // 使用黄金角度phi创建更均匀的螺旋
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 约137.5度
  const idx = existingCards.length;
  
  // 螺旋参数 - 随卡片数量增长的半径
  const radius = spacing * Math.sqrt(idx) * 0.7;
  const angle = idx * goldenAngle;
  
  // 应用螺旋公式计算坐标
  const x = centerX + radius * Math.cos(angle);
  const y = centerY + radius * Math.sin(angle);
  
  // 添加小幅度随机偏移使布局更自然
  const jitter = options.jitter || 5;
  const offsetX = Math.random() * jitter * 2 - jitter;
  const offsetY = Math.random() * jitter * 2 - jitter;
  
  return { x: x + offsetX, y: y + offsetY };
};

/**
 * 环形布局 - 多环同心圆，均匀分布
 */
export const circularLayout = (
  lastPosition: IPosition,
  mapSize: ISize,
  existingCards: ICard[],
  options: LayoutOptions = {}
): IPosition => {
  const centerX = mapSize.width / 2;
  const centerY = mapSize.height / 2;
  const spacing = options.spacing || 180;
  
  // 确定每个环可以容纳的卡片数量
  const determineCardsPerRing = (ringIdx: number): number => {
    // 环半径随着环索引增加
    const ringRadius = spacing * (ringIdx + 1);
    
    // 根据环的周长估算可以容纳的卡片数量
    const ringCircumference = 2 * Math.PI * ringRadius;
    
    // 假设卡片宽度约为160，加上30的间距
    const cardWidth = 190;
    
    // 计算环中可以容纳的卡片数量
    return Math.max(1, Math.floor(ringCircumference / cardWidth));
  };
  
  // 计算当前卡片应该在哪个环
  let ringIdx = 0;
  let cardsInPrevRings = 0;
  let cardsPerCurrentRing = determineCardsPerRing(ringIdx);
  
  while (cardsInPrevRings + cardsPerCurrentRing <= existingCards.length) {
    cardsInPrevRings += cardsPerCurrentRing;
    ringIdx++;
    cardsPerCurrentRing = determineCardsPerRing(ringIdx);
  }
  
  // 计算此卡片在当前环中的索引
  const cardIdxInRing = existingCards.length - cardsInPrevRings;
  
  // 计算半径和角度
  const ringRadius = spacing * (ringIdx + 1);
  const angleStep = 2 * Math.PI / cardsPerCurrentRing;
  // 为了使环中的第一个卡片不总是出现在同一位置，添加相对于环索引的偏移
  const angleOffset = (ringIdx % 2) * (angleStep / 2); 
  const angle = cardIdxInRing * angleStep + angleOffset;
  
  // 计算坐标
  const x = centerX + ringRadius * Math.cos(angle);
  const y = centerY + ringRadius * Math.sin(angle);
  
  // 添加微小随机偏移，使布局更自然
  const jitter = options.jitter || 5;
  const offsetX = Math.random() * jitter * 2 - jitter;
  const offsetY = Math.random() * jitter * 2 - jitter;
  
  return { x: x + offsetX, y: y + offsetY };
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
    case 'grid':
      return gridLayout(lastPosition, mapSize, existingCards, options);
    case 'spiral':
      return spiralLayout(lastPosition, mapSize, existingCards, options);
    case 'circular':
      return circularLayout(lastPosition, mapSize, existingCards, options);
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
