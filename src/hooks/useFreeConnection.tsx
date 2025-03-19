import React, { useCallback, useState } from 'react';
import { ICard } from '../types';

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
    
    // 可以选择每隔一定距离记录一个点，而不是每次移动都记录
    const lastPoint = linePoints[linePoints.length - 1];
    const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
    
    // 每隔10个像素记录一个点，避免点过多
    if (distance > 10) {
      setLinePoints(prev => [...prev, { x, y }]);
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
          zIndex: 999
        }}
      >
        <path
          d={`M ${lineStartPoint.x} ${lineStartPoint.y} 
             C ${lineStartPoint.x + Math.abs((currentMousePosition.x - lineStartPoint.x) / 2)} ${lineStartPoint.y},
               ${currentMousePosition.x - Math.abs((currentMousePosition.x - lineStartPoint.x) / 2)} ${currentMousePosition.y}, 
               ${currentMousePosition.x} ${currentMousePosition.y}`}
          stroke="#4285f4"
          strokeWidth={2}
          strokeDasharray="5,5"
          fill="none"
        />
        <polygon
          points={`${currentMousePosition.x},${currentMousePosition.y} 
                  ${currentMousePosition.x - 10},${currentMousePosition.y - 5} 
                  ${currentMousePosition.x - 10},${currentMousePosition.y + 5}`}
          fill="#4285f4"
        />
      </svg>
    );
  }, [drawingLine, lineStartPoint, currentMousePosition]);
  
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
