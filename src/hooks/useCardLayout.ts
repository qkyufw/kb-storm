import { useState, useCallback } from 'react';
import { ICard, ISize } from '../types';
import { calculateNewCardPosition, LayoutAlgorithm, LayoutOptions } from '../utils/layoutUtils';

/**
 * 卡片布局管理钩子
 */
export const useCardLayout = (
  cards: ICard[],
  getMapSize: () => ISize,
  initialAlgorithm: LayoutAlgorithm = 'grid',
  initialOptions: LayoutOptions = { spacing: 180, jitter: 5 }
) => {
  // 布局算法状态
  const [layoutAlgorithm, setLayoutAlgorithm] = useState<LayoutAlgorithm>(initialAlgorithm);
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>(initialOptions);
  
  // 计算新卡片位置
  const calculateCardPosition = useCallback((
    lastPosition: { x: number, y: number },
    viewportInfo?: {
      viewportWidth: number,
      viewportHeight: number,
      zoom: number,
      pan: { x: number, y: number }
    }
  ) => {
    return calculateNewCardPosition(
      lastPosition,
      getMapSize(),
      cards,
      layoutAlgorithm,
      layoutOptions,
      viewportInfo
    );
  }, [cards, getMapSize, layoutAlgorithm, layoutOptions]);
  
  // 更改布局算法
  const changeLayout = useCallback((algorithm: LayoutAlgorithm, options?: LayoutOptions) => {
    setLayoutAlgorithm(algorithm);
    if (options) {
      setLayoutOptions(prev => ({ ...prev, ...options }));
    }
  }, []);
  
  // 获取当前布局设置
  const getCurrentLayout = useCallback(() => {
    return {
      algorithm: layoutAlgorithm,
      options: layoutOptions
    };
  }, [layoutAlgorithm, layoutOptions]);
  
  return {
    layoutAlgorithm,
    layoutOptions,
    calculateCardPosition,
    changeLayout,
    getCurrentLayout
  };
};

export default useCardLayout;
