import { useCallback, useEffect, useRef } from 'react';
import { Logger } from '../../utils/log';
import { ICard, IConnection } from '../../types/CoreTypes';
import { updateBackgroundGrid } from '../../utils/canvas/backgroundUtils';
import { useUIStore, InteractionMode } from '../../store/UIStore'; // 修正路径从 stores 改为 store
import { useConnectionStore } from '../../store/connectionStore';
import { useCardStore } from '../../store/cardStore'; // 新增：导入卡片存储
import { useHistoryStore } from '../../store/historyStore'; // 新增：导入历史记录存储

interface CanvasInteractionsProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  zoomLevel: number;
  pan: { x: number, y: number };
  cards: ICard[];
  connections: IConnection[];
  freeConnectionMode: boolean;
  drawingLine: boolean;
  selectedCardIds: string[];
  selectedConnectionIds: string[];
  isDragging: boolean;
  isPanning: boolean;
  spacePressed: boolean;
  interactionMode: InteractionMode;
  dragStart: { x: number, y: number };
  initialPan: { x: number, y: number };
  selectionBox: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    visible: boolean;
  };
  selectionJustEnded: boolean;
  
  // 状态更新函数
  setIsDragging: (value: boolean) => void;
  setIsPanning: (value: boolean) => void;
  setDragStart: (point: { x: number, y: number }) => void;
  setInitialPan: (pan: { x: number, y: number }) => void;
  setSelectionJustEnded: (value: boolean) => void;
  
  // 选择框相关函数
  startSelectionBox: (x: number, y: number) => void;
  updateSelectionBox: (x: number, y: number) => void;
  endSelectionBox: () => void;
  getCardsInSelectionBox: () => string[];
  getConnectionsInSelectionBox: () => string[];
  
  // 回调函数
  onCardSelect: (cardId: string, isMultiSelect: boolean) => void;
  onConnectionSelect: (connectionId: string, isMultiSelect: boolean) => void;
  onCardsSelect: (cardIds: string[]) => void;
  onPanChange: (newPan: { x: number, y: number }) => void;
  onZoomChange?: (newZoom: number) => void;
  onStartDrawing?: (x: number, y: number, cardId: string | null) => void;
  onDrawingMove?: (x: number, y: number) => void;
  onEndDrawing?: (x: number, y: number, cardId: string | null) => void;
}

/**
 * 处理Canvas交互行为
 */
export const useCanvasInteractions = ({
  canvasRef,
  zoomLevel,
  pan,
  cards,
  connections,
  freeConnectionMode,
  drawingLine,
  selectedCardIds,
  selectedConnectionIds,
  isDragging,
  isPanning,
  spacePressed,
  selectionBox,
  selectionJustEnded,
  interactionMode, // 添加交互模式参数
  dragStart,
  initialPan,

  // 状态更新函数
  setIsDragging,
  setIsPanning,
  setDragStart,
  setInitialPan,
  setSelectionJustEnded,

  // 选择框相关函数
  startSelectionBox,
  updateSelectionBox,
  endSelectionBox,
  getCardsInSelectionBox,
  getConnectionsInSelectionBox,

  // 回调函数
  onCardSelect,
  onConnectionSelect,
  onCardsSelect,
  onPanChange,
  onZoomChange,
  onStartDrawing,
  onDrawingMove,
  onEndDrawing
}: CanvasInteractionsProps) => {

  // 用于节流鼠标移动事件的refs
  const mouseMoveAnimationRef = useRef<number | null>(null);
  const lastMouseEventRef = useRef<React.MouseEvent<Element, MouseEvent> | null>(null);

  // 判断是否按下了修饰键 (用于多选)
  const isMultiSelectKey = useCallback((e: MouseEvent | React.MouseEvent): boolean => {
    return e.ctrlKey || e.metaKey || e.shiftKey;
  }, []);

  // 处理鼠标按下事件
  const handleMouseDown = useCallback((e: React.MouseEvent<Element, MouseEvent>) => {
    // 自由连线模式
    if (freeConnectionMode && e.button === 0) {
      e.stopPropagation();
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = (e.clientX - rect.left - pan.x) / zoomLevel;
      const y = (e.clientY - rect.top - pan.y) / zoomLevel;
      
      // 查找点击位置是否在卡片上
      const clickedCard = cards.find(card => 
        x >= card.x && x <= card.x + card.width && 
        y >= card.y && y <= card.y + card.height
      );
      
      if (onStartDrawing) {
        onStartDrawing(x, y, clickedCard?.id || null);
      }
      return;
    }
    
    // 选择框 - 仅在非画布拖动模式下启用
    const isTargetCanvas = e.currentTarget === canvasRef.current;
    if ((e.button === 0 && !spacePressed && !e.ctrlKey) && isTargetCanvas && interactionMode !== 'canvasDrag') {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
      const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;

      startSelectionBox(canvasX, canvasY);

      if (!isMultiSelectKey(e)) {
        onCardsSelect([]);
      }
    }
    // 平移画布 - 在画布拖动模式下或按住空格键/Ctrl键时
    else if ((e.button === 0 && (spacePressed || e.ctrlKey || interactionMode === 'canvasDrag')) || e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialPan({ ...pan });
      document.body.style.cursor = 'grabbing';
    }
  }, [
    freeConnectionMode, spacePressed, zoomLevel, pan, cards, interactionMode,
    onStartDrawing, canvasRef, startSelectionBox, onCardsSelect,
    isMultiSelectKey, setIsDragging, setIsPanning, setDragStart, setInitialPan
  ]);

  // 实际处理鼠标移动的函数
  const processMouseMove = useCallback(() => {
    const e = lastMouseEventRef.current;
    if (!e) return;

    if (freeConnectionMode && drawingLine) {
      e.stopPropagation();

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = (e.clientX - rect.left - pan.x) / zoomLevel;
      const y = (e.clientY - rect.top - pan.y) / zoomLevel;

      if (onDrawingMove) {
        onDrawingMove(x, y);
      }
      return;
    }

    if (isDragging) {
      // 画布拖动 - 修复坐标计算
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const newPanX = initialPan.x + deltaX;
      const newPanY = initialPan.y + deltaY;
      onPanChange({ x: newPanX, y: newPanY });
    } else if (selectionBox.visible) {
      // 更新选择框
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
      const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;

      updateSelectionBox(canvasX, canvasY);
    }

    mouseMoveAnimationRef.current = null;
  }, [
    freeConnectionMode, drawingLine, isDragging, selectionBox.visible,
    canvasRef, zoomLevel, pan, dragStart, initialPan, onDrawingMove, onPanChange, updateSelectionBox
  ]);

  // 处理鼠标移动事件（使用requestAnimationFrame节流）
  const handleMouseMove = useCallback((e: React.MouseEvent<Element, MouseEvent>) => {
    lastMouseEventRef.current = e;

    // 如果已经有待处理的动画帧，不重复请求
    if (mouseMoveAnimationRef.current === null) {
      mouseMoveAnimationRef.current = requestAnimationFrame(processMouseMove);
    }
  }, [processMouseMove]);

  // 处理鼠标释放事件
  const handleMouseUp = useCallback((e: React.MouseEvent<Element, MouseEvent>) => {
    if (freeConnectionMode && drawingLine) {
      e.stopPropagation();
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = (e.clientX - rect.left - pan.x) / zoomLevel;
      const y = (e.clientY - rect.top - pan.y) / zoomLevel;
      
      const targetCard = cards.find(card => 
        x >= card.x && x <= card.x + card.width &&
        y >= card.y && y <= card.y + card.height
      );
      
      if (onEndDrawing) {
        onEndDrawing(x, y, targetCard?.id || null);
      }
      return;
    }
    
    if (isDragging) {
      setIsDragging(false);
      setIsPanning(false);
      document.body.style.cursor = spacePressed ? 'grab' : '';
    }
  }, [
    freeConnectionMode, drawingLine, isDragging, spacePressed,
    canvasRef, zoomLevel, pan, cards, onEndDrawing,
    setIsDragging, setIsPanning
  ]);

  // 处理鼠标滚轮事件
  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return;
    
    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault(); // 阻止默认行为
      
      if (e.ctrlKey || e.metaKey) {
        // 缩放处理
        const rect = element.getBoundingClientRect();
        if (!rect) return;
      
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const canvasX = (mouseX - pan.x) / zoomLevel;
        const canvasY = (mouseY - pan.y) / zoomLevel;
      
        const delta = -e.deltaY * 0.001 * zoomLevel;
        const newZoom = Math.min(Math.max(zoomLevel + delta, 0.1), 5);
      
        const newPanX = mouseX - canvasX * newZoom;
        const newPanY = mouseY - canvasY * newZoom;
      
        // 更新背景网格 - 使用集中的工具函数
        updateBackgroundGrid(element, newZoom, { x: newPanX, y: newPanY });
      
        if (onZoomChange) onZoomChange(newZoom);
        onPanChange({ x: newPanX, y: newPanY });
      } else if (e.shiftKey) {
        // 水平滚动
        const newPanX = pan.x - e.deltaY;
        
        // 更新背景网格
        updateBackgroundGrid(element, zoomLevel, { x: newPanX, y: pan.y });
        
        onPanChange({ x: newPanX, y: pan.y });
      } else {
        // 正常滚动
        const newPanX = pan.x - e.deltaX;
        const newPanY = pan.y - e.deltaY;
        
        // 更新背景网格
        updateBackgroundGrid(element, zoomLevel, { x: newPanX, y: newPanY });
        
        onPanChange({ x: newPanX, y: newPanY });
      }
    };
  
    element.addEventListener('wheel', wheelHandler, { passive: false });
    
    return () => {
      element.removeEventListener('wheel', wheelHandler);
    };
  }, [zoomLevel, pan, canvasRef, onZoomChange, onPanChange]);

  // 处理双击事件
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // 如果点击的是卡片，那么事件已经被卡片组件处理，无需在这里处理
    if ((e.target as HTMLElement).closest('.card')) {
      return;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // 计算鼠标在Canvas中的实际位置（考虑缩放和平移）
    const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
    const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;

    // 创建新卡片并进入编辑模式
    const cardStore = useCardStore.getState();
    const historyStore = useHistoryStore.getState();

    // 添加历史记录
    historyStore.addToHistory();

    // 卡片尺寸
    const cardWidth = 160;
    const cardHeight = 80;

    // 计算视口边界（在画布坐标系中）
    const viewportLeft = -pan.x / zoomLevel;
    const viewportTop = -pan.y / zoomLevel;
    const viewportRight = viewportLeft + rect.width / zoomLevel;
    const viewportBottom = viewportTop + rect.height / zoomLevel;

    // 确保卡片完全在可视区域内
    let cardX = canvasX - cardWidth / 2;  // 以鼠标位置为中心
    let cardY = canvasY - cardHeight / 2;

    // 边界检查和调整
    const margin = 10; // 边缘留白
    cardX = Math.max(viewportLeft + margin, Math.min(cardX, viewportRight - cardWidth - margin));
    cardY = Math.max(viewportTop + margin, Math.min(cardY, viewportBottom - cardHeight - margin));

    // 在调整后的位置创建新卡片
    const newCard = cardStore.createCardAtPosition({
      x: cardX,
      y: cardY
    });
    
    // 直接进入编辑模式
    setTimeout(() => {
      cardStore.setEditingCardId(newCard.id);
    }, 10);
  }, [canvasRef, zoomLevel, pan]);

  // 处理背景点击
  const handleBackgroundClick = useCallback((event: React.MouseEvent) => {
    // 简化条件检查
    const wasDragging = document.querySelector('.card[data-was-dragged="true"]');
    const uiStore = useUIStore.getState();
    const connectionStore = useConnectionStore.getState();

    // 修复：分离连接线相关状态的清除逻辑，确保无论其他条件如何，都会清除连接线状态
    const isConnectionSelectionMode = uiStore.interactionMode === 'connectionSelection';
    const hasSelectedConnections = selectedConnectionIds.length > 0;
    const isEditingConnection = connectionStore.editingConnectionId !== null;

    // 检查是否处于拖拽或选择框状态
    const isInteracting = isDragging || isPanning || selectionBox.visible || selectionJustEnded || wasDragging;

    // 无论是否处于交互状态，都处理连接线的清除
    if (hasSelectedConnections || isConnectionSelectionMode || isEditingConnection) {
      if (hasSelectedConnections) {
        Logger.selection('取消所有选择', '连接线', selectedConnectionIds);
      }
      
      // 强制清除所有连接线相关状态
      connectionStore.clearConnectionSelection();
      connectionStore.setEditingConnectionId(null);
      
      // 强制切换回卡片选择模式
      if (isConnectionSelectionMode) {
        uiStore.setInteractionMode('cardSelection');
      }
    }

    // 只有在不处于交互状态时才处理卡片选择的清除
    if (!isInteracting && selectedCardIds.length > 0) {
      Logger.selection('取消所有选择', '卡片', selectedCardIds);
      onCardsSelect([]);
    }
  }, [isDragging, isPanning, selectionBox.visible, selectionJustEnded, 
      selectedCardIds, selectedConnectionIds, onCardsSelect]);

  // 处理卡片点击
  const handleCardClick = useCallback((cardId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // 检查拖拽状态
    const wasDragged = (event.currentTarget as HTMLElement)?.dataset?.wasDragged === 'true';
    
    // 如果不是自由连线模式且卡片没有被拖拽，才处理点击事件
    if (!freeConnectionMode && !wasDragged) {
      // 切换到卡片选择模式
      const uiStore = useUIStore.getState();
      uiStore.setInteractionMode('cardSelection');
      
      // 选择卡片
      const card = cards.find(c => c.id === cardId);
      const cardInfo = card ? `${cardId} (${card.content.substring(0, 15)}${card.content.length > 15 ? '...' : ''})` : cardId;
      
      // 判断是否在多选列表中
      const isInMultiSelection = selectedCardIds.length > 1 && selectedCardIds.includes(cardId);
      
      // 清除连接线选择
      if (selectedConnectionIds.length > 0) {
        Logger.selection('取消选择', '连接线', selectedConnectionIds);
        selectedConnectionIds.forEach(id => {
          onConnectionSelect(id, true);
        });
      }
      
      // 如果是已经在多选列表中的卡片，保持多选状态
      if (isInMultiSelection && !event.ctrlKey && !event.metaKey) {
        // 不做任何操作，保持多选状态
        return;
      }
      
      // 处理卡片选择
      if (event.ctrlKey || event.metaKey) {
        if (selectedCardIds.includes(cardId)) {
          Logger.selection('取消选择', '卡片', cardInfo);
        } else {
          Logger.selection('添加选择', '卡片', cardInfo);
        }
      } else {
        if (!selectedCardIds.includes(cardId)) {
          Logger.selection('选择', '卡片', cardInfo);
        }
      }
      
      onCardSelect(cardId, event.ctrlKey || event.metaKey);
    }
  }, [freeConnectionMode, cards, selectedCardIds, selectedConnectionIds, onCardSelect, onConnectionSelect]);

  // 处理连接线点击
  const handleConnectionClick = useCallback((connectionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // 切换到连接线选择模式
    const uiStore = useUIStore.getState();
    uiStore.setInteractionMode('connectionSelection');
    
    // 清除卡片选择
    if (selectedCardIds.length > 0) {
      Logger.selection('取消所有选择', '卡片', selectedCardIds);
      onCardsSelect([]);
    }
    
    const connection = connections.find(conn => conn.id === connectionId);
    const connectionInfo = connection 
      ? `${connectionId} (${connection.startCardId} → ${connection.endCardId})` 
      : connectionId;
      
    if (event.ctrlKey || event.metaKey) {
      // 多选模式
      if (selectedConnectionIds.includes(connectionId)) {
        Logger.selection('取消选择', '连接线', connectionInfo);
      } else {
        Logger.selection('添加选择', '连接线', connectionInfo);
      }
      onConnectionSelect(connectionId, true);
    } else {
      // 单选模式
      if (selectedConnectionIds.length > 0) {
        const deselectedConnections = selectedConnectionIds.filter(id => id !== connectionId);
        if (deselectedConnections.length > 0) {
          const deselectedInfo = deselectedConnections.map(id => {
            const conn = connections.find(c => c.id === id);
            return conn ? `${id} (${conn.startCardId} → ${conn.endCardId})` : id;
          });
          Logger.selection('取消选择', '连接线', deselectedInfo);
        }
      }
      
      if (!selectedConnectionIds.includes(connectionId) || selectedConnectionIds.length > 1) {
        Logger.selection('选择', '连接线', connectionInfo);
      }
      
      onConnectionSelect(connectionId, false);
    }
  }, [connections, selectedCardIds, selectedConnectionIds, onCardsSelect, onConnectionSelect]);

  // 右键菜单处理
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // 可以在此处添加自定义右键菜单逻辑
  }, []);

  // 处理选区事件监听
  useEffect(() => {
    if (!selectionBox.visible) return;

    const handleDocumentMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
      const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
      
      updateSelectionBox(canvasX, canvasY);
      
      // 实时选择框选区域内的卡片和连接线
      const selectedCardIds = getCardsInSelectionBox();
      const selectedConnIds = getConnectionsInSelectionBox();
      
      onCardsSelect(selectedCardIds);
      
      if (selectedConnIds.length > 0) {
        selectedConnIds.forEach(connId => {
          onConnectionSelect(connId, true);
        });
      }
    };
    
    const handleDocumentMouseUp = () => {
      const selectedCardIds = getCardsInSelectionBox();
      const selectedConnIds = getConnectionsInSelectionBox();
      
      if (selectedCardIds.length > 0 || selectedConnIds.length > 0) {
        setSelectionJustEnded(true);
        setTimeout(() => setSelectionJustEnded(false), 100);
      }
      
      if (selectedCardIds.length > 0) {
        onCardsSelect(selectedCardIds);
      }
      
      if (selectedConnIds.length > 0) {
        selectedConnIds.forEach(connId => {
          onConnectionSelect(connId, true);
        });
      }
      
      endSelectionBox();
    };
    
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleDocumentMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [
    selectionBox.visible, canvasRef, zoomLevel, pan,
    updateSelectionBox, endSelectionBox, getCardsInSelectionBox,
    getConnectionsInSelectionBox, onCardsSelect, onConnectionSelect,
    setSelectionJustEnded
  ]);

  // 清理动画帧
  useEffect(() => {
    return () => {
      if (mouseMoveAnimationRef.current !== null) {
        cancelAnimationFrame(mouseMoveAnimationRef.current);
      }
    };
  }, []);

  return {
    // 交互处理函数
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDoubleClick,
    handleBackgroundClick,
    handleCardClick,
    handleConnectionClick,
    handleContextMenu,
    isMultiSelectKey
  };
};
