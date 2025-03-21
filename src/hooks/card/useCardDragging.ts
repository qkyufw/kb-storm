import { useCallback } from 'react';

/**
 * 处理卡片拖动相关逻辑
 */
export const useCardDragging = (
  zoomLevel: number,
  moveCard: (cardId: string, deltaX: number, deltaY: number) => void,
  moveMultipleCards: (cardIds: string[], deltaX: number, deltaY: number) => void
) => {
  // 处理单个卡片移动，应用缩放因子
  const handleCardMove = useCallback((cardId: string, deltaX: number, deltaY: number) => {
    const scaledDeltaX = deltaX / zoomLevel;
    const scaledDeltaY = deltaY / zoomLevel;
    moveCard(cardId, scaledDeltaX, scaledDeltaY);
  }, [moveCard, zoomLevel]);

  // 处理多个卡片同时移动，应用缩放因子
  const handleMultipleCardMove = useCallback((cardIds: string[], deltaX: number, deltaY: number) => {
    const scaledDeltaX = deltaX / zoomLevel;
    const scaledDeltaY = deltaY / zoomLevel;
    moveMultipleCards(cardIds, scaledDeltaX, scaledDeltaY);
  }, [moveMultipleCards, zoomLevel]);

  return {
    handleCardMove,
    handleMultipleCardMove
  };
};

export default useCardDragging;
