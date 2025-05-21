import React, { useEffect, useCallback } from 'react';
import Card from './Card';
import Connection from './Connection';
import KeyBindingModal from './KeyBindingModal';
import { useCanvas } from '../hooks/canvas/useCanvas';
import { getBackgroundGridStyle } from '../utils/canvas/backgroundUtils';
import '../styles/canvas/Canvas.css';

// 导入 Stores
import { useCardStore } from '../store/cardStore';
import { useConnectionStore } from '../store/connectionStore';
import { useUIStore } from '../store/UIStore';
import { useFreeConnectionStore } from '../store/freeConnectionStore';
import { useKeyBindings } from '../hooks/interaction/useKeyboardShortcuts';

// 导入服务
import { selectCardWithContextService } from '../services/MindMapService';

// 只保留必要的 props，其他都从 store 获取
interface MindMapContentProps {
  mapRefCallback: (node: HTMLDivElement | null) => void;
}

const MindMapContent: React.FC<MindMapContentProps> = ({
  mapRefCallback,
}) => {
  // 使用 stores 获取状态
  const cards = useCardStore();
  const connections = useConnectionStore();
  const ui = useUIStore();
  const freeConnection = useFreeConnectionStore(); // 修复：添加括号调用hook
  const { keyBindings, updateKeyBindings } = useKeyBindings();

  // 从freeConnection store获取状态和方法
  const { 
    freeConnectionMode, 
    drawingLine, 
    lineStartPoint, 
    currentMousePosition,
    startDrawing,
    drawingMove,
    endDrawing
  } = freeConnection;
  
  // 使用整合后的Canvas Hook
  const canvas = useCanvas({
    cards: cards.cards,
    connections: connections.connections,
    selectedCardIds: cards.selectedCardIds,
    selectedConnectionIds: connections.selectedConnectionIds,
    zoomLevel: ui.zoomLevel,
    pan: ui.pan,
    connectionMode: connections.connectionMode,
    connectionStart: connections.connectionStart,
    connectionTargetCardId: connections.connectionTargetCardId,
    freeConnectionMode,
    drawingLine,
    lineStartPoint,
    currentMousePosition,
    onCardSelect: (cardId, isMultiSelect) => selectCardWithContextService(cardId, isMultiSelect),
    onConnectionSelect: connections.selectConnection,
    onCardsSelect: cards.selectCards,
    onPanChange: ui.setPan,
    onZoomChange: ui.showZoomInfo,
    onStartDrawing: startDrawing,
    onDrawingMove: drawingMove,
    onEndDrawing: endDrawing
  });

  // 确保内容不被顶部工具栏遮挡
  useEffect(() => {
    const headerHeight = 60;
    if (canvas.canvasRef.current) {
      canvas.canvasRef.current.style.paddingTop = `${headerHeight}px`;
    }
  }, [canvas.canvasRef]);

  // 使用工具函数获取背景样式
  const backgroundGridStyle = getBackgroundGridStyle(ui.zoomLevel, ui.pan);

  const combineRefs = useCallback((node: HTMLDivElement | null) => {
    // 设置父组件的 ref
    mapRefCallback(node);
    
    // 设置 canvas 的 ref
    if (node) {
      canvas.canvasRef.current = node;
    }
  }, [mapRefCallback, canvas.canvasRef]);

  return (
    <>
      <div 
        ref={combineRefs}
        className={`canvas-wrapper ${freeConnectionMode ? 'free-connection-mode' : ''} ${connections.editingConnectionId ? 'connection-selection-mode' : ''}`}
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
        
        {/* 其余内容保持不变 */}
        <div
          className={`infinite-canvas ${canvas.isDragging ? 'dragging' : ''} ${canvas.spacePressed ? 'space-pressed' : ''} ${connections.editingConnectionId ? 'connection-selection-mode' : ''}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `translate(${ui.pan.x}px, ${ui.pan.y}px) scale(${ui.zoomLevel})`,
            transformOrigin: '0 0',
          }}
        >
          {/* 显示选区 */}
          {canvas.selectionBox.visible && (
            <div style={canvas.getSelectionBoxStyle()} />
          )}

          {/* 连接线 */}
          {connections.connections.map(connection => (
            <Connection
              key={connection.id}
              connection={connection}
              cards={cards.cards}
              isSelected={connections.selectedConnectionIds.includes(connection.id)}
              isHighlighted={connections.editingConnectionId !== null}
              isEditing={connections.editingConnectionId === connection.id}
              onClick={(e) => {
                e.stopPropagation();
                canvas.handleConnectionClick(connection.id, e);
              }}
              onLabelChange={(label) => connections.updateConnectionLabel(connection.id, label)}
              onEditComplete={() => connections.setEditingConnectionId(null)}
            />
          ))}

          {/* 卡片 */}
          {cards.cards.map(card => {
            const isInMultiSelection = cards.selectedCardIds.length > 1 && cards.selectedCardIds.includes(card.id);
            
            return (
              <Card
                key={card.id}
                card={card}
                isSelected={
                  cards.selectedCardId === card.id || 
                  cards.selectedCardIds.includes(card.id) || 
                  card.id === connections.connectionTargetCardId
                }
                isTargeted={card.id === connections.connectionTargetCardId}
                isEditing={cards.editingCardId === card.id}
                onClick={(e) => canvas.handleCardClick(card.id, e)}
                onContentChange={(content: string) => cards.updateCardContent(card.id, content)}
                onEditComplete={() => cards.setEditingCardId(null)}
                onMove={isInMultiSelection
                  ? (cardId, deltaX, deltaY) => cards.moveMultipleCards(cards.selectedCardIds, deltaX, deltaY)
                  : (cardId, deltaX, deltaY) => cards.moveCard(cardId, deltaX, deltaY)}
              />
            );
          })}
        </div>

        {/* 保留必要的连接线渲染 */}
        {canvas.renderConnectionLine()}
      </div>
      
      {ui.showKeyBindings && (
        <KeyBindingModal
          keyBindings={keyBindings}
          onSave={updateKeyBindings}
          onClose={() => ui.setShowKeyBindings(false)}
        />
      )}
      
      {connections.connectionMode && (
        <div className="connection-mode-indicator">
          连线模式: 请选择目标卡片，ESC取消
        </div>
      )}
      
      {freeConnectionMode && (
        <div className="free-connection-mode-indicator">
          自由连线模式: 点击并拖动连接两张卡片，ESC取消
        </div>
      )}
      
      {ui.showUndoMessage && (
        <div className="action-feedback undo">
          已撤销操作
        </div>
      )}
      
      {ui.showRedoMessage && (
        <div className="action-feedback redo">
          已重做操作
        </div>
      )}
    </>
  );
};

export default MindMapContent;