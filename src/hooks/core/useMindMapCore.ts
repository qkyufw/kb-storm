import { useState, useRef, useCallback } from 'react';
import { useCards } from './useCards';
import { useConnections } from './useConnections';
import { useKeyBindings } from '../interaction/useKeyboardShortcuts';
import { useHistory } from '../core/useHistory';
import { useClipboard } from '../core/useClipboard';
import { useDeleteOperation } from '../selection/useDeleteOperation';
import { useMousePosition } from './useMousePosition';
import { ISize } from '../../types/CoreTypes';

/**
 * 思维导图核心状态和逻辑管理钩子
 */
export const useMindMapCore = () => {
  // 修改 mapRef 的类型定义
  const mapRef = useRef<HTMLDivElement | null>(null);
  
  // 视图状态
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showKeyBindings, setShowKeyBindings] = useState<boolean>(false);
  const [showUndoMessage, setShowUndoMessage] = useState<boolean>(false);
  const [showRedoMessage, setShowRedoMessage] = useState<boolean>(false);
  const [viewportInfo, setViewportInfo] = useState({
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    zoom: 1,
    pan: { x: 0, y: 0 }
  });
  
  // 键盘状态
  const [moveInterval, setMoveInterval] = useState<NodeJS.Timeout | null>(null);
  const [tabPressed, setTabPressed] = useState<boolean>(false);
  const [spacePressed, setSpacePressed] = useState<boolean>(false); // 添加空格键状态
  
  // 使用各种钩子
  const cards = useCards();
  const connections = useConnections();
  const { keyBindings, updateKeyBindings } = useKeyBindings();
  
  // 缩放指示器相关
  const zoomIndicatorTimer = useRef<NodeJS.Timeout | null>(null);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  
  // 历史记录管理
  const restoreState = useCallback((state: { 
    cards: ReturnType<typeof useCards>['cards'], 
    connections: ReturnType<typeof useConnections>['connections'], 
    selectedCardId: string | null 
  }) => {
    cards.setCardsData(state.cards);
    connections.setConnectionsData(state.connections);
    cards.setSelectedCardId(state.selectedCardId);
  }, [cards, connections]);
  
  const history = useHistory(
    cards.cards,
    connections.connections,
    cards.selectedCardId,
    restoreState
  );
  
  // 鼠标位置跟踪
  const mousePosition = useMousePosition(mapRef, zoomLevel, pan);
  
  // 剪贴板操作
  const clipboard = useClipboard(
    cards.cards,
    connections.connections,
    cards.selectedCardIds,
    connections.selectedConnectionIds,
    cards.deleteCards,
    connections.deleteSelectedConnections,
    cards.clearSelection,
    connections.clearConnectionSelection,
    cards.setCardsData,
    connections.setConnectionsData,
    cards.selectCards
  );
  
  // 选择和删除操作
  const selection = useDeleteOperation(
    cards.cards,
    cards.selectedCardIds,
    connections.selectedConnectionIds,
    cards.deleteCard,
    connections.deleteCardConnections,
    connections.deleteConnection,
    cards.clearSelection,
    connections.clearConnectionSelection,
    cards.selectCards
  );
  
  // 显示缩放信息
  const showZoomInfo = useCallback((newZoom: number) => {
    setZoomLevel(newZoom);
    setShowZoomIndicator(true);
    
    if (zoomIndicatorTimer.current) {
      clearTimeout(zoomIndicatorTimer.current);
    }
    
    zoomIndicatorTimer.current = setTimeout(() => {
      setShowZoomIndicator(false);
      zoomIndicatorTimer.current = null;
    }, 1000);
  }, []);
  
  // 获取当前视口信息
  const updateViewportInfo = useCallback(() => {
    setViewportInfo(prev => ({
      ...prev,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      zoom: zoomLevel,
      pan
    }));
  }, [zoomLevel, pan]);
  
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
  
  // 获取画布尺寸
  const getMapSize = useCallback((): ISize => ({
    width: mapRef.current?.clientWidth || 800,
    height: mapRef.current?.clientHeight || 600
  }), []);
  
  // 撤销和重做
  const handleUndo = useCallback(() => {
    if (history.canUndo) {
      history.undo();
      setShowUndoMessage(true);
      setTimeout(() => setShowUndoMessage(false), 800);
    }
  }, [history]);
  
  const handleRedo = useCallback(() => {
    if (history.canRedo) {
      history.redo();
      setShowRedoMessage(true);
      setTimeout(() => setShowRedoMessage(false), 800);
    }
  }, [history]);
  
  // 粘贴到鼠标位置
  const handlePaste = useCallback(() => {
    clipboard.handlePaste(mousePosition);
  }, [clipboard, mousePosition]);
  
  // 提供统一的状态和函数
  return {
    // 引用
    mapRef,
    
    // 状态
    zoomLevel,
    pan,
    showHelp,
    showKeyBindings,
    showUndoMessage,
    showRedoMessage,
    viewportInfo,
    moveInterval,
    tabPressed,
    spacePressed,
    keyBindings,
    
    // 子模块
    cards,
    connections,
    history, // 确保返回了history对象
    clipboard,
    selection,
    
    // 函数
    setZoomLevel,
    setPan,
    setShowHelp,
    setShowKeyBindings,
    setMoveInterval,
    setTabPressed,
    setSpacePressed,
    updateKeyBindings,
    showZoomInfo,
    updateViewportInfo,
    handleZoomIn,
    handleZoomOut,
    resetView,
    getMapSize,
    handleUndo,
    handleRedo,
    handlePaste,
    
    // 数据
    mousePosition
  };
};

export default useMindMapCore;
