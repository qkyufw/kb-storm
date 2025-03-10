import { useState, useEffect } from 'react';

/**
 * 追踪鼠标位置的钩子函数
 */
export const useMousePosition = (
  // 修改类型定义，允许 null 值
  mapRef: React.RefObject<HTMLDivElement | null>,
  zoomLevel: number,
  pan: { x: number, y: number }
) => {
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        // 转换为画布坐标
        const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
        const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
        setMousePosition({ x: canvasX, y: canvasY });
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [mapRef, zoomLevel, pan]);
  
  return mousePosition;
};

export default useMousePosition;
