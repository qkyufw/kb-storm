import { useState, useCallback, useEffect } from 'react';

/**
 * 画布交互状态钩子函数
 */
export const useCanvasInteraction = (onPanChange: (newPan: { x: number, y: number }) => void) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // 开始画布拖动
  const startDragging = useCallback((clientX: number, clientY: number, currentPan: { x: number, y: number }) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setInitialPan({ ...currentPan });
    document.body.style.cursor = 'grabbing';
  }, []);

  // 处理鼠标拖动
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    onPanChange({
      x: initialPan.x + deltaX,
      y: initialPan.y + deltaY
    });
  }, [isDragging, dragStart, initialPan, onPanChange]);

  // 结束拖动
  const endDragging = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = spacePressed ? 'grab' : '';
  }, [spacePressed]);

  // 监听空格键状态
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

  // 添加鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', endDragging);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', endDragging);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', endDragging);
    };
  }, [isDragging, handleMouseMove, endDragging]);

  // 获取当前光标样式
  const getCursor = useCallback(() => {
    if (isDragging) return 'grabbing';
    if (spacePressed) return 'grab';
    return 'default';
  }, [isDragging, spacePressed]);

  return {
    isDragging,
    spacePressed,
    startDragging,
    endDragging,
    getCursor
  };
};
