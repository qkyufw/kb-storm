import { useMemo } from 'react';
import { ICard, IPosition, ISize } from '../../types/CoreTypes';

/**
 * 视口信息类型
 */
export interface ViewportInfo {
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  pan: { x: number; y: number };
}

/**
 * 缓存的视口计算结果
 */
export interface CachedViewportCalculations {
  // 可见区域计算
  visibleArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  // 画布坐标转换函数
  screenToCanvas: (screenX: number, screenY: number) => IPosition;
  canvasToScreen: (canvasX: number, canvasY: number) => IPosition;
  
  // 可见性检查
  isCardVisible: (card: ICard) => boolean;
  isPointVisible: (point: IPosition) => boolean;
  
  // 布局计算
  getRandomPositionInViewport: (margin?: number, cardSize?: ISize) => IPosition;
}

/**
 * 优化的视口计算hook，使用useMemo缓存复杂计算
 */
export const useOptimizedViewport = (
  mapRef: React.RefObject<HTMLDivElement | null>,
  viewportInfo: ViewportInfo
): CachedViewportCalculations => {
  
  // 缓存可见区域计算
  const visibleArea = useMemo(() => {
    const { viewportWidth, viewportHeight, zoom, pan } = viewportInfo;
    
    // 计算视口在画布中的实际尺寸（考虑缩放）
    const width = viewportWidth / zoom;
    const height = viewportHeight / zoom;
    
    // 计算视口左上角在画布中的坐标（考虑平移）
    const x = -pan.x / zoom;
    const y = -pan.y / zoom;
    
    return { x, y, width, height };
  }, [viewportInfo.viewportWidth, viewportInfo.viewportHeight, viewportInfo.zoom, viewportInfo.pan.x, viewportInfo.pan.y]);
  
  // 缓存坐标转换函数
  const coordinateTransforms = useMemo(() => {
    const { zoom, pan } = viewportInfo;
    
    const screenToCanvas = (screenX: number, screenY: number): IPosition => {
      const rect = mapRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      
      return {
        x: (screenX - rect.left - pan.x) / zoom,
        y: (screenY - rect.top - pan.y) / zoom
      };
    };
    
    const canvasToScreen = (canvasX: number, canvasY: number): IPosition => {
      const rect = mapRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      
      return {
        x: canvasX * zoom + pan.x + rect.left,
        y: canvasY * zoom + pan.y + rect.top
      };
    };
    
    return { screenToCanvas, canvasToScreen };
  }, [mapRef, viewportInfo.zoom, viewportInfo.pan.x, viewportInfo.pan.y]);
  
  // 缓存可见性检查函数
  const visibilityChecks = useMemo(() => {
    const isCardVisible = (card: ICard): boolean => {
      // 检查卡片是否与可见区域相交
      return !(
        card.x + card.width < visibleArea.x ||
        card.x > visibleArea.x + visibleArea.width ||
        card.y + card.height < visibleArea.y ||
        card.y > visibleArea.y + visibleArea.height
      );
    };
    
    const isPointVisible = (point: IPosition): boolean => {
      return (
        point.x >= visibleArea.x &&
        point.x <= visibleArea.x + visibleArea.width &&
        point.y >= visibleArea.y &&
        point.y <= visibleArea.y + visibleArea.height
      );
    };
    
    return { isCardVisible, isPointVisible };
  }, [visibleArea]);
  
  // 缓存布局计算函数
  const layoutCalculations = useMemo(() => {
    const getRandomPositionInViewport = (
      margin: number = 20,
      cardSize: ISize = { width: 160, height: 80 }
    ): IPosition => {
      // 计算可用于放置卡片的区域
      const availableX = visibleArea.x + margin;
      const availableY = visibleArea.y + margin;
      const availableWidth = visibleArea.width - 2 * margin - cardSize.width;
      const availableHeight = visibleArea.height - 2 * margin - cardSize.height;
      
      // 确保有足够的空间
      if (availableWidth <= 0 || availableHeight <= 0) {
        return {
          x: visibleArea.x + margin,
          y: visibleArea.y + margin
        };
      }
      
      return {
        x: availableX + Math.random() * availableWidth,
        y: availableY + Math.random() * availableHeight
      };
    };
    
    return { getRandomPositionInViewport };
  }, [visibleArea]);
  
  return {
    visibleArea,
    ...coordinateTransforms,
    ...visibilityChecks,
    ...layoutCalculations
  };
};

/**
 * 缓存卡片边界计算
 */
export const useCardsBounds = (cards: ICard[]) => {
  return useMemo(() => {
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
    
    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }, [cards]);
};

/**
 * 缓存平移到卡片区域的计算
 */
export const usePanToFitCards = (
  cards: ICard[],
  viewportInfo: ViewportInfo,
  margin: number = 20
) => {
  const cardsBounds = useCardsBounds(cards);
  
  return useMemo(() => {
    if (!cardsBounds) return null;
    
    // 计算需要的平移量，使最左上角的卡片位于视口左上角（考虑边距）
    const targetX = margin;
    const targetY = margin;
    
    // 计算平移量：目标位置 - 当前位置，然后乘以缩放比例
    const panX = (targetX - cardsBounds.minX) * viewportInfo.zoom;
    const panY = (targetY - cardsBounds.minY) * viewportInfo.zoom;
    
    return { x: panX, y: panY };
  }, [cardsBounds, viewportInfo.zoom, margin]);
};
