import { useCallback, useState } from 'react';
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
  };
};
