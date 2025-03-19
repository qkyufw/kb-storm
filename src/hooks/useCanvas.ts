import { useRef } from 'react';
import { useCanvasState } from './useCanvasState';
import { useCanvasSelectionBox } from './useCanvasSelectionBox';
// 移除扩展名
import { useCanvasRenderers } from './useCanvasRenderers';
import { useCanvasInteractions } from './useCanvasInteractions';
import { ICard, IConnection } from '../types';

interface UseCanvasProps {
  cards: ICard[];
  connections: IConnection[];
  selectedCardIds: string[];
  selectedConnectionIds: string[];
  zoomLevel: number;
  pan: { x: number, y: number };
  connectionMode: boolean;
  connectionStart: string | null;
  connectionTargetCardId: string | null;
  freeConnectionMode: boolean;
  drawingLine: boolean;
  lineStartPoint: { x: number, y: number, cardId: string | null };
  currentMousePosition: { x: number, y: number };
  
  // 回调函数
  onCardSelect: (cardId: string, isMultiSelect: boolean) => void;
  onConnectionSelect: (connectionId: string, isMultiSelect: boolean) => void;
  onCardsSelect: (cardIds: string[]) => void;
  onPanChange: (newPan: { x: number, y: number }) => void;
  onZoomChange?: (newZoom: number) => void;
  onStartDrawing?: (x: number, y: number, cardId: string | null) => void;
  onDrawingMove?: (x: number, y: number) => void;
  onEndDrawing?: (x: number, y: number, cardId: string | null) => void;
}

/**
 * 统一管理Canvas所有状态和行为的主Hook
 */
export const useCanvas = ({
  cards,
  connections,
  selectedCardIds,
  selectedConnectionIds,
  zoomLevel,
  pan,
  connectionMode,
  connectionStart,
  connectionTargetCardId,
  freeConnectionMode,
  drawingLine,
  lineStartPoint,
  currentMousePosition,
  onCardSelect,
  onConnectionSelect,
  onCardsSelect,
  onPanChange,
  onZoomChange,
  onStartDrawing,
  onDrawingMove,
  onEndDrawing
}: UseCanvasProps) => {
  // 引用
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const drawLayerRef = useRef<HTMLDivElement>(null);
  
  // 状态管理Hook
  const canvasState = useCanvasState();
  
  // 选择框管理Hook
  const selectionBox = useCanvasSelectionBox({
    canvasRef,
    zoomLevel,
    pan,
    cards,
    connections
  });
  
  // 交互管理Hook
  const interactions = useCanvasInteractions({
    canvasRef,
    zoomLevel,
    pan,
    cards,
    connections,
    freeConnectionMode,
    drawingLine,
    selectedCardIds,
    selectedConnectionIds,
    isDragging: canvasState.isDragging,
    isPanning: canvasState.isPanning,
    spacePressed: canvasState.spacePressed,
    selectionBox: selectionBox.selectionBox,
    selectionJustEnded: selectionBox.selectionJustEnded,
    
    // 状态更新函数
    setIsDragging: canvasState.setIsDragging,
    setIsPanning: canvasState.setIsPanning,
    setDragStart: canvasState.setDragStart,
    setInitialPan: canvasState.setInitialPan,
    setSelectionJustEnded: selectionBox.setSelectionJustEnded,
    
    // 选择框相关函数
    startSelectionBox: selectionBox.startSelectionBox,
    updateSelectionBox: selectionBox.updateSelectionBox,
    endSelectionBox: selectionBox.endSelectionBox,
    getCardsInSelectionBox: selectionBox.getCardsInSelectionBox,
    getConnectionsInSelectionBox: selectionBox.getConnectionsInSelectionBox,
    
    // 回调函数
    onCardSelect,
    onConnectionSelect,
    onCardsSelect,
    onPanChange,
    onZoomChange,
    onStartDrawing,
    onDrawingMove,
    onEndDrawing
  });
  
  // 手动类型转换来解决类型兼容性问题
  const handleMouseDownForRenderer = interactions.handleMouseDown as (e: React.MouseEvent<Element, MouseEvent>) => void;
  const handleMouseMoveForRenderer = interactions.handleMouseMove as (e: React.MouseEvent<Element, MouseEvent>) => void;
  const handleMouseUpForRenderer = interactions.handleMouseUp as (e: React.MouseEvent<Element, MouseEvent>) => void;
  
  // 渲染器Hook
  const renderers = useCanvasRenderers({
    cards,
    connectionMode,
    connectionStart,
    connectionTargetCardId,
    freeConnectionMode,
    drawingLine,
    lineStartPoint,
    currentMousePosition,
    handleMouseDown: handleMouseDownForRenderer,
    handleMouseMove: handleMouseMoveForRenderer,
    handleMouseUp: handleMouseUpForRenderer,
    // 这里需要添加类型断言，确保 drawLayerRef 被视为 React.RefObject<HTMLDivElement>
    drawLayerRef: drawLayerRef as React.RefObject<HTMLDivElement>
  });

  return {
    // refs
    canvasRef,
    contentRef,
    drawLayerRef,
    
    // 状态
    ...canvasState,
    
    // 选择框
    ...selectionBox,
    
    // 交互处理
    ...interactions,
    
    // 渲染器
    ...renderers
  };
};

// 导出全部以方便单独使用
export { useCanvasState } from './useCanvasState';
export { useCanvasSelectionBox } from './useCanvasSelectionBox';
// 移除扩展名
export { useCanvasRenderers } from './useCanvasRenderers';
export { useCanvasInteractions } from './useCanvasInteractions';
