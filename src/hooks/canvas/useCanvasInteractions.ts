import { useCallback, useEffect } from 'react';
import { Logger } from '../../utils/log';
import { ICard, IConnection } from '../../types/CoreTypes';

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
    
    // 选择框
    const isTargetCanvas = e.currentTarget === canvasRef.current;
    if ((e.button === 0 && !spacePressed && !e.ctrlKey) && isTargetCanvas) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
      const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
      
      startSelectionBox(canvasX, canvasY);
      
      if (!isMultiSelectKey(e)) {
        onCardsSelect([]);
      }
    } 
    // 平移画布
    else if ((e.button === 0 && (spacePressed || e.ctrlKey)) || e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      setIsPanning(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialPan({ ...pan });
      document.body.style.cursor = 'grabbing';
    }
  }, [
    freeConnectionMode, spacePressed, zoomLevel, pan, cards,
    onStartDrawing, canvasRef, startSelectionBox, onCardsSelect,
    isMultiSelectKey, setIsDragging, setIsPanning, setDragStart, setInitialPan
  ]);

  // 处理鼠标移动事件
  const handleMouseMove = useCallback((e: React.MouseEvent<Element, MouseEvent>) => {
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
      // 画布拖动
      const deltaX = e.clientX - pan.x;
      const deltaY = e.clientY - pan.y;
      onPanChange({ x: deltaX, y: deltaY });
    } else if (selectionBox.visible) {
      // 更新选择框
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
      const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
      
      updateSelectionBox(canvasX, canvasY);
    }
  }, [
    freeConnectionMode, drawingLine, isDragging, selectionBox.visible,
    canvasRef, zoomLevel, pan, onDrawingMove, onPanChange, updateSelectionBox
  ]);

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
      
        // 更新背景网格
        const gridSize = 20;
        const gridScale = newZoom >= 1 ? newZoom : 1;
        const scaledGridSize = gridSize * gridScale;
        const offsetX = (newPanX % scaledGridSize) / gridScale;
        const offsetY = (newPanY % scaledGridSize) / gridScale;
        
        const backgroundGrid = element.querySelector('.background-grid') as HTMLElement;
        if (backgroundGrid) {
          backgroundGrid.style.backgroundSize = `${scaledGridSize}px ${scaledGridSize}px`;
          backgroundGrid.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
        }
      
        if (onZoomChange) onZoomChange(newZoom);
        onPanChange({ x: newPanX, y: newPanY });
      } else if (e.shiftKey) {
        // 水平滚动
        const newPanX = pan.x - e.deltaY;
        
        // 更新背景网格
        const gridSize = 20;
        const gridScale = zoomLevel >= 1 ? zoomLevel : 1;
        const scaledGridSize = gridSize * gridScale;
        const offsetX = (newPanX % scaledGridSize) / gridScale;
        const offsetY = (pan.y % scaledGridSize) / gridScale;
        
        const backgroundGrid = element.querySelector('.background-grid') as HTMLElement;
        if (backgroundGrid) {
          backgroundGrid.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
        }
        
        onPanChange({ x: newPanX, y: pan.y });
      } else {
        // 正常滚动
        const newPanX = pan.x - e.deltaX;
        const newPanY = pan.y - e.deltaY;
        
        // 更新背景网格
        const gridSize = 20;
        const gridScale = zoomLevel >= 1 ? zoomLevel : 1;
        const scaledGridSize = gridSize * gridScale;
        const offsetX = (newPanX % scaledGridSize) / gridScale;
        const offsetY = (newPanY % scaledGridSize) / gridScale;
        
        const backgroundGrid = element.querySelector('.background-grid') as HTMLElement;
        if (backgroundGrid) {
          backgroundGrid.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
        }
        
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
    // 可以在此处添加双击创建卡片逻辑
  }, []);

  // 处理背景点击
  const handleBackgroundClick = useCallback((event: React.MouseEvent) => {
    if (!isDragging && !isPanning && !selectionBox.visible && !selectionJustEnded) {
      // 清除选择
      if (selectedCardIds.length > 0) {
        Logger.selection('取消所有选择', '卡片', selectedCardIds);
      }
      if (selectedConnectionIds.length > 0) {
        Logger.selection('取消所有选择', '连接线', selectedConnectionIds);
      }
      
      onCardsSelect([]);
      
      if (selectedConnectionIds.length > 0) {
        selectedConnectionIds.forEach(id => {
          onConnectionSelect(id, true);
        });
      }
    }
  }, [
    isDragging, isPanning, selectionBox.visible, selectionJustEnded,
    selectedCardIds, selectedConnectionIds, onCardsSelect, onConnectionSelect
  ]);

  // 处理卡片点击
  const handleCardClick = useCallback((cardId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!freeConnectionMode) {
      // 选择卡片
      const card = cards.find(c => c.id === cardId);
      const cardInfo = card ? `${cardId} (${card.content.substring(0, 15)}${card.content.length > 15 ? '...' : ''})` : cardId;
      
      // 清除连接线选择
      if (selectedConnectionIds.length > 0) {
        Logger.selection('取消选择', '连接线', selectedConnectionIds);
        selectedConnectionIds.forEach(id => {
          onConnectionSelect(id, true);
        });
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
  }, [connections, selectedConnectionIds, onConnectionSelect]);

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
