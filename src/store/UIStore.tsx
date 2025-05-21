import { create } from 'zustand';
import { IPosition, ISize } from '../types/CoreTypes';
import { updateBackgroundGrid } from '../utils/canvas/backgroundUtils';
import { RefObject } from 'react';

// 交互模式类型
export type InteractionMode = 'cardSelection' | 'cardMovement' | 'connectionSelection';

// 视口信息类型
interface ViewportInfo {
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  pan: IPosition;
}

// 定义 UI 状态类型
interface UIState {
  // 引用
  mapRef: RefObject<HTMLDivElement | null>;
  
  // 视图状态
  zoomLevel: number;
  pan: IPosition;
  showKeyBindings: boolean;
  showUndoMessage: boolean;
  showRedoMessage: boolean;
  showZoomIndicator: boolean;
  viewportInfo: ViewportInfo;
  
  // 键盘状态
  moveInterval: NodeJS.Timeout | null;
  tabPressed: boolean;
  spacePressed: boolean;
  
  // 交互模式
  interactionMode: InteractionMode;
  
  // 方法 - 引用设置
  setMapRef: (ref: HTMLDivElement | null) => void;
  
  // 方法 - 视图控制
  setZoomLevel: (zoom: number | ((prev: number) => number)) => void;
  setPan: (pan: IPosition | ((prev: IPosition) => IPosition)) => void;
  setShowKeyBindings: (show: boolean) => void;
  setShowUndoMessage: (show: boolean) => void;
  setShowRedoMessage: (show: boolean) => void;
  setShowZoomIndicator: (show: boolean) => void;
  updateViewportInfo: () => void;
  
  // 方法 - 快捷操作
  showZoomInfo: (newZoom: number) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  resetView: () => void;
  getMapSize: () => ISize;
  
  // 方法 - 键盘状态
  setMoveInterval: (interval: NodeJS.Timeout | null) => void;
  setTabPressed: (pressed: boolean) => void;
  setSpacePressed: (pressed: boolean) => void;
  
  // 方法 - 交互模式
  setInteractionMode: (mode: InteractionMode) => void;
}

// 创建 UI 状态 store
export const useUIStore = create<UIState>((set, get) => ({
  // 初始状态 - 引用
  mapRef: { current: null },
  
  // 初始状态 - 视图
  zoomLevel: 1,
  pan: { x: 0, y: 0 },
  showKeyBindings: false,
  showUndoMessage: false,
  showRedoMessage: false,
  showZoomIndicator: false,
  viewportInfo: {
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    zoom: 1,
    pan: { x: 0, y: 0 }
  },
  
  // 初始状态 - 键盘
  moveInterval: null,
  tabPressed: false,
  spacePressed: false,
  
  // 初始状态 - 交互模式
  interactionMode: 'cardSelection',
  
  // 方法 - 引用设置
  setMapRef: (ref) => {
    set({ mapRef: { current: ref } });
    // 更新视口信息
    get().updateViewportInfo();
  },
  
  // 方法 - 视图控制
  setZoomLevel: (zoom) => {
    if (typeof zoom === 'function') {
      set((state) => ({ zoomLevel: zoom(state.zoomLevel) }));
    } else {
      set({ zoomLevel: zoom });
    }
    get().updateViewportInfo();
  },
  
  setPan: (pan) => {
    if (typeof pan === 'function') {
      set((state) => ({ pan: pan(state.pan) }));
    } else {
      set({ pan });
    }
    get().updateViewportInfo();
  },
  
  setShowKeyBindings: (show) => set({ showKeyBindings: show }),
  
  setShowUndoMessage: (show) => set({ showUndoMessage: show }),
  
  setShowRedoMessage: (show) => set({ showRedoMessage: show }),
  
  setShowZoomIndicator: (show) => set({ showZoomIndicator: show }),
  
  updateViewportInfo: () => {
    const { mapRef, zoomLevel, pan } = get();
    
    // 获取视口尺寸
    const viewportWidth = mapRef.current?.clientWidth || window.innerWidth;
    const viewportHeight = mapRef.current?.clientHeight || window.innerHeight;
    
    // 更新视口信息状态
    set({
      viewportInfo: {
        viewportWidth,
        viewportHeight,
        zoom: zoomLevel,
        pan
      }
    });
    
    // 更新背景网格和画布变换
    if (mapRef.current) {
      // 更新背景网格
      updateBackgroundGrid(mapRef.current, zoomLevel, pan);
      
      // 更新无限画布变换
      const infiniteCanvas = mapRef.current.querySelector('.infinite-canvas') as HTMLElement;
      if (infiniteCanvas) {
        infiniteCanvas.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`;
      }
    }
  },
  
  // 方法 - 快捷操作
  showZoomInfo: (newZoom) => {
    // 应用新的缩放级别
    get().setZoomLevel(newZoom);
    
    // 显示缩放指示器
    set({ showZoomIndicator: true });
    
    // 设置定时器隐藏缩放指示器
    setTimeout(() => {
      set({ showZoomIndicator: false });
    }, 1000);
  },
  
  handleZoomIn: () => {
    const { zoomLevel } = get();
    get().showZoomInfo(Math.min(zoomLevel + 0.1, 5));
  },
  
  handleZoomOut: () => {
    const { zoomLevel } = get();
    get().showZoomInfo(Math.max(zoomLevel - 0.1, 0.1));
  },
  
  resetView: () => {
    console.log("[UIStore] 执行重置视图");
    
    // 直接设置状态，确保更新
    set({ 
      pan: { x: 0, y: 0 },
      zoomLevel: 1
    });
    
    // 确保视觉反馈
    set({ showZoomIndicator: true });
    setTimeout(() => {
      set({ showZoomIndicator: false });
    }, 1000);
    
    // 更新视口信息
    const mapRef = get().mapRef;
    if (mapRef.current) {
      // 直接更新DOM
      const infiniteCanvas = mapRef.current.querySelector('.infinite-canvas') as HTMLElement;
      if (infiniteCanvas) {
        infiniteCanvas.style.transform = `translate(0px, 0px) scale(1)`;
      }
      
      // 更新背景网格
      const backgroundGrid = mapRef.current.querySelector('.background-grid') as HTMLElement;
      if (backgroundGrid) {
        backgroundGrid.style.backgroundSize = `20px 20px`;
        backgroundGrid.style.backgroundPosition = `0px 0px`;
      }
    }
  },
  
  getMapSize: () => {
    const { mapRef } = get();
    return {
      width: mapRef.current?.clientWidth || window.innerWidth,
      height: mapRef.current?.clientHeight || window.innerHeight
    };
  },
  
  // 方法 - 键盘状态
  setMoveInterval: (interval) => {
    // 清除旧的定时器
    const { moveInterval } = get();
    if (moveInterval) clearInterval(moveInterval);
    
    // 设置新的定时器
    set({ moveInterval: interval });
  },
  
  // 方法 - 交互模式
  setInteractionMode: (mode) => {
    const prevMode = get().interactionMode;
    set({ interactionMode: mode });
    
    // 如果切换到卡片移动模式，但没有选中卡片，则回到卡片选择模式
    if (mode === 'cardMovement') {
      const cardStore = require('./cardStore').useCardStore.getState();
      if (cardStore.selectedCardIds.length === 0) {
        set({ interactionMode: 'cardSelection' });
        setTimeout(() => {
          console.log('没有选中卡片，已切换回卡片选择模式');
        }, 0);
      }
    }
    
    // 模式切换时进行清理操作
    if (prevMode !== mode) {
      // 如果从卡片相关模式切换到连接线模式
      if ((prevMode === 'cardSelection' || prevMode === 'cardMovement') && 
          mode === 'connectionSelection') {
        const cardStore = require('./cardStore').useCardStore.getState();
        // 清除卡片选择
        if (cardStore.selectedCardIds.length > 0) {
          cardStore.clearSelection();
        }
      }
      
      // 如果从连接线模式切换到卡片相关模式
      if (prevMode === 'connectionSelection' && 
          (mode === 'cardSelection' || mode === 'cardMovement')) {
        const connectionStore = require('./connectionStore').useConnectionStore.getState();
        // 清除连接线选择
        if (connectionStore.selectedConnectionIds.length > 0) {
          connectionStore.clearConnectionSelection();
        }
      }
    }
  },
  
  setTabPressed: (pressed) => set({ tabPressed: pressed }),
  
  setSpacePressed: (pressed) => set({ spacePressed: pressed }),
}));