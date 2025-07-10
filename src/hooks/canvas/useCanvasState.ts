import { useState, useCallback, useEffect } from 'react';

/**
 * 管理Canvas状态的自定义Hook
 */
export const useCanvasState = () => {
  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  // 空格键状态
  const [spacePressed, setSpacePressed] = useState(false);

  // 网格状态
  const [gridVisible, setGridVisible] = useState(true);
  const [gridSize] = useState(40);
  
  // 监听空格键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
        // 检查是否在输入框中，如果是则不阻止默认行为
        const isInInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

        if (!isInInput) {
          e.preventDefault();
        }

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

  // 获取当前光标样式
  const getCursor = useCallback((freeConnectionMode = false, drawingLine = false, interactionMode?: string) => {
    if (freeConnectionMode) {
      return drawingLine ? 'crosshair' : 'cell';
    } else if (isDragging) {
      return 'grabbing';
    } else if (spacePressed || interactionMode === 'canvasDrag') {
      return 'grab';
    }
    return 'default';
  }, [isDragging, spacePressed]);

  // 生成网格样式
  const getGridStyle = useCallback(() => {
    return {
      backgroundColor: 'rgb(245, 250, 255)',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%'
    };
  }, []);

  return {
    // 状态
    isDragging,
    dragStart,
    initialPan,
    isPanning,
    spacePressed,
    gridVisible,
    gridSize,
    
    // Setter
    setIsDragging,
    setDragStart,
    setInitialPan,
    setIsPanning,
    setSpacePressed,
    setGridVisible,
    
    // 工具函数
    getCursor,
    getGridStyle
  };
};
