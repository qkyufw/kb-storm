import React, { useCallback } from 'react';
import { ICard, CanvasRef } from '../../types/CoreTypes';


interface UseCanvasRenderersProps {
  canvasRef: CanvasRef;
  zoomLevel: number;
  pan: { x: number; y: number };
  cards: ICard[];
  freeConnectionMode: boolean;
  drawingLine: boolean;
  lineStartPoint: { x: number; y: number; cardId: string | null };
  currentMousePosition: { x: number; y: number };
  onStartDrawing?: (x: number, y: number, cardId: string | null) => void;
  onDrawingMove?: (x: number, y: number) => void;
  onEndDrawing?: (x: number, y: number, cardId: string | null) => void;
}

export const useCanvasRenderers = ({
  canvasRef,
  zoomLevel,
  pan,
  cards,
  freeConnectionMode,
  drawingLine,
  lineStartPoint,
  currentMousePosition,
  onStartDrawing,
  onDrawingMove,
  onEndDrawing
}: UseCanvasRenderersProps) => {
  
  // 渲染绘图层
  const renderDrawingLayer = useCallback(() => {
    if (!freeConnectionMode) return null;

    return (
      <div
        className="drawing-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 5,
          cursor: drawingLine ? 'crosshair' : 'cell',
          pointerEvents: 'all'
        }}
        onMouseDown={(e) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = (e.clientX - rect.left - pan.x) / zoomLevel;
          const y = (e.clientY - rect.top - pan.y) / zoomLevel;
          
          const clickedCard = cards.find(card => 
            x >= card.x && x <= card.x + card.width && 
            y >= card.y && y <= card.y + card.height
          );
          
          onStartDrawing?.(x, y, clickedCard?.id || null);
          e.stopPropagation();
        }}
        onMouseMove={(e) => {
          if (!drawingLine) return;
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = (e.clientX - rect.left - pan.x) / zoomLevel;
          const y = (e.clientY - rect.top - pan.y) / zoomLevel;
          onDrawingMove?.(x, y);
          e.stopPropagation();
        }}
        onMouseUp={(e) => {
          if (!drawingLine) return;
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const x = (e.clientX - rect.left - pan.x) / zoomLevel;
          const y = (e.clientY - rect.top - pan.y) / zoomLevel;
          
          const targetCard = cards.find(card => 
            x >= card.x && x <= card.x + card.width && 
            y >= card.y && y <= card.y + card.height
          );
          
          onEndDrawing?.(x, y, targetCard?.id || null);
          e.stopPropagation();
        }}
      />
    );
  }, [freeConnectionMode, drawingLine, zoomLevel, pan, cards, canvasRef, onStartDrawing, onDrawingMove, onEndDrawing]);

  // 渲染轨迹线
  const renderConnectionLine = useCallback(() => {
    if (!freeConnectionMode || !drawingLine) return null;

    return (
      <svg 
        className="free-connection-line" 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1500
        }}
      >
        <path
          d={`M ${lineStartPoint.x * zoomLevel + pan.x} ${lineStartPoint.y * zoomLevel + pan.y} L ${currentMousePosition.x * zoomLevel + pan.x} ${currentMousePosition.y * zoomLevel + pan.y}`}
          stroke="#4285f4"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }, [freeConnectionMode, drawingLine, lineStartPoint, currentMousePosition, zoomLevel, pan]);

  return {
    renderDrawingLayer,
    renderConnectionLine
  };
};