import { useState, useCallback } from 'react';
import { ICard } from '../types/CoreTypes';

// 用于处理卡片移动的自定义钩子
export const useCardMovement = (
  selectedCardId: string | null,
  moveCard: (cardId: string, deltaX: number, deltaY: number) => void
) => {
  const [moveInterval, setMoveInterval] = useState<NodeJS.Timeout | null>(null);

  // 移动选中的卡片
  const moveSelectedCard = useCallback((deltaX: number, deltaY: number, isLargeStep: boolean) => {
    if (!selectedCardId) return;
    const step = isLargeStep ? 30 : 10;
    moveCard(selectedCardId, deltaX * step, deltaY * step);
  }, [selectedCardId, moveCard]);

  // 开始持续移动
  const startContinuousMove = useCallback((deltaX: number, deltaY: number, isLargeStep: boolean) => {
    // 先清除可能存在的定时器
    if (moveInterval) {
      clearInterval(moveInterval);
    }
    
    // 首先执行一次移动，避免延迟感
    moveSelectedCard(deltaX, deltaY, isLargeStep);
    
    // 设置连续移动
    const interval = setInterval(() => {
      moveSelectedCard(deltaX, deltaY, isLargeStep);
    }, 100); // 每100ms移动一次
    
    setMoveInterval(interval);
  }, [moveSelectedCard, moveInterval]);

  // 停止持续移动
  const stopContinuousMove = useCallback(() => {
    if (moveInterval) {
      clearInterval(moveInterval);
      setMoveInterval(null);
    }
  }, [moveInterval]);

  return {
    moveSelectedCard,
    startContinuousMove,
    stopContinuousMove,
    moveInterval
  };
};

export default useCardMovement;
