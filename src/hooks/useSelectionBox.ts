import { useState, useCallback } from 'react';
import { ICard, IConnection } from '../types/CoreTypes';

/**
 * 选区框操作钩子函数
 */
export const useSelectionBox = (
  cards: ICard[],
  connections: IConnection[],
  zoomLevel: number,
  pan: { x: number, y: number },
  selectCards: (cardIds: string[]) => void
) => {
  // 添加选区相关状态
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    visible: boolean;
  }>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    visible: false
  });

  // 启动选区创建
  const startSelectionBox = useCallback((canvasX: number, canvasY: number) => {
    setSelectionBox({
      startX: canvasX,
      startY: canvasY,
      endX: canvasX,
      endY: canvasY,
      visible: true
    });
  }, []);

  // 更新选区
  const updateSelectionBox = useCallback((canvasX: number, canvasY: number) => {
    setSelectionBox(prev => ({
      ...prev,
      endX: canvasX,
      endY: canvasY
    }));
  }, []);

  // 结束选区
  const endSelectionBox = useCallback(() => {
    setSelectionBox(prev => ({ ...prev, visible: false }));
  }, []);

  // 获取选区中的卡片
  const getCardsInSelectionBox = useCallback(() => {
    if (!selectionBox.visible) return [];

    // 确保选区坐标正确（兼容从任意方向拖动）
    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const right = Math.max(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const bottom = Math.max(selectionBox.startY, selectionBox.endY);

    // 找出所有在选区内的卡片
    return cards.filter(card => {
      // 计算卡片边界
      const cardLeft = card.x;
      const cardRight = card.x + card.width;
      const cardTop = card.y;
      const cardBottom = card.y + card.height;

      // 检查是否有重叠
      return (
        cardRight >= left &&
        cardLeft <= right &&
        cardBottom >= top &&
        cardTop <= bottom
      );
    }).map(card => card.id);
  }, [selectionBox, cards]);

  // 获取选区中的连接线
  const getConnectionsInSelectionBox = useCallback(() => {
    if (!selectionBox.visible) return [];

    // 确保选区坐标正确（兼容从任意方向拖动）
    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const right = Math.max(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const bottom = Math.max(selectionBox.startY, selectionBox.endY);

    // 找出所有线的中点在选区内的连接线
    return connections.filter(connection => {
      const startCard = cards.find(card => card.id === connection.startCardId);
      const endCard = cards.find(card => card.id === connection.endCardId);
      
      if (!startCard || !endCard) return false;
      
      // 计算连接线的中点
      const midX = (startCard.x + startCard.width/2 + endCard.x + endCard.width/2) / 2;
      const midY = (startCard.y + startCard.height/2 + endCard.y + endCard.height/2) / 2;
      
      // 检查中点是否在选区内
      return midX >= left && midX <= right && midY >= top && midY <= bottom;
    }).map(connection => connection.id);
  }, [selectionBox, connections, cards]);

  // 计算选区框样式
  const getSelectionBoxStyle = useCallback(() => {
    if (!selectionBox.visible) return {};

    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const width = Math.abs(selectionBox.endX - selectionBox.startX);
    const height = Math.abs(selectionBox.endY - selectionBox.endY);

    return {
      position: 'absolute' as 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      border: '2px dashed #4285f4',
      backgroundColor: 'rgba(66, 133, 244, 0.1)',
      pointerEvents: 'none' as 'none',
      zIndex: 5
    };
  }, [selectionBox]);

  // 从屏幕坐标转换为画布坐标
  const screenToCanvasCoordinates = useCallback((clientX: number, clientY: number, rect: DOMRect) => {
    const canvasX = (clientX - rect.left - pan.x) / zoomLevel;
    const canvasY = (clientY - rect.top - pan.y) / zoomLevel;
    return { x: canvasX, y: canvasY };
  }, [pan, zoomLevel]);

    // 选择所有卡片
    const selectAllCards = useCallback(() => {
      const allCardIds = cards.map(card => card.id);
      selectCards(cards.map(card => card.id));
    }, [cards, selectCards]);

  return {
    selectionBox,
    selectAllCards,
    startSelectionBox,
    updateSelectionBox,
    endSelectionBox,
    getCardsInSelectionBox,
    getConnectionsInSelectionBox,
    getSelectionBoxStyle,
    screenToCanvasCoordinates
  };
};
