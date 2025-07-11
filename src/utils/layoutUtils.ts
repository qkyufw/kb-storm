import { IPosition, ISize, ICard } from '../types/CoreTypes';
import { getRandomColor } from './ui/colors';
import i18n from '../i18n';

// 移除复杂的缓存机制，简化代码

/**
 * 布局算法类型 - 目前只支持随机布局
 */
export type LayoutAlgorithm = 'random';

/**
 * 布局配置选项
 */
export interface LayoutOptions {
  spacing?: number;
  jitter?: number;
}

/**
 * 完全随机布局 - 在可视区域内随机分布，确保整个卡片都在可视区域内
 * 修改为使用当前视口范围而不是整个地图大小
 */
export const randomLayout = (
  _lastPosition: IPosition, // 前缀下划线表示未使用
  mapSize: ISize,
  existingCards: ICard[] = [],
  _options: LayoutOptions = {}, // 前缀下划线表示未使用
  viewportInfo?: {
    viewportWidth: number,
    viewportHeight: number,
    zoom: number,
    pan: { x: number, y: number }
  },
  cardSize: ISize = { width: 160, height: 80 } // 新增卡片尺寸参数
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
  const margin = 20;

  // 避免卡片重叠的最小距离
  const minDistanceToOtherCards = 150;

  // 计算可用于放置卡片的区域（确保整个卡片都在可视区域内）
  const visibleAreaX = offsetX + margin;
  const visibleAreaY = offsetY + margin;
  const visibleAreaWidth = availableWidth - 2 * margin - cardSize.width;
  const visibleAreaHeight = availableHeight - 2 * margin - cardSize.height;

  // 确保有足够的空间放置卡片
  if (visibleAreaWidth <= 0 || visibleAreaHeight <= 0) {
    console.warn("可视区域太小，无法完整放置卡片，使用默认位置");
    return {
      x: offsetX + margin,
      y: offsetY + margin
    };
  }

  // 计算严格的边界限制
  const minX = offsetX + margin;
  const minY = offsetY + margin;
  const maxX = offsetX + availableWidth - margin - cardSize.width;
  const maxY = offsetY + availableHeight - margin - cardSize.height;

  // 初始化变量并提供默认值
  let x: number = minX;
  let y: number = minY;
  let attempts = 0;
  let validPosition = false;

  // 尝试找到一个不会和已有卡片重叠的位置
  while (!validPosition && attempts < 30) {
    // 生成随机位置，使用严格的边界限制
    if (visibleAreaWidth > 0 && visibleAreaHeight > 0) {
      x = visibleAreaX + Math.random() * visibleAreaWidth;
      y = visibleAreaY + Math.random() * visibleAreaHeight;
    } else {
      // 如果可用区域太小，使用最小安全位置
      x = minX;
      y = minY;
    }

    // 额外的边界安全检查
    x = Math.max(minX, Math.min(x, maxX));
    y = Math.max(minY, Math.min(y, maxY));

    // 检查与现有卡片的距离（使用卡片中心点计算距离）
    validPosition = true;
    const newCardCenterX = x + cardSize.width / 2;
    const newCardCenterY = y + cardSize.height / 2;

    for (const card of existingCards) {
      const existingCardCenterX = card.x + card.width / 2;
      const existingCardCenterY = card.y + card.height / 2;

      const distance = Math.sqrt(
        Math.pow(existingCardCenterX - newCardCenterX, 2) +
        Math.pow(existingCardCenterY - newCardCenterY, 2)
      );

      if (distance < minDistanceToOtherCards) {
        validPosition = false;
        break;
      }
    }

    attempts++;
  }

  // 最终边界验证和修正
  const actualViewportRight = offsetX + availableWidth;
  const actualViewportBottom = offsetY + availableHeight;

  // 最终的安全边界检查
  const finalMinX = offsetX + margin;
  const finalMinY = offsetY + margin;
  const finalMaxX = actualViewportRight - margin - cardSize.width;
  const finalMaxY = actualViewportBottom - margin - cardSize.height;

  // 确保卡片完全在边界内
  x = Math.max(finalMinX, Math.min(x, finalMaxX));
  y = Math.max(finalMinY, Math.min(y, finalMaxY));

  // 验证最终位置
  const finalCardRight = x + cardSize.width;
  const finalCardBottom = y + cardSize.height;
  const isValid =
    x >= finalMinX &&
    y >= finalMinY &&
    finalCardRight <= actualViewportRight - margin &&
    finalCardBottom <= actualViewportBottom - margin;

  console.log("卡片位置验证:", {
    position: { x: x.toFixed(1), y: y.toFixed(1) },
    cardBounds: {
      right: finalCardRight.toFixed(1),
      bottom: finalCardBottom.toFixed(1)
    },
    viewportBounds: {
      right: (actualViewportRight - margin).toFixed(1),
      bottom: (actualViewportBottom - margin).toFixed(1)
    },
    isValid
  });

  return { x, y };
};


/**
 * 计算所有卡片的边界框
 */
export const calculateCardsBounds = (cards: ICard[]): {
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
} | null => {
  if (cards.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  cards.forEach(card => {
    minX = Math.min(minX, card.x);
    minY = Math.min(minY, card.y);
    maxX = Math.max(maxX, card.x + card.width);
    maxY = Math.max(maxY, card.y + card.height);
  });

  return { minX, minY, maxX, maxY };
};

/**
 * 计算将卡片区域定位到视口左上角的平移量
 */
export const calculatePanToFitCards = (
  cards: ICard[],
  viewportInfo: {
    viewportWidth: number,
    viewportHeight: number,
    zoom: number
  },
  margin: number = 20
): IPosition | null => {
  const bounds = calculateCardsBounds(cards);
  if (!bounds) return null;

  // 计算需要的平移量，使最左上角的卡片位于视口左上角（考虑边距）
  const targetX = margin;
  const targetY = margin;

  // 计算平移量：目标位置 - 当前位置，然后乘以缩放比例
  const panX = (targetX - bounds.minX) * viewportInfo.zoom;
  const panY = (targetY - bounds.minY) * viewportInfo.zoom;

  return { x: panX, y: panY };
};

/**
 * 计算新卡片的位置（使用随机布局）
 */
export const calculateNewCardPosition = (
  lastPosition: IPosition,
  mapSize: ISize,
  existingCards: ICard[] = [],
  _algorithm: LayoutAlgorithm = 'random', // 前缀下划线表示未使用
  options: LayoutOptions = {},
  viewportInfo?: {
    viewportWidth: number,
    viewportHeight: number,
    zoom: number,
    pan: { x: number, y: number }
  },
  cardSize: ISize = { width: 160, height: 80 }
): IPosition => {
  // 目前只支持随机布局，直接调用randomLayout
  return randomLayout(lastPosition, mapSize, existingCards, options, viewportInfo, cardSize);
};

/**
 * 创建新卡片
 */
export const createNewCard = (
  position: IPosition,
  content?: string
): ICard => {
  const defaultContent = content || (i18n.t as any)('card.defaultContent') || '新建卡片';
  return {
    id: `card-${Date.now()}`,
    content: defaultContent,
    x: position.x,
    y: position.y,
    width: 160,
    height: 80,
    color: getRandomColor(),
  };
};
