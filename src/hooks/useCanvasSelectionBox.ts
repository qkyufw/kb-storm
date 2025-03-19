import { useState, useCallback } from 'react';
import { ICard, IConnection } from '../types';

interface SelectionBoxHookProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoomLevel: number;
  pan: { x: number, y: number };
  cards: ICard[];
  connections: IConnection[];
}

/**
 * 处理选择框相关逻辑的Hook
 */
export const useCanvasSelectionBox = ({ 
  canvasRef, 
  zoomLevel, 
  pan, 
  cards, 
  connections 
}: SelectionBoxHookProps) => {
  // 选择框状态
  const [selectionBox, setSelectionBox] = useState({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    visible: false
  });

  // 选择框刚刚结束标记
  const [selectionJustEnded, setSelectionJustEnded] = useState(false);

  // 开始选择框
  const startSelectionBox = useCallback((x: number, y: number) => {
    setSelectionBox({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      visible: true
    });
  }, []);

  // 更新选择框
  const updateSelectionBox = useCallback((x: number, y: number) => {
    setSelectionBox(prev => ({
      ...prev,
      endX: x,
      endY: y
    }));
  }, []);

  // 结束选择框
  const endSelectionBox = useCallback(() => {
    setSelectionBox(prev => ({ ...prev, visible: false }));
  }, []);

  // 获取选择框内的卡片
  const getCardsInSelectionBox = useCallback(() => {
    if (!selectionBox.visible) return [];

    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const right = Math.max(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const bottom = Math.max(selectionBox.startY, selectionBox.endY);

    return cards.filter(card => {
      const cardLeft = card.x;
      const cardRight = card.x + card.width;
      const cardTop = card.y;
      const cardBottom = card.y + card.height;

      return (
        cardLeft >= left &&
        cardRight <= right &&
        cardTop >= top &&
        cardBottom <= bottom
      );
    }).map(card => card.id);
  }, [selectionBox, cards]);

  // 获取选择框内的连接线
  const getConnectionsInSelectionBox = useCallback(() => {
    if (!selectionBox.visible) return [];

    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const right = Math.max(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const bottom = Math.max(selectionBox.startY, selectionBox.endY);

    return connections.filter(connection => {
      const startCard = cards.find(card => card.id === connection.startCardId);
      const endCard = cards.find(card => card.id === connection.endCardId);
      
      if (!startCard || !endCard) return false;
      
      // 计算连接线中点
      const midX = (startCard.x + startCard.width/2 + endCard.x + endCard.width/2) / 2;
      const midY = (startCard.y + startCard.height/2 + endCard.y + endCard.height/2) / 2;
      
      return midX >= left && midX <= right && midY >= top && midY <= bottom;
    }).map(connection => connection.id);
  }, [selectionBox, connections, cards]);

  // 计算选择框样式
  const getSelectionBoxStyle = useCallback(() => {
    if (!selectionBox.visible) return {};

    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const width = Math.abs(selectionBox.endX - selectionBox.startX);
    const height = Math.abs(selectionBox.endY - selectionBox.startY);

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

  // 坐标转换工具
  const screenToCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoomLevel;
    const y = (clientY - rect.top - pan.y) / zoomLevel;
    return { x, y };
  }, [canvasRef, pan, zoomLevel]);

  return {
    selectionBox,
    selectionJustEnded,
    setSelectionJustEnded,
    startSelectionBox,
    updateSelectionBox,
    endSelectionBox,
    getCardsInSelectionBox,
    getConnectionsInSelectionBox,
    getSelectionBoxStyle,
    screenToCanvasCoordinates
  };
};
