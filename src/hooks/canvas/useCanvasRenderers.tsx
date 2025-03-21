import React, { useCallback } from 'react';
import { ICard } from '../../types/CoreTypes';

interface CanvasRenderersProps {
  cards: ICard[];
  connectionMode: boolean;
  connectionStart: string | null;
  connectionTargetCardId: string | null;
  freeConnectionMode: boolean;
  drawingLine: boolean;
  lineStartPoint: { x: number, y: number, cardId: string | null };
  currentMousePosition: { x: number, y: number };
  handleMouseDown: (e: React.MouseEvent<Element, MouseEvent>) => void;
  handleMouseMove: (e: React.MouseEvent<Element, MouseEvent>) => void;
  handleMouseUp: (e: React.MouseEvent<Element, MouseEvent>) => void;
  drawLayerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * 负责Canvas中各种元素的渲染
 */
export const useCanvasRenderers = ({
  cards,
  connectionMode,
  connectionStart,
  connectionTargetCardId,
  freeConnectionMode,
  drawingLine,
  lineStartPoint,
  currentMousePosition,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  drawLayerRef
}: CanvasRenderersProps) => {
  
  // // 渲染临时连接线
  // const renderTemporaryConnection = useCallback(() => {
  //   if (!connectionMode || !connectionTargetCardId) return null;
    
  //   const startCard = cards.find(card => card.id === connectionStart);
  //   const endCard = cards.find(card => card.id === connectionTargetCardId);
    
  //   if (!startCard || !endCard) return null;
    
  //   const startX = startCard.x + startCard.width / 2;
  //   const startY = startCard.y + startCard.height / 2;
  //   const endX = endCard.x + endCard.width / 2;
  //   const endY = endCard.y + endCard.height / 2;
    
  //   return (
  //     <svg
  //       className="temporary-connection"
  //       style={{
  //         position: 'absolute',
  //         top: 0,
  //         left: 0,
  //         width: '100%',
  //         height: '100%',
  //         pointerEvents: 'none',
  //         zIndex: 2
  //       }}
  //     >
  //       <path
  //         d={`M ${startX} ${startY} L ${endX} ${endY}`}
  //         stroke="#4285f4"
  //         strokeWidth={2}
  //         strokeDasharray="5,5"
  //         fill="none"
  //       />
  //     </svg>
  //   );
  // }, [connectionMode, connectionStart, connectionTargetCardId, cards]);

  // // 渲染自由连接线
  // const renderFreeConnectionLine = useCallback(() => {
  //   if (!drawingLine || !freeConnectionMode) return null;
    
  //   return (
  //     <svg 
  //       className="free-connection-line" 
  //       style={{
  //         position: 'absolute',
  //         top: 0, 
  //         left: 0, 
  //         width: '100%', 
  //         height: '100%', 
  //         pointerEvents: 'none',
  //         zIndex: 999
  //       }}
  //     >
  //       <path
  //         d={`M ${lineStartPoint.x} ${lineStartPoint.y} 
  //            C ${lineStartPoint.x + Math.abs((currentMousePosition.x - lineStartPoint.x) / 2)} ${lineStartPoint.y},
  //              ${currentMousePosition.x - Math.abs((currentMousePosition.x - lineStartPoint.x) / 2)} ${currentMousePosition.y}, 
  //              ${currentMousePosition.x} ${currentMousePosition.y}`}
  //         stroke="#4285f4"
  //         strokeWidth={2}
  //         strokeDasharray="5,5"
  //         fill="none"
  //       />
  //       <polygon
  //         points={`${currentMousePosition.x},${currentMousePosition.y} 
  //                 ${currentMousePosition.x - 10},${currentMousePosition.y - 5} 
  //                 ${currentMousePosition.x - 10},${currentMousePosition.y + 5}`}
  //         fill="#4285f4"
  //       />
  //     </svg>
  //   );
  // }, [freeConnectionMode, drawingLine, lineStartPoint, currentMousePosition]);

  // 渲染绘图层
  const renderDrawingLayer = useCallback(() => {
    if (!freeConnectionMode) return null;
    
    return (
      <div
        ref={drawLayerRef}
        className="drawing-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1000,
          cursor: drawingLine ? 'crosshair' : 'cell',
          pointerEvents: 'all'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    );
  }, [freeConnectionMode, drawingLine, handleMouseDown, handleMouseMove, handleMouseUp, drawLayerRef]);

  return {
    // renderTemporaryConnection,
    // renderFreeConnectionLine,
    renderDrawingLayer
  };
};
