import React, { useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Card from './Card';
import Connection from './Connection';
import KeyBindingModal from './KeyBindingModal';
import { useCanvas } from '../hooks/canvas/useCanvas';
import { getBackgroundGridStyle } from '../utils/canvas/backgroundUtils';
import { getArrowTypeName } from '../utils/canvas/arrowUtils';
import '../styles/canvas/Canvas.css';

// 导入 Stores
import { useCardStore } from '../store/cardStore';
import { useConnectionStore } from '../store/connectionStore';
import { useUIStore } from '../store/UIStore';
import { useFreeConnectionStore } from '../store/freeConnectionStore';
import { useAIStore } from '../store/aiStore';
import { useKeyBindings } from '../hooks/interaction/useKeyboardShortcuts';

// 导入服务
import { selectCardWithContextService } from '../utils/interactions';

// 只保留必要的 props，其他都从 store 获取
interface MindMapContentProps {
  mapRefCallback: (node: HTMLDivElement | null) => void;
}

const MindMapContent: React.FC<MindMapContentProps> = ({
  mapRefCallback,
}) => {
  const { t } = useTranslation();

  // 使用 stores 获取状态
  const cards = useCardStore();
  const connections = useConnectionStore();
  const ui = useUIStore();
  const freeConnection = useFreeConnectionStore(); // 修复：添加括号调用hook
  const ai = useAIStore();
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
  
  // 优化回调函数，使用useCallback缓存
  const handleCardSelect = useCallback((cardId: string, isMultiSelect: boolean) => {
    selectCardWithContextService(cardId, isMultiSelect);
  }, []);

  const handleConnectionSelect = useCallback((connectionId: string, isMultiSelect: boolean) => {
    connections.selectConnection(connectionId, isMultiSelect);
  }, [connections]);

  const handleCardsSelect = useCallback((cardIds: string[]) => {
    cards.selectCards(cardIds);
  }, [cards]);

  const handlePanChange = useCallback((pan: { x: number; y: number }) => {
    ui.setPan(pan);
  }, [ui]);

  const handleZoomChange = useCallback((zoom: number) => {
    ui.showZoomInfo(zoom);
  }, [ui]);

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
    interactionMode: ui.interactionMode,
    onCardSelect: handleCardSelect,
    onConnectionSelect: handleConnectionSelect,
    onCardsSelect: handleCardsSelect,
    onPanChange: handlePanChange,
    onZoomChange: handleZoomChange,
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

  // 使用工具函数获取背景样式（使用useMemo缓存）
  const backgroundGridStyle = useMemo(() => {
    return getBackgroundGridStyle(ui.zoomLevel, ui.pan);
  }, [ui.zoomLevel, ui.pan]);

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
          cursor: canvas.getCursor(freeConnectionMode, drawingLine, ui.interactionMode),
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
            const isInMultiSelection = cards.selectedCardIds.length > 1;
            
            return (
              <Card
                key={card.id}
                card={card}
                isSelected={
                  cards.selectedCardId === card.id || 
                  cards.selectedCardIds.includes(card.id)
                }
                isInMultiSelection={isInMultiSelection}
                isTargeted={card.id === connections.connectionTargetCardId}
                isEditing={cards.editingCardId === card.id}
                onClick={(e) => canvas.handleCardClick(card.id, e)}
                onContentChange={(content: string) => cards.updateCardContent(card.id, content)}
                onEditComplete={() => cards.setEditingCardId(null)}
                onMove={isInMultiSelection
                  ? (cardId, deltaX, deltaY) => cards.moveMultipleCards(cards.selectedCardIds, deltaX, deltaY)
                  : (cardId, deltaX, deltaY) => cards.moveCard(cardId, deltaX, deltaY)
                }
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
          {t('modes.connectionModeHint')}
        </div>
      )}

      {freeConnectionMode && (
        <div className="free-connection-mode-indicator">
          {t('modes.freeConnectionHint')}
        </div>
      )}
      
      {/* 箭头类型提示 */}
      {ui.interactionMode === 'connectionSelection' && connections.selectedConnectionIds.length > 0 && (
        <div className="arrow-type-indicator">
          {t('modes.arrowTypeHint', {
            type: getArrowTypeName(connections.connections.find(c => c.id === connections.selectedConnectionIds[0])?.arrowType)
          })}
          <span className="keyboard-hint">{t('modes.tabToSwitch')}</span>
        </div>
      )}
      
      {ui.showUndoMessage && (
        <div className="action-feedback undo">
          {t('messages.actions.undone')}
        </div>
      )}

      {ui.showRedoMessage && (
        <div className="action-feedback redo">
          {t('messages.actions.redone')}
        </div>
      )}



      {/* AI状态提示 */}
      {ai.status.isLoading && (
        <div className="ai-status-indicator">
          <div className="ai-loading">
            <span className="loading-icon">⏳</span>
            <span className="loading-text">
              {ai.status.currentOperation === 'expand' && t('ai.functions.expand.loading')}
              {ai.status.currentOperation === 'organize' && t('ai.functions.organize.loading')}
              {ai.status.currentOperation === 'logicOrganize' && t('ai.functions.logicOrganization.loading')}
              {ai.status.currentOperation === 'logicDraft' && t('ai.functions.draft.loading')}
            </span>
            {ai.status.progress && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${ai.status.progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI错误提示 */}
      {ai.status.error && (
        <div className="ai-error-indicator">
          <span className="error-icon">❌</span>
          <span className="error-text">{ai.status.error}</span>
          <button
            className="error-close"
            onClick={() => ai.resetStatus()}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
};

export default MindMapContent;