import React, { useCallback, useEffect, useState, useRef } from 'react';
import Card from './Card';
import Connection from './Connection';
import ZoomControls from './ZoomControls';
import KeyBindingModal from '../Modals/KeyBindingModal';
import { ICard, IConnection, IPosition, IKeyBindings } from '../../types/CoreTypes';
import { findNearestCardInDirection } from '../../utils/cardPositioning';
import { Logger } from '../../utils/log';

// 整合 MindMapContent 和 Canvas 的 props
interface CanvasProps {
  mapRef?: React.RefObject<HTMLDivElement | null>;
  cards: ICard[];
  connections: IConnection[];
  selectedCardId: string | null;
  selectedCardIds: string[];
  selectedConnectionIds: string[];
  editingCardId: string | null;
  connectionMode: boolean;
  connectionStart: string | null;
  zoomLevel: number;
  pan: { x: number, y: number };
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

const Canvas: React.FC<CanvasProps> = ({
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
  freeConnectionMode,
  drawingLine,
  lineStartPoint,
  currentMousePosition,
  onStartDrawing,
  onDrawingMove,
  onEndDrawing
}) => {
  // 连接线选择模式状态
  const [connectionSelectionMode, setConnectionSelectionMode] = useState(false);
  
  // 选择框状态
  const [selectionBox, setSelectionBox] = useState<{
    start: IPosition;
    current: IPosition;
    isSelecting: boolean;
  }>({
    start: { x: 0, y: 0 },
    current: { x: 0, y: 0 },
    isSelecting: false
  });

  // 鼠标状态
  const [isDragging, setIsDragging] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPosition, setLastPanPosition] = useState({ x: 0, y: 0 });
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [selectionJustEnded, setSelectionJustEnded] = useState(false);
  
  // 处理画布鼠标按下事件
  const handleCanvasMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button === 0) { // 仅响应左键点击
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = (event.clientX - rect.left) / zoomLevel - pan.x / zoomLevel;
      const y = (event.clientY - rect.top) / zoomLevel - pan.y / zoomLevel;
      
      if (event.target === canvasRef.current || (event.target as HTMLElement).classList.contains('canvas-content')) {
        // 开始框选
        setSelectionBox({
          start: { x, y },
          current: { x, y },
          isSelecting: true
        });
      }
    } else if (event.button === 1 || event.button === 2 || (event.button === 0 && (event.ctrlKey || event.metaKey))) {
      // 中键或右键或Ctrl+左键开始画布平移
      setIsPanning(true);
      setLastPanPosition({ x: event.clientX, y: event.clientY });
      event.preventDefault();
    }
  }, [pan, zoomLevel]);
  
  // 处理画布鼠标移动事件
  const handleCanvasMouseMove = useCallback((event: React.MouseEvent) => {
    if (selectionBox.isSelecting) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = (event.clientX - rect.left) / zoomLevel - pan.x / zoomLevel;
      const y = (event.clientY - rect.top) / zoomLevel - pan.y / zoomLevel;
      
      setSelectionBox(prev => ({
        ...prev,
        current: { x, y }
      }));
      
      // 实时选择框选区域内的卡片
      const selectedCardIds = getCardsInSelectionBox();
      onCardsSelect(selectedCardIds);
    }
    
    if (isPanning) {
      const deltaX = event.clientX - lastPanPosition.x;
      const deltaY = event.clientY - lastPanPosition.y;
      
      onPanChange({
        x: pan.x + deltaX,
        y: pan.y + deltaY
      });
      
      setLastPanPosition({
        x: event.clientX,
        y: event.clientY
      });
    }
    
    // 处理自由连线模式下的鼠标移动
    if (drawingLine && onDrawingMove) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (event.clientX - rect.left) / zoomLevel - pan.x / zoomLevel;
        const y = (event.clientY - rect.top) / zoomLevel - pan.y / zoomLevel;
        onDrawingMove(x, y);
      }
    }
  }, [drawingLine, isPanning, lastPanPosition, onCardsSelect, onDrawingMove, onPanChange, pan, selectionBox.isSelecting, zoomLevel]);
  
  // 处理画布鼠标抬起事件
  const handleCanvasMouseUp = useCallback((event: React.MouseEvent) => {
    if (selectionBox.isSelecting) {
      setSelectionBox(prev => ({
        ...prev,
        isSelecting: false
      }));
      setSelectionJustEnded(true);
      setTimeout(() => setSelectionJustEnded(false), 100);
    }
    
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning, selectionBox.isSelecting]);
  
  // 处理画布滚轮事件
  const handleCanvasWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    
    if (event.ctrlKey || event.metaKey) {
      // 缩放
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta));
      onZoomChange(newZoom);
    } else {
      // 平移
      const deltaX = event.deltaX;
      const deltaY = event.deltaY;
      
      onPanChange({
        x: pan.x - deltaX,
        y: pan.y - deltaY
      });
    }
  }, [onPanChange, onZoomChange, pan, zoomLevel]);

  // 使用非被动（non-passive）事件监听器来处理滚轮事件
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (canvasElement) {
      // 添加带有 { passive: false } 选项的事件监听器
      canvasElement.addEventListener('wheel', handleCanvasWheel, { passive: false });
      
      // 清理函数
      return () => {
        canvasElement.removeEventListener('wheel', handleCanvasWheel);
      };
    }
  }, [handleCanvasWheel]);
  
  // 获取卡片选择框内的卡片
  const getCardsInSelectionBox = useCallback(() => {
    if (!selectionBox.isSelecting) return [];
    
    const left = Math.min(selectionBox.start.x, selectionBox.current.x);
    const right = Math.max(selectionBox.start.x, selectionBox.current.x);
    const top = Math.min(selectionBox.start.y, selectionBox.current.y);
    const bottom = Math.max(selectionBox.start.y, selectionBox.current.y);
    
    return cards.filter(card => {
      return card.x >= left && card.x + card.width <= right &&
             card.y >= top && card.y + card.height <= bottom;
    }).map(card => card.id);
  }, [cards, selectionBox]);
  
  // 处理卡片点击
  const handleCardClick = useCallback((cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (freeConnectionMode) {
      // 在自由连线模式下，点击卡片会触发onStartDrawing或onEndDrawing
      return;
    }
    
    // 在选择卡片时清除已选中的连接线
    if (selectedConnectionIds.length > 0) {
      selectedConnectionIds.forEach(id => {
        onConnectionSelect(id, true);
      });
    }
    
    // 处理卡片选择
    onCardSelect(cardId, e.ctrlKey || e.metaKey);
  }, [freeConnectionMode, onCardSelect, onConnectionSelect, selectedConnectionIds]);
  
  // 处理卡片鼠标按下
  const handleCardMouseDown = useCallback((cardId: string) => {
    // 可以添加卡片拖动逻辑
  }, []);
  
  // 处理连接线点击
  const handleConnectionClick = useCallback((connectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // 清除卡片选择
    if (selectedCardId) {
      onCardSelect(selectedCardId, true);
    }
    
    // 切换连接线选择
    onConnectionSelect(connectionId, e.ctrlKey || e.metaKey);
  }, [onCardSelect, onConnectionSelect, selectedCardId]);
  
  // 渲染自由连接线
  const renderFreeConnectionLine = useCallback(() => {
    if (!drawingLine || !lineStartPoint || !currentMousePosition) return null;
    
    // 计算起点位置
    const startX = lineStartPoint.x;
    const startY = lineStartPoint.y;
    
    // 计算当前终点位置
    const endX = currentMousePosition.x;
    const endY = currentMousePosition.y;
    
    const pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
    
    return (
      <svg className="free-connection-line">
        <path d={pathData} />
      </svg>
    );
  }, [currentMousePosition, drawingLine, lineStartPoint]);

  // 画布样式
  const canvasStyle: React.CSSProperties = {
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
    transformOrigin: '0 0'
  };

  // 添加画布类名
  const canvasClassName = `infinite-canvas${isDragging ? ' dragging' : ''}`;
  const wrapperClassName = `canvas-wrapper${freeConnectionMode ? ' free-connection-mode' : ''}`;

  return (
    <>
      <div ref={mapRef} className={wrapperClassName}>
        <div
          ref={canvasRef}
          className={canvasClassName}
          style={canvasStyle}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          <div className="canvas-content">
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
                  handleConnectionClick(connection.id, e);
                }}
                onLabelChange={(label: string) => onConnectionLabelChange && onConnectionLabelChange(connection.id, label)}
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
                onClick={(e) => handleCardClick(card.id, e)}
                onContentChange={(content: string) => onCardContentChange(card.id, content)}
                onEditComplete={onEditComplete}

                // connectMode={connectionMode}
                // freeConnectionMode={freeConnectionMode}
                // onStartDrawing={onStartDrawing}
                // onEndDrawing={onEndDrawing}
              />
            ))}

            {/* 渲染自由连接线 */}
            {renderFreeConnectionLine()}
          </div>
        </div>
      </div>

      {/* 缩放控件 */}
      <ZoomControls
        zoomLevel={zoomLevel}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onReset={onResetView}
      />

      {/* 快捷键设置模态框 */}
      {showKeyBindings && (
        <KeyBindingModal
          keyBindings={keyBindings}
          onSave={onSaveKeyBindings}
          onClose={onCloseKeyBindings}
        />
      )}

      {/* 状态指示器 */}
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

export default Canvas;
