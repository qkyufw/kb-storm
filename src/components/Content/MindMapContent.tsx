import React from 'react';
import Card from './Card';
import Connection from './Connection';
import KeyBindingModal from '../Modals/KeyBindingModal';
import { ICard, IConnection, IKeyBindings } from '../../types/CoreTypes';
import { useCanvas } from '../../hooks/canvas/useCanvas';
import { getBackgroundGridStyle } from '../../utils/canvas/backgroundUtils';
import '../../styles/canvas/Canvas.css';

interface MindMapContentProps {
  mapRef: React.RefObject<HTMLDivElement | null>;
  cards: ICard[];
  connections: IConnection[];
  selectedCardId: string | null;
  selectedCardIds: string[];
  selectedConnectionIds: string[];
  editingCardId: string | null;
  connectionMode: boolean;
  connectionStart: string | null; // 添加连接线起始卡片 ID
  zoomLevel: number;
  pan: { x: number, y: number };
  showHelp: boolean;
  showKeyBindings: boolean;
  showUndoMessage: boolean;
  showRedoMessage: boolean;
  keyBindings: IKeyBindings;
  onCardSelect: (cardId: string, isMultiSelect: boolean) => void;
  onConnectionSelect: (connectionId: string, isMultiSelect: boolean) => void;
  onCardsSelect: (cardIds: string[]) => void;
  onCardContentChange: (cardId: string, content: string) => void;
  onEditComplete: () => void;
  onPanChange: (newPan: { x: number, y: number }) => void;
  onZoomChange: (newZoom: number) => void;
  onCardMove: (cardId: string, deltaX: number, deltaY: number) => void;
  onMultipleCardMove: (cardIds: string[], deltaX: number, deltaY: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onCloseKeyBindings: () => void;
  onSaveKeyBindings: (bindings: IKeyBindings) => void;
  editingConnectionId: string | null;
  onConnectionLabelChange: (connectionId: string, label: string) => void;
  onConnectionEditComplete: () => void;
  connectionTargetCardId: string | null;
  freeConnectionMode?: boolean;
  drawingLine?: boolean;
  lineStartPoint?: { x: number, y: number, cardId: string | null };
  currentMousePosition?: { x: number, y: number };
  onStartDrawing?: (x: number, y: number, cardId: string | null) => void;
  onDrawingMove?: (x: number, y: number) => void;
  onEndDrawing?: (x: number, y: number, cardId: string | null) => void;
}

const MindMapContent: React.FC<MindMapContentProps> = ({
  mapRef,
  cards,
  connections,
  selectedCardId,
  selectedCardIds,
  selectedConnectionIds,
  editingCardId,
  connectionMode,
  connectionStart,
  zoomLevel,
  pan,
  showHelp,
  showKeyBindings,
  showUndoMessage,
  showRedoMessage,
  keyBindings,
  onCardSelect,
  onConnectionSelect,
  onCardsSelect,
  onCardContentChange,
  onEditComplete,
  onPanChange,
  onZoomChange,
  onCardMove,
  onMultipleCardMove,
  onZoomIn,
  onZoomOut,
  onResetView,
  onCloseKeyBindings,
  onSaveKeyBindings,
  editingConnectionId,
  onConnectionLabelChange,
  onConnectionEditComplete,
  connectionTargetCardId,
  freeConnectionMode = false,
  drawingLine = false,
  lineStartPoint = { x: 0, y: 0, cardId: null },
  currentMousePosition = { x: 0, y: 0 },
  onStartDrawing,
  onDrawingMove,
  onEndDrawing
}) => {
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
  }, [canvas.canvasRef]);

  // 使用工具函数获取背景样式
  const backgroundGridStyle = getBackgroundGridStyle(zoomLevel, pan);

  return (
    <>
      <div 
        ref={(node) => {
          if (node) {
            if (mapRef) {
              mapRef.current = node;
            }
            canvas.canvasRef.current = node;
          }
        }}
        className={`canvas-wrapper ${freeConnectionMode ? 'free-connection-mode' : ''} ${editingConnectionId ? 'connection-selection-mode' : ''}`}
        onMouseDown={canvas.handleMouseDown}
        onMouseMove={canvas.handleMouseMove}
        onMouseUp={canvas.handleMouseUp}
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
        {/* 背景网格层 */}
        <div 
          className="background-grid"
          style={backgroundGridStyle}
        />
        
        <div
          className={`infinite-canvas ${canvas.isDragging ? 'dragging' : ''} ${canvas.spacePressed ? 'space-pressed' : ''} ${editingConnectionId ? 'connection-selection-mode' : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
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
              isHighlighted={editingConnectionId !== null}
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

        {/* 绘图层 - 保持在画布外部 */}
        {canvas.renderDrawingLayer()}
        {canvas.renderConnectionLine()}
      </div>
      
      {showKeyBindings && (
        <KeyBindingModal
          keyBindings={keyBindings}
          onSave={onSaveKeyBindings}
          onClose={onCloseKeyBindings}
        />
      )}
      
      {connectionMode && (
        <div className="connection-mode-indicator">
          连线模式: 请选择目标卡片，ESC取消
        </div>
      )}
      
      {freeConnectionMode && (
        <div className="free-connection-mode-indicator">
          自由连线模式: 点击并拖动连接两张卡片，ESC取消
        </div>
      )}
      
      {showUndoMessage && (
        <div className="action-feedback undo">
          已撤销操作
        </div>
      )}
      
      {showRedoMessage && (
        <div className="action-feedback redo">
          已重做操作
        </div>
      )}
    </>
  );
};

export default MindMapContent;
