import { create } from 'zustand';
import { createConnectionService } from '../utils/interactions';

interface FreeConnectionState {
  // 状态
  freeConnectionMode: boolean;
  drawingLine: boolean;
  lineStartPoint: { x: number; y: number; cardId: string | null };
  currentMousePosition: { x: number; y: number };
  linePoints: Array<{x: number; y: number}>;
  
  // 方法
  toggleFreeConnectionMode: (value?: boolean) => void;
  startDrawing: (x: number, y: number, cardId: string | null) => void;
  drawingMove: (x: number, y: number) => void;
  endDrawing: (x: number, y: number, cardId: string | null) => void;
}

export const useFreeConnectionStore = create<FreeConnectionState>((set, get) => ({
  // 初始状态
  freeConnectionMode: false,
  drawingLine: false,
  lineStartPoint: { x: 0, y: 0, cardId: null },
  currentMousePosition: { x: 0, y: 0 },
  linePoints: [],
  
  // 方法
  toggleFreeConnectionMode: (value) => set(state => ({
    freeConnectionMode: value !== undefined ? value : !state.freeConnectionMode,
    // 切换模式时重置绘制状态
    drawingLine: false,
    linePoints: []
  })),
  
  startDrawing: (x, y, cardId) => set({
    drawingLine: true,
    lineStartPoint: { x, y, cardId },
    currentMousePosition: { x, y },
    linePoints: [{ x, y }]
  }),
  
  drawingMove: (x, y) => {
    const { linePoints } = get();
    set({ currentMousePosition: { x, y } });
    
    // 记录点，确保有足够的轨迹点
    const lastPoint = linePoints[linePoints.length - 1];
    if (lastPoint) {
      const distance = Math.sqrt(Math.pow(x - lastPoint.x, 2) + Math.pow(y - lastPoint.y, 2));
      
      // 减小记录点的间距，确保更密集的轨迹
      if (distance > 5) {
        set(state => ({
          linePoints: [...state.linePoints, { x, y }]
        }));
      }
    }
  },
  
  endDrawing: (x, y, endCardId) => {
    const { drawingLine, linePoints, lineStartPoint } = get();
    if (!drawingLine) return;
    
    // 最后一个点
    const finalPoints = [...linePoints, { x, y }];
    
    // 如果起点和终点都有卡片ID，创建连接线
    if (lineStartPoint.cardId && endCardId && lineStartPoint.cardId !== endCardId) {
      createConnectionService(lineStartPoint.cardId, endCardId, finalPoints);
    }
    
    // 清空状态
    set({
      drawingLine: false,
      linePoints: []
    });
  }
}));