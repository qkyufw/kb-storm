import React, { useCallback, useState } from 'react';
import { ICard } from '../../types/CoreTypes';

interface UseFreeConnectionProps {
  cards: ICard[];
  onCreateConnection?: (startCardId: string | null, endCardId: string | null, points: {x: number, y: number}[]) => void;
}

/**
 * 处理自由连接线绘制的Hook
 */
export const useFreeConnection = ({ 
  cards,
  onCreateConnection 
}: UseFreeConnectionProps) => {
  // 是否处于自由连线模式
  const [freeConnectionMode, setFreeConnectionMode] = useState(false);
  
  // 是否正在绘制线条
  const [drawingLine, setDrawingLine] = useState(false);
  
  // 记录开始绘制的点
  const [lineStartPoint, setLineStartPoint] = useState({ x: 0, y: 0, cardId: null as string | null });
  
  // 记录当前鼠标位置
  const [currentMousePosition, setCurrentMousePosition] = useState({ x: 0, y: 0 });
  
  // 记录线条路径点
  const [linePoints, setLinePoints] = useState<Array<{x: number, y: number}>>([]);
  
  // 切换自由连线模式
  const toggleFreeConnectionMode = useCallback(() => {
    setFreeConnectionMode(prev => !prev);
    setDrawingLine(false); // 确保切换模式时清除绘制状态
  }, []);
  
  // 开始绘制线条
  const startDrawing = useCallback((x: number, y: number, cardId: string | null) => {
    setDrawingLine(true);
    setLineStartPoint({ x, y, cardId });
    setCurrentMousePosition({ x, y });
    setLinePoints([{ x, y }]);
  }, []);
  
  // 绘制过程中移动
  const drawingMove = useCallback((x: number, y: number) => {
    setCurrentMousePosition({ x, y });
    
    // 记录点，确保有足够的轨迹点
    const lastPoint = linePoints[linePoints.length - 1];
    if (lastPoint) {
      const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
      
      // 减小记录点的间距，确保更密集的轨迹
      if (distance > 5) {
        console.log("Adding point:", { x, y }); // 添加调试日志
        setLinePoints(prev => [...prev, { x, y }]);
      }
    }
  }, [linePoints]);
  
  // 结束绘制线条
  const endDrawing = useCallback((x: number, y: number, endCardId: string | null) => {
    if (!drawingLine) return;
    
    setDrawingLine(false);
    
    // 最后一个点
    const finalPoints = [...linePoints, { x, y }];
    
    // 如果有创建连接的回调，则调用它
    if (onCreateConnection) {
      onCreateConnection(lineStartPoint.cardId, endCardId, finalPoints);
    }
    
    // 清空线条路径
    setLinePoints([]);
  }, [drawingLine, linePoints, lineStartPoint.cardId, onCreateConnection]);
  
  // 渲染自由连接线
  const renderFreeConnectionLine = useCallback(() => {
    if (!drawingLine) return null;
    
    // 构建SVG路径 - 显示完整轨迹
    let pathD = '';
    
    // 确保有足够的点来绘制轨迹
    if (linePoints.length > 0) {
      // 移动到第一个点
      pathD = `M ${linePoints[0].x} ${linePoints[0].y}`;
      
      // 添加所有路径点
      for (let i = 1; i < linePoints.length; i++) {
        pathD += ` L ${linePoints[i].x} ${linePoints[i].y}`;
      }
      
      // 添加从最后记录点到当前鼠标位置的线段
      const lastPoint = linePoints[linePoints.length - 1];
      if (lastPoint.x !== currentMousePosition.x || lastPoint.y !== currentMousePosition.y) {
        pathD += ` L ${currentMousePosition.x} ${currentMousePosition.y}`;
      }
    } else {
      // 如果没有点，至少显示起点到鼠标位置的直线
      pathD = `M ${lineStartPoint.x} ${lineStartPoint.y} L ${currentMousePosition.x} ${currentMousePosition.y}`;
    }
    
    console.log("Drawing path:", pathD); // 添加日志，帮助调试
    
    return (
      <svg 
        className="free-connection-line" 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2000  // 确保它在最上层
        }}
      >
        {/* 绘制完整的鼠标轨迹 */}
        <path
          d={pathD}
          stroke="#2196F3" // 更改颜色，使轨迹更明显
          strokeWidth={3}   // 增加线宽，使轨迹更明显
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          strokeDasharray="none" // 移除虚线
          style={{ pointerEvents: 'none' }}
        />
        
        {/* 绘制箭头指示方向 */}
        <polygon
          points={`${currentMousePosition.x},${currentMousePosition.y} 
                  ${currentMousePosition.x - 10},${currentMousePosition.y - 5} 
                  ${currentMousePosition.x - 10},${currentMousePosition.y + 5}`}
          fill="#2196F3"
        />
      </svg>
    );
  }, [drawingLine, lineStartPoint, linePoints, currentMousePosition]);
  
  return {
    freeConnectionMode,
    drawingLine,
    lineStartPoint,
    currentMousePosition,
    linePoints,
    toggleFreeConnectionMode,
    startDrawing,
    drawingMove,
    endDrawing,
    renderFreeConnectionLine
  };
};
