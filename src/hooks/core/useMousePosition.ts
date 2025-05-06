import { useState, useEffect, useCallback } from 'react';
import { IPosition } from '../../types/CoreTypes';

/**
 * 追踪鼠标位置的钩子函数
 */
export const useMousePosition = (
  containerRef: React.RefObject<HTMLElement | null>,
  zoomLevel: number, 
  pan: { x: number, y: number }
) => {
  const [position, setPosition] = useState<IPosition>({ x: 0, y: 0 });

  // 使用 useCallback 来稳定化鼠标移动处理函数的引用
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    // 根据缩放和平移计算实际位置
    const x = (e.clientX - rect.left) / zoomLevel - pan.x / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel - pan.y / zoomLevel;
    
    setPosition({ x, y });
  }, [containerRef, zoomLevel, pan]); // 依赖项现在是稳定的引用

  useEffect(() => {
    // 事件监听器使用了 useCallback 包装的稳定函数
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove]); // 只依赖于稳定的函数引用

  return position;
};

export default useMousePosition;
