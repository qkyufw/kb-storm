import { useCallback, useState } from 'react';
import { ICard } from '../types';

interface UseFreeConnectionParams {
  cards: ICard[];
  onCreateConnection?: (startCardId: string | null, endCardId: string | null, points: {x: number, y: number}[]) => void;
}

// 这是一个不含JSX的实现版本，可以在文件被重命名为.tsx之前使用
export const useFreeConnection = ({ 
  cards,
  onCreateConnection 
}: UseFreeConnectionParams) => {
  // 状态管理
  const [freeConnectionMode, setFreeConnectionMode] = useState(false);
  const [drawingLine, setDrawingLine] = useState(false);
  const [lineStartPoint, setLineStartPoint] = useState({ x: 0, y: 0, cardId: null as string | null });
  const [currentMousePosition, setCurrentMousePosition] = useState({ x: 0, y: 0 });
  const [linePoints, setLinePoints] = useState<{x: number, y: number}[]>([]);
  
  // 简化无JSX版本的实现
  const toggleFreeConnectionMode = useCallback(() => {
    setFreeConnectionMode(prev => !prev);
    setDrawingLine(false);
  }, []);
  
  const startDrawing = useCallback((x: number, y: number, cardId: string | null) => {
    setDrawingLine(true);
    setLineStartPoint({ x, y, cardId });
    setCurrentMousePosition({ x, y });
    setLinePoints([{ x, y }]);
  }, []);
  
  const drawingMove = useCallback((x: number, y: number) => {
    setCurrentMousePosition({ x, y });
    
    const lastPoint = linePoints[linePoints.length - 1];
    if (lastPoint) {
      const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
      
      // 降低记录点的间距，使轨迹更加平滑
      if (distance > 5) {  // 从10改为5，记录更多点使轨迹更平滑
        setLinePoints(prev => [...prev, { x, y }]);
      }
    }
  }, [linePoints]);
  
  const endDrawing = useCallback((x: number, y: number, endCardId: string | null) => {
    if (!drawingLine) return;
    
    setDrawingLine(false);
    const finalPoints = [...linePoints, { x, y }];
    
    if (onCreateConnection) {
      onCreateConnection(lineStartPoint.cardId, endCardId, finalPoints);
    }
    
    setLinePoints([]);
  }, [drawingLine, linePoints, lineStartPoint.cardId, onCreateConnection]);
  
  // 返回null，因为ts文件不支持JSX
  const renderFreeConnectionLine = useCallback(() => null, []);
  
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
