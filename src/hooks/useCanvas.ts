import { useState, useCallback, useRef } from 'react';

/**
 * 画布管理钩子
 */
export const useCanvas = (
  initialZoom: number = 1,
  initialPan: { x: number, y: number } = { x: 0, y: 0 }
) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(initialZoom);
  const [pan, setPan] = useState<{ x: number, y: number }>(initialPan);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [gridVisible, setGridVisible] = useState(true);
  const [gridSize, setGridSize] = useState(40); // 网格大小，可以调整

  // 显示缩放信息
  const showZoomInfo = useCallback((newZoom: number) => {
    setZoomLevel(newZoom);
    setShowZoomIndicator(true);
    
    if (zoomIndicatorTimerRef.current) {
      clearTimeout(zoomIndicatorTimerRef.current);
    }
    
    zoomIndicatorTimerRef.current = setTimeout(() => {
      setShowZoomIndicator(false);
      zoomIndicatorTimerRef.current = null;
    }, 1000);
  }, []);

  // 缩放控制
  const handleZoomIn = useCallback(() => {
    showZoomInfo(Math.min(zoomLevel + 0.1, 5));
  }, [zoomLevel, showZoomInfo]);
  
  const handleZoomOut = useCallback(() => {
    showZoomInfo(Math.max(zoomLevel - 0.1, 0.1));
  }, [zoomLevel, showZoomInfo]);
  
  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    showZoomInfo(1);
  }, [showZoomInfo]);

  // 生成动态网格背景样式
  const getGridStyle = useCallback(() => {
    if (!gridVisible) return {};
    
    // 基于缩放级别调整网格大小
    const effectiveGridSize = gridSize * Math.max(1, zoomLevel);
    
    // 计算网格偏移，使其在平移时保持固定
    const offsetX = (pan.x % effectiveGridSize) / zoomLevel;
    const offsetY = (pan.y % effectiveGridSize) / zoomLevel;
    
    // 根据缩放级别调整网格线的不透明度
    const opacity = Math.min(0.2, 0.1 + zoomLevel * 0.05);
    
    return {
      backgroundSize: `${effectiveGridSize / zoomLevel}px ${effectiveGridSize / zoomLevel}px`,
      backgroundPosition: `${offsetX}px ${offsetY}px`,
      backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, ${opacity}) 1px, transparent 1px),
         linear-gradient(to bottom, rgba(0, 0, 0, ${opacity}) 1px, transparent 1px)`
    };
  }, [gridVisible, gridSize, zoomLevel, pan]);

  // 设置画布网格可见性
  const toggleGrid = useCallback(() => {
    setGridVisible(prev => !prev);
  }, []);

  // 从屏幕坐标转换为画布坐标
  const screenToCanvasCoordinates = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoomLevel;
    const y = (clientY - rect.top - pan.y) / zoomLevel;
    
    return { x, y };
  }, [zoomLevel, pan]);

  // 从画布坐标转换为屏幕坐标
  const canvasToScreenCoordinates = useCallback((x: number, y: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = x * zoomLevel + pan.x + rect.left;
    const clientY = y * zoomLevel + pan.y + rect.top;
    
    return { x: clientX, y: clientY };
  }, [zoomLevel, pan]);

  // 获取当前视口在画布坐标系中的边界
  const getViewportBounds = useCallback(() => {
    if (!canvasRef.current) {
      return { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const left = -pan.x / zoomLevel;
    const top = -pan.y / zoomLevel;
    const width = rect.width / zoomLevel;
    const height = rect.height / zoomLevel;
    
    return {
      left,
      top,
      right: left + width,
      bottom: top + height,
      width,
      height
    };
  }, [zoomLevel, pan]);

  return {
    canvasRef,
    zoomLevel,
    pan,
    showZoomIndicator,
    gridVisible,
    setPan,
    setZoomLevel,
    showZoomInfo,
    handleZoomIn,
    handleZoomOut,
    resetView,
    getGridStyle,
    toggleGrid,
    setGridSize,
    screenToCanvasCoordinates,
    canvasToScreenCoordinates,
    getViewportBounds
  };
};

export default useCanvas;
