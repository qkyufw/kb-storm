import { useCallback } from 'react';

/**
 * 处理卡片拖动时的缩放计算
 */
export const useCardDragging = (
  zoomLevel: number,
  moveCard: (cardId: string, deltaX: number, deltaY: number) => void,
  moveMultipleCards: (cardIds: string[], deltaX: number, deltaY: number) => void
) => {
  const handleCardMove = useCallback((cardId: string, deltaX: number, deltaY: number) => {
    const scaledDeltaX = deltaX / zoomLevel;
    const scaledDeltaY = deltaY / zoomLevel;
    moveCard(cardId, scaledDeltaX, scaledDeltaY);
  }, [moveCard, zoomLevel]);

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