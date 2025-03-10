import React, { forwardRef, useState, useEffect, useCallback, useRef } from 'react';
import Card from '../Card';
import Connection from '../Connection';
import { ICard, IConnection } from '../../types';

interface CanvasProps {
  cards: ICard[];
  connections: IConnection[];
  selectedCardId: string | null;
  selectedCardIds: string[]; // 添加多选卡片ID数组
  editingCardId: string | null;
  connectionMode: boolean;
  zoomLevel: number;
  pan: { x: number, y: number };
  onCardSelect: (cardId: string, isMultiSelect: boolean) => void; // 修改选卡回调以支持多选
  onCardsSelect: (cardIds: string[]) => void; // 添加批量选择卡片的回调
  onCardContentChange: (cardId: string, content: string) => void;
  onEditComplete: () => void;
  onPanChange: (newPan: { x: number, y: number }) => void;
  onZoomChange?: (newZoom: number) => void;
  onCardMove?: (cardId: string, deltaX: number, deltaY: number) => void;
  onMultipleCardMove?: (cardIds: string[], deltaX: number, deltaY: number) => void; // 添加多卡片移动回调
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>((
  { 
    cards, 
    connections, 
    selectedCardId,
    selectedCardIds, 
    editingCardId, 
    connectionMode,
    zoomLevel,
    pan,
    onCardSelect,
    onCardsSelect,
    onCardContentChange,
    onEditComplete,
    onPanChange,
    onZoomChange,
    onCardMove,
    onMultipleCardMove
  }, 
  ref
) => {
  // 用于跟踪鼠标拖动
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 添加空格按下状态跟踪
  const [spacePressed, setSpacePressed] = useState(false);
  
  // 增加背景网格设置
  const [gridVisible, setGridVisible] = useState(true);
  const gridSize = 40; // 网格大小，可以调整
  
  // 添加选区相关状态
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    visible: boolean;
  }>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    visible: false
  });

  // 判断是否按下了修饰键 (用于多选)
  const isMultiSelectKey = (e: MouseEvent | React.MouseEvent): boolean => {
    return e.ctrlKey || e.metaKey || e.shiftKey;
  };

  // 处理鼠标按下事件，开始拖动或选区
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const isTargetCanvas = e.target === e.currentTarget || e.target === contentRef.current;
    
    if ((isTargetCanvas && e.button === 0) || e.button === 1 || (e.button === 0 && (spacePressed || e.ctrlKey))) {
      if (isTargetCanvas && e.button === 0 && !spacePressed && !e.ctrlKey) {
        // 开始选区
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        // 计算画布坐标
        const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
        const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
        
        setSelectionBox({
          startX: canvasX,
          startY: canvasY,
          endX: canvasX,
          endY: canvasY,
          visible: true
        });

        // 如果不按多选键，清除之前的选择
        if (!isMultiSelectKey(e)) {
          onCardsSelect([]);
        }
      } else {
        // 开始平移画布
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialPan({ ...pan });
        document.body.style.cursor = 'grabbing';
      }
    }
  }, [pan, zoomLevel, spacePressed, onCardsSelect]);

  // 处理鼠标移动事件
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      // 拖动画布逻辑
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      onPanChange({
        x: initialPan.x + deltaX,
        y: initialPan.y + deltaY
      });
    } else if (selectionBox.visible) {
      // 更新选区
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
      const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
      
      setSelectionBox(prev => ({
        ...prev,
        endX: canvasX,
        endY: canvasY
      }));
    }
  }, [isDragging, dragStart, initialPan, onPanChange, selectionBox.visible, zoomLevel, pan]);

  // 获取选区中的卡片
  const getCardsInSelectionBox = useCallback(() => {
    if (!selectionBox.visible) return [];

    // 确保选区坐标正确（兼容从任意方向拖动）
    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const right = Math.max(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const bottom = Math.max(selectionBox.startY, selectionBox.endY);

    // 找出所有在选区内的卡片
    return cards.filter(card => {
      // 计算卡片边界
      const cardLeft = card.x;
      const cardRight = card.x + card.width;
      const cardTop = card.y;
      const cardBottom = card.y + card.height;

      // 检查是否有重叠
      return (
        cardRight >= left &&
        cardLeft <= right &&
        cardBottom >= top &&
        cardTop <= bottom
      );
    }).map(card => card.id);
  }, [selectionBox, cards]);

  // 处理鼠标释放事件
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      document.body.style.cursor = spacePressed ? 'grab' : '';
    }
  }, [isDragging, spacePressed]);

  // 处理双击事件 - 在空白区域双击创建卡片
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // 确保双击发生在画布空白区域
    if (e.target === e.currentTarget || e.target === contentRef.current) {
      // 计算画布中的实际点击位置
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // 转换屏幕坐标到画布坐标
      const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
      const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
      
      // 这里可以添加在点击位置创建卡片的回调
      // 如果组件有这个属性的话
      // onCreateCardAt && onCreateCardAt(canvasX, canvasY);
    }
  }, [pan, zoomLevel]);

  // 获取当前视口信息
  const getViewportInfo = useCallback(() => {
    if (!canvasRef.current) return null;
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
      zoom: zoomLevel,
      pan: pan
    };
  }, [zoomLevel, pan]);

  // 生成动态网格背景样式
  const getGridStyle = useCallback(() => {
    // 基于缩放级别调整网格大小
    // 当缩放太小时，网格会变得太密集，所以需要动态调整
    const effectiveGridSize = gridSize * Math.max(1, zoomLevel);
    
    // 计算网格偏移，使其在平移时保持固定
    const offsetX = (pan.x % effectiveGridSize) / zoomLevel;
    const offsetY = (pan.y % effectiveGridSize) / zoomLevel;
    
    // 根据缩放级别调整网格线的不透明度
    const opacity = Math.min(0.2, 0.1 + zoomLevel * 0.05);
    
    return {
      backgroundSize: `${effectiveGridSize / zoomLevel}px ${effectiveGridSize / zoomLevel}px`,
      backgroundPosition: `${offsetX}px ${offsetY}px`,
      backgroundImage: gridVisible 
        ? `linear-gradient(to right, rgba(0, 0, 0, ${opacity}) 1px, transparent 1px),
           linear-gradient(to bottom, rgba(0, 0, 0, ${opacity}) 1px, transparent 1px)`
        : 'none'
    };
  }, [gridSize, pan, zoomLevel, gridVisible]);

  // 处理鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // 带有Ctrl按键时进行缩放操作
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      // 获取鼠标在画布上的位置
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 计算鼠标在画布中的实际位置（考虑当前缩放和平移）
      const canvasX = (mouseX - pan.x) / zoomLevel;
      const canvasY = (mouseY - pan.y) / zoomLevel;
      
      // 计算缩放因子
      const delta = -e.deltaY * 0.001 * zoomLevel; // 根据当前缩放级别调整缩放速率
      const newZoom = Math.min(Math.max(zoomLevel + delta, 0.1), 5); // 限制缩放范围
      
      // 计算新的平移值，保持鼠标下的点不变
      const newPanX = mouseX - canvasX * newZoom;
      const newPanY = mouseY - canvasY * newZoom;
      
      // 更新缩放和平移
      if (onZoomChange) onZoomChange(newZoom);
      onPanChange({ x: newPanX, y: newPanY });
    }
    // 使用Shift+滚轮进行水平滚动
    else if (e.shiftKey) {
      e.preventDefault();
      onPanChange({
        x: pan.x - e.deltaY,
        y: pan.y
      });
    }
    // 默认情况下进行垂直滚动
    else {
      e.preventDefault();
      onPanChange({
        x: pan.x - e.deltaX * 0.5,
        y: pan.y - e.deltaY * 0.5
      });
    }
  }, [zoomLevel, pan, onZoomChange, onPanChange]);

  // 监听空格键按下状态
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); // 防止页面滚动
        setSpacePressed(true);
        document.body.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        document.body.style.cursor = isDragging ? 'grabbing' : '';
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  // 更新cursor逻辑
  const getCursor = useCallback(() => {
    if (isDragging) return 'grabbing';
    if (spacePressed) return 'grab';
    return 'default';
  }, [isDragging, spacePressed]);

  // 添加鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // 当组件挂载或缩放/平移改变时，将视口信息暴露给父组件
  useEffect(() => {
    // 创建自定义事件，传递视口信息
    if (canvasRef.current) {
      const viewportInfo = getViewportInfo();
      if (viewportInfo) {
        const event = new CustomEvent('viewportchange', { detail: viewportInfo });
        canvasRef.current.dispatchEvent(event);
      }
    }
  }, [zoomLevel, pan, getViewportInfo]);

  // 计算选区样式
  const getSelectionBoxStyle = () => {
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
  };

  // 添加监听整个文档的鼠标移动事件
  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (selectionBox.visible) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
        const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
        
        setSelectionBox(prev => ({
          ...prev,
          endX: canvasX,
          endY: canvasY
        }));
        
        // 实时选择框选区域内的卡片
        const selectedIds = getCardsInSelectionBox();
        onCardsSelect(selectedIds);
      }
    };
    
    const handleDocumentMouseUp = (e: MouseEvent) => {
      if (selectionBox.visible) {
        // 完成选区选择
        const selectedIds = getCardsInSelectionBox();
        if (selectedIds.length > 0) {
          onCardsSelect(selectedIds);
        }
        // 重置选区
        setSelectionBox(prev => ({ ...prev, visible: false }));
      }
    };
    
    // 监听整个文档的鼠标事件以处理拖拽选区
    if (selectionBox.visible) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [selectionBox.visible, zoomLevel, pan, onCardsSelect, getCardsInSelectionBox]);

  return (
    <div 
      className="canvas-wrapper"
      ref={(node) => {
        // 同时保存React ref和内部ref
        if (node) {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          canvasRef.current = node;
        }
      }}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      style={{ 
        cursor: getCursor(),
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 无限画布的背景和内容容器 */}
      <div 
        className={`infinite-canvas ${isDragging ? 'dragging' : ''} ${spacePressed ? 'space-pressed' : ''}`}
        style={{ 
          ...getGridStyle(),
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
          ref={contentRef}
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
          {selectionBox.visible && (
            <div style={getSelectionBoxStyle()} />
          )}
          
          {connections.map(connection => (
            <Connection
              key={connection.id}
              connection={connection}
              cards={cards}
            />
          ))}
          
          {cards.map(card => (
            <Card
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id || selectedCardIds.includes(card.id)}
              isEditing={editingCardId === card.id}
              onClick={(e) => {
                e.stopPropagation();
                onCardSelect(card.id, isMultiSelectKey(e));
              }}
              onContentChange={(content: string) => onCardContentChange(card.id, content)}
              onEditComplete={onEditComplete}
              onMove={selectedCardIds.includes(card.id) && selectedCardIds.length > 1
                ? (cardId, deltaX, deltaY) => onMultipleCardMove && onMultipleCardMove(selectedCardIds, deltaX, deltaY)
                : onCardMove}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
