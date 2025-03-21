import React, { forwardRef } from 'react';
import Card from './Card';
import Connection from './Connection';
import { ICard, IConnection } from '../../types/CoreTypes';
import { useCanvas } from '../../hooks/canvas/useCanvas';

interface CanvasProps {
  cards: ICard[];
  connections: IConnection[];
  selectedCardId: string | null;
  selectedCardIds: string[];
  selectedConnectionIds: string[];
  editingCardId: string | null;
  connectionMode: boolean;
  connectionStart?: string | null;
  zoomLevel: number;
  pan: { x: number, y: number };
  onCardSelect: (cardId: string, isMultiSelect: boolean) => void;
  onCardsSelect: (cardIds: string[]) => void;
  onConnectionSelect: (connectionId: string, isMultiSelect: boolean) => void;
  onCardContentChange: (cardId: string, content: string) => void;
  onEditComplete: () => void;
  onPanChange: (newPan: { x: number, y: number }) => void;
  onZoomChange?: (newZoom: number) => void;
  onCardMove?: (cardId: string, deltaX: number, deltaY: number) => void;
  onMultipleCardMove?: (cardIds: string[], deltaX: number, deltaY: number) => void;
  connectionSelectionMode?: boolean;
  editingConnectionId?: string | null;
  onConnectionLabelChange?: (connectionId: string, label: string) => void;
  onConnectionEditComplete?: () => void;
  connectionTargetCardId?: string | null;
  freeConnectionMode?: boolean;
  drawingLine?: boolean;
  lineStartPoint?: { x: number, y: number, cardId: string | null };
  currentMousePosition?: { x: number, y: number };
  onStartDrawing?: (x: number, y: number, cardId: string | null) => void;
  onDrawingMove?: (x: number, y: number) => void;
  onEndDrawing?: (x: number, y: number, cardId: string | null) => void;
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>((
  {
    cards,
    connections,
    selectedCardId,
    selectedCardIds,
    selectedConnectionIds,
    editingCardId,
    connectionMode,
    connectionStart = null,
    zoomLevel,
    pan,
    onCardSelect,
    onConnectionSelect,
    onCardsSelect,
    onCardContentChange,
    onEditComplete,
    onPanChange,
    onZoomChange,
    onCardMove,
    onMultipleCardMove,
    connectionSelectionMode = false,
    editingConnectionId = null,
    onConnectionLabelChange,
    onConnectionEditComplete,
    connectionTargetCardId = null,
    freeConnectionMode = false,
    drawingLine = false,
    lineStartPoint = { x: 0, y: 0, cardId: null },
    currentMousePosition = { x: 0, y: 0 },
    onStartDrawing,
    onDrawingMove,
    onEndDrawing
  },
  ref
) => {
  // 使用整合后的Canvas Hook
  const canvas = useCanvas({
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
  });

  // 确保内容不被顶部工具栏遮挡
  React.useEffect(() => {
    const headerHeight = 60;
    if (canvas.canvasRef.current) {
      canvas.canvasRef.current.style.paddingTop = `${headerHeight}px`;
    }
  }, [canvas.canvasRef]); // 添加依赖项 canvas.canvasRef

  return (
    <div
      className={`canvas-wrapper ${freeConnectionMode ? 'free-connection-mode' : ''} ${connectionSelectionMode ? 'connection-selection-mode' : ''}`}
      ref={(node) => {
        if (node) {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          canvas.canvasRef.current = node;
        }
      }}
      onMouseDown={canvas.handleMouseDown}
      onWheel={canvas.handleWheel}
      onDoubleClick={canvas.handleDoubleClick}
      onContextMenu={canvas.handleContextMenu}
      onClick={canvas.handleBackgroundClick}
      style={{
        cursor: canvas.getCursor(freeConnectionMode, drawingLine),
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 无限画布的背景和内容容器 */}
      <div
        className={`infinite-canvas ${canvas.isDragging ? 'dragging' : ''} ${canvas.spacePressed ? 'space-pressed' : ''} ${connectionSelectionMode ? 'connection-selection-mode' : ''}`}
        style={{
          ...canvas.getGridStyle(),
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `scale(${zoomLevel})`,
          transformOrigin: '0 0',
        }}
      >
        <div
          ref={canvas.contentRef}
          className="canvas-content"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
          }}
        >
          {/* 显示选区 */}
          {canvas.selectionBox.visible && (
            <div style={canvas.getSelectionBoxStyle()} />
          )}

          {/* 连接线 */}
          {connections.map(connection => (
            <Connection
              key={connection.id}
              connection={connection}
              cards={cards}
              isSelected={selectedConnectionIds.includes(connection.id)}
              isHighlighted={connectionSelectionMode}
              isEditing={editingConnectionId === connection.id}
              onClick={(e) => {
                e.stopPropagation();
                canvas.handleConnectionClick(connection.id, e);
              }}
              onLabelChange={(label) => onConnectionLabelChange && onConnectionLabelChange(connection.id, label)}
              onEditComplete={onConnectionEditComplete}
            />
          ))}

          {/* 卡片 */}
          {cards.map(card => (
            <Card
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id || selectedCardIds.includes(card.id) || card.id === connectionTargetCardId}
              isTargeted={card.id === connectionTargetCardId}
              isEditing={editingCardId === card.id}
              onClick={(e) => canvas.handleCardClick(card.id, e)}
              onContentChange={(content: string) => onCardContentChange(card.id, content)}
              onEditComplete={onEditComplete}
              onMove={selectedCardIds.includes(card.id) && selectedCardIds.length > 1
                ? (cardId, deltaX, deltaY) => onMultipleCardMove && onMultipleCardMove(selectedCardIds, deltaX, deltaY)
                : onCardMove}
            />
          ))}
        </div>
      </div>

      {/* 绘图层 */}
      {canvas.renderDrawingLayer()}
      {canvas.renderConnectionLine()}
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
