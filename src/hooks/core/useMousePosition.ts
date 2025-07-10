import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * 追踪鼠标位置的钩子函数（优化版本，使用requestAnimationFrame节流）
 */
export const useMousePosition = (
  // 修改类型定义，允许 null 值
  mapRef: React.RefObject<HTMLDivElement | null>,
  zoomLevel: number,
  pan: { x: number, y: number }
) => {
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const lastMouseEventRef = useRef<MouseEvent | null>(null);

  // 使用useCallback缓存更新函数
  const updateMousePosition = useCallback(() => {
    const e = lastMouseEventRef.current;
    if (e && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      // 转换为画布坐标
      const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
      const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
      setMousePosition({ x: canvasX, y: canvasY });
    }
    animationFrameRef.current = null;
  }, [mapRef, zoomLevel, pan]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      lastMouseEventRef.current = e;

      // 如果已经有待处理的动画帧，不重复请求
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(updateMousePosition);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      // 清理待处理的动画帧
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateMousePosition]);

  return mousePosition;
};

export default useMousePosition;
