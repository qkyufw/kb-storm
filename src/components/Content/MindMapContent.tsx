import React from 'react';
import Canvas from './Canvas';
import ZoomControls from './ZoomControls';
import HelpModal from '../Modals/HelpModal';
import KeyBindingModal from '../Modals/KeyBindingModal';
import { ICard, IConnection, IKeyBindings } from '../../types/CoreTypes';

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
  onCloseHelp: () => void;
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
  connectionStart, // 解构这个属性
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
  onCloseHelp,
  onCloseKeyBindings,
  onSaveKeyBindings,
  editingConnectionId,
  onConnectionLabelChange,
  onConnectionEditComplete,
  connectionTargetCardId,
  freeConnectionMode,
  drawingLine,
  lineStartPoint,
  currentMousePosition,
  onStartDrawing,
  onDrawingMove,
  onEndDrawing
}) => {
  // 生成帮助文本
  const getHelpText = () => {
    return [
      { key: `Ctrl+${keyBindings.newCard.toUpperCase()}`, desc: '创建新卡片' },
      { key: keyBindings.editCard, desc: '编辑选中的卡片' },
      { key: 'Ctrl+Enter', desc: '完成编辑' },
      { key: 'Esc', desc: '取消编辑/连线/取消选择' },
      { key: keyBindings.nextCard, desc: '在卡片间切换' },
      { key: `Shift+${keyBindings.nextCard}`, desc: '反向切换卡片' },
      // ... 更多帮助项
    ];
  };
  
  return (
    <>
      <div 
        ref={mapRef} 
        className="mind-map-content"
      >
        <Canvas
          cards={cards}
          connections={connections}
          selectedCardId={selectedCardId}
          selectedCardIds={selectedCardIds}
          selectedConnectionIds={selectedConnectionIds}
          editingCardId={editingCardId}
          connectionMode={connectionMode}
          connectionStart={connectionStart} // 传递给 Canvas 组件
          zoomLevel={zoomLevel}
          pan={pan}
          onCardSelect={onCardSelect}
          onConnectionSelect={onConnectionSelect}
          onCardsSelect={onCardsSelect}
          onCardContentChange={onCardContentChange}
          onEditComplete={onEditComplete}
          onPanChange={onPanChange}
          onZoomChange={onZoomChange}
          onCardMove={onCardMove}
          onMultipleCardMove={onMultipleCardMove}
          editingConnectionId={editingConnectionId}
          onConnectionLabelChange={onConnectionLabelChange}
          onConnectionEditComplete={onConnectionEditComplete}
          connectionTargetCardId={connectionTargetCardId}
          freeConnectionMode={freeConnectionMode}
          drawingLine={drawingLine}
          lineStartPoint={lineStartPoint}
          currentMousePosition={currentMousePosition}
          onStartDrawing={onStartDrawing}
          onDrawingMove={onDrawingMove}
          onEndDrawing={onEndDrawing}
        />
      </div>
      
      <ZoomControls
        zoomLevel={zoomLevel}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={onResetView}
      />
      
      {showHelp && (
        <HelpModal
          helpItems={getHelpText()}
          onClose={onCloseHelp}
        />
      )}
      
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
      
      {/* 移除了选择状态提示 */}
    </>
  );
};

export default MindMapContent;
