import React, { forwardRef, useState, useEffect, useCallback, useRef } from 'react';
import Card from '../Card';
import Connection from '../Connection';
import { ICard, IConnection } from '../../types';

interface CanvasProps {
  cards: ICard[];
  connections: IConnection[];
  selectedCardId: string | null;
  editingCardId: string | null;
  connectionMode: boolean;
  zoomLevel: number;
  pan: { x: number, y: number };
  onCardSelect: (cardId: string) => void;
  onCardContentChange: (cardId: string, content: string) => void;
  onEditComplete: () => void;
  onPanChange: (newPan: { x: number, y: number }) => void;
  onZoomChange?: (newZoom: number) => void; // 添加可选的缩放回调
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>((
  { 
    cards, 
    connections, 
    selectedCardId, 
    editingCardId, 
    connectionMode,
    zoomLevel,
    pan,
    onCardSelect,
    onCardContentChange,
    onEditComplete,
    onPanChange,
    onZoomChange
  }, 
  ref
) => {
  // 用于跟踪鼠标拖动
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // 添加空格按下状态跟踪
  const [spacePressed, setSpacePressed] = useState(false);

  // 处理鼠标按下事件，开始拖动
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 优化拖动条件判断：空格键按下、中键或按住Ctrl键
    if (e.button === 1 || (e.button === 0 && (spacePressed || e.ctrlKey))) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialPan({ ...pan });
    }
  }, [pan, spacePressed]);

  // 处理鼠标移动事件
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      onPanChange({
        x: initialPan.x + deltaX,
        y: initialPan.y + deltaY
      });
    }
  }, [isDragging, dragStart, initialPan, onPanChange]);

  // 处理鼠标释放事件，结束拖动
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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
      const delta = -e.deltaY * 0.01;
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
        x: pan.x,
        y: pan.y - e.deltaY
      });
    }
  }, [zoomLevel, pan, onZoomChange, onPanChange]);

  // 监听空格键按下状态
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); // 防止页面滚动
        setSpacePressed(true);
        document.body.style.cursor = 'grab';
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        document.body.style.cursor = '';
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.style.cursor = '';
    };
  }, []);

  // 更新cursor逻辑
  const getCursor = () => {
    if (isDragging) return 'grabbing';
    if (spacePressed) return 'grab';
    return 'default';
  };

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

  return (
    <div 
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
      className={`mind-map ${isDragging ? 'dragging' : ''} ${spacePressed ? 'space-pressed' : ''}`}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{
        transform: `scale(${zoomLevel}) translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
        cursor: getCursor()
      }}
    >
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
          isSelected={selectedCardId === card.id}
          isEditing={editingCardId === card.id}
          onClick={() => onCardSelect(card.id)}
          onContentChange={(content: string) => onCardContentChange(card.id, content)}
          onEditComplete={onEditComplete}
        />
      ))}
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
