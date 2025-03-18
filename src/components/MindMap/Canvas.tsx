import React, { forwardRef, useState, useEffect, useCallback, useRef } from 'react';
import Card from '../Card';
import Connection from '../Connection';
import { ICard, IConnection } from '../../types';
import { LogUtils } from '../../utils/logUtils'; // 导入日志工具

interface CanvasProps {
  cards: ICard[];
  connections: IConnection[];
  selectedCardId: string | null;
  selectedCardIds: string[]; // 添加多选卡片ID数组
  selectedConnectionIds: string[]; // 添加选中的连接线ID数组
  editingCardId: string | null;
  connectionMode: boolean;
  connectionStart?: string | null; // 添加连接线起始卡片 ID
  zoomLevel: number;
  pan: { x: number, y: number };
  onCardSelect: (cardId: string, isMultiSelect: boolean) => void; // 修改选卡回调以支持多选
  onCardsSelect: (cardIds: string[]) => void; // 添加批量选择卡片的回调
  onConnectionSelect: (connectionId: string, isMultiSelect: boolean) => void; // 添加连接线选择回调
  onCardContentChange: (cardId: string, content: string) => void;
  onEditComplete: () => void;
  onPanChange: (newPan: { x: number, y: number }) => void;
  onZoomChange?: (newZoom: number) => void;
  onCardMove?: (cardId: string, deltaX: number, deltaY: number) => void;
  onMultipleCardMove?: (cardIds: string[], deltaX: number, deltaY: number) => void; // 添加多卡片移动回调
  connectionSelectionMode?: boolean; // 添加连接线选择模式标志
  editingConnectionId?: string | null; // 添加正在编辑的连接线ID
  onConnectionLabelChange?: (connectionId: string, label: string) => void; // 添加连接线标签变更回调
  onConnectionEditComplete?: () => void; // 添加连接线编辑完成回调
  connectionTargetCardId?: string | null;
  freeConnectionMode?: boolean;  // 是否处于自由连线模式
  drawingLine?: boolean;         // 是否正在绘制线条
  lineStartPoint?: { x: number, y: number, cardId: string | null }; // 线条起点
  currentMousePosition?: { x: number, y: number }; // 当前鼠标位置
  onStartDrawing?: (x: number, y: number, cardId: string | null) => void; // 开始绘制线条
  onDrawingMove?: (x: number, y: number) => void; // 绘制过程中移动
  onEndDrawing?: (x: number, y: number, cardId: string | null) => void; // 结束绘制线条
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>((
  { 
    cards, 
    connections, 
    selectedCardId,
    selectedCardIds, 
    selectedConnectionIds, // 添加选中的连接线ID数组
    editingCardId, 
    connectionMode,
    connectionStart = null, // 添加默认值
    zoomLevel,
    pan,
    onCardSelect,
    onConnectionSelect, // 添加连接线选择回调
    onCardsSelect,
    onCardContentChange,
    onEditComplete,
    onPanChange,
    onZoomChange,
    onCardMove,
    onMultipleCardMove,
    connectionSelectionMode = false, // 默认为false
    editingConnectionId = null, 
    onConnectionLabelChange,
    onConnectionEditComplete,
    connectionTargetCardId = null,
    freeConnectionMode = false,
    drawingLine = false,
    lineStartPoint = { x: 0, y: 0, cardId: null },
    currentMousePosition = { x: 0, y: 0 },
    onStartDrawing,
    onDrawingMove,
    onEndDrawing
  }, 
  ref
) => {
  // 用于跟踪鼠标拖动
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });
  // 添加 isPanning 状态变量
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const drawLayerRef = useRef<HTMLDivElement>(null);

  // 添加空格按下状态跟踪
  const [spacePressed, setSpacePressed] = useState(false);
  
  // 增加背景网格设置
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [gridVisible, setGridVisible] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const gridSize = 40; // 网格大小，可以调整
  
  // 添加选区相关状态
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    visible: boolean;
  }>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    visible: false
  });

  // 判断是否按下了修饰键 (用于多选)
  const isMultiSelectKey = useCallback((e: MouseEvent | React.MouseEvent): boolean => {
    return e.ctrlKey || e.metaKey || e.shiftKey;
  }, []);

  // 处理鼠标按下事件，开始拖动或选区
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 如果在自由连线模式下，处理连线开始
    if (freeConnectionMode && e.button === 0) {
      e.stopPropagation();
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = (e.clientX - rect.left - pan.x) / zoomLevel;
      const y = (e.clientY - rect.top - pan.y) / zoomLevel;
      
      // 查找点击位置是否在某个卡片上
      const clickedCard = cards.find(card => {
        return (
          x >= card.x &&
          x <= card.x + card.width &&
          y >= card.y &&
          y <= card.y + card.height
        );
      });
      
      if (onStartDrawing) {
        onStartDrawing(x, y, clickedCard?.id || null);
      }
      return;
    }
    
    // 简化检查逻辑，只要点击了Canvas组件内部都允许框选，而不是特定区域
    const isTargetCanvas = e.currentTarget === canvasRef.current;
    
    if ((e.button === 0 && !spacePressed && !e.ctrlKey) && isTargetCanvas) {
      // 开始选区
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // 计算画布坐标
      const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
      const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
      
      setSelectionBox({
        startX: canvasX,
        startY: canvasY,
        endX: canvasX,
        endY: canvasY,
        visible: true
      });

      // 如果不按多选键，清除之前的选择
      if (!isMultiSelectKey(e)) {
        onCardsSelect([]);
      }
    } else if ((e.button === 0 && (spacePressed || e.ctrlKey)) || e.button === 1) {
      // 开始平移画布
      e.preventDefault();
      setIsDragging(true);
      setIsPanning(true); // 设置为平移模式
      setDragStart({ x: e.clientX, y: e.clientY });
      setInitialPan({ ...pan });
      document.body.style.cursor = 'grabbing';
    }
  }, [pan, zoomLevel, spacePressed, onCardsSelect, freeConnectionMode, onStartDrawing, cards]);

  // 处理鼠标移动事件
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
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
      // 拖动画布逻辑
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      onPanChange({
        x: initialPan.x + deltaX,
        y: initialPan.y + deltaY
      });
    } else if (selectionBox.visible) {
      // 更新选区
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
      const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
      
      setSelectionBox(prev => ({
        ...prev,
        endX: canvasX,
        endY: canvasY
      }));
    }
  }, [isDragging, dragStart, initialPan, onPanChange, selectionBox.visible, zoomLevel, pan, freeConnectionMode, drawingLine, onDrawingMove]);

  // 获取选区中的卡片
  const getCardsInSelectionBox = useCallback(() => {
    if (!selectionBox.visible) return [];

    // 确保选区坐标正确（兼容从任意方向拖动）
    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const right = Math.max(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const bottom = Math.max(selectionBox.startY, selectionBox.endY);

    // 找出所有在选区内的卡片（要求卡片完全在选区内）
    return cards.filter(card => {
      // 计算卡片边界
      const cardLeft = card.x;
      const cardRight = card.x + card.width;
      const cardTop = card.y;
      const cardBottom = card.y + card.height;

      // 检查卡片是否完全包含在选区内
      return (
        cardLeft >= left &&
        cardRight <= right &&
        cardTop >= top &&
        cardBottom <= bottom
      );
    }).map(card => card.id);
  }, [selectionBox, cards]);

  // 获取选区中的连接线
  const getConnectionsInSelectionBox = useCallback(() => {
    if (!selectionBox.visible) return [];

    // 确保选区坐标正确（兼容从任意方向拖动）
    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const right = Math.max(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const bottom = Math.max(selectionBox.startY, selectionBox.endY);

    // 找出所有线的中点在选区内的连接线
    return connections.filter(connection => {
      const startCard = cards.find(card => card.id === connection.startCardId);
      const endCard = cards.find(card => card.id === connection.endCardId);
      
      if (!startCard || !endCard) return false;
      
      // 计算连接线的中点
      const midX = (startCard.x + startCard.width/2 + endCard.x + endCard.width/2) / 2;
      const midY = (startCard.y + startCard.height/2 + endCard.y + endCard.height/2) / 2;
      
      // 检查中点是否在选区内
      return midX >= left && midX <= right && midY >= top && midY <= bottom;
    }).map(connection => connection.id);
  }, [selectionBox, connections, cards]);

  // 处理鼠标释放事件
  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // 如果在自由连线模式下并且正在绘制线条
    if (freeConnectionMode && drawingLine) {
      e.stopPropagation();
      
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = (e.clientX - rect.left - pan.x) / zoomLevel;
      const y = (e.clientY - rect.top - pan.y) / zoomLevel;
      
      // 查找释放位置是否在某个卡片上
      const targetCard = cards.find(card => {
        return (
          x >= card.x &&
          x <= card.x + card.width &&
          y >= card.y &&
          y <= card.y + card.height
        );
      });
      
      if (onEndDrawing) {
        onEndDrawing(x, y, targetCard?.id || null);
      }
      return;
    }
    
    if (isDragging) {
      setIsDragging(false);
      setIsPanning(false); // 结束平移模式
      document.body.style.cursor = spacePressed ? 'grab' : '';
    }
  }, [isDragging, spacePressed, freeConnectionMode, drawingLine, onEndDrawing, cards, zoomLevel, pan]);

  // 处理双击事件 - 在空白区域双击创建卡片
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    // 确保双击发生在画布空白区域
    if (e.target === e.currentTarget || e.target === contentRef.current) {
      // 计算画布中的实际点击位置
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // 转换屏幕坐标到画布坐标
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
      
      // 这里可以添加在点击位置创建卡片的回调
      // 如果组件有这个属性的话
      // onCreateCardAt && onCreateCardAt(canvasX, canvasY);
    }
  }, [pan, zoomLevel]);

  // 获取当前视口信息
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getViewportInfo = useCallback(() => {
    if (!canvasRef.current) return null;
    
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
      zoom: zoomLevel,
      pan: pan
    };
  }, [zoomLevel, pan]);

  // 修改网格生成函数
  const getGridStyle = useCallback(() => {
    // 使用纯色背景，设置为 rgb(245, 250, 255)
    return {
      backgroundColor: 'rgb(245, 250, 255)',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%'
    };
  }, []);

  // 处理鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // 带有Ctrl按键时进行缩放操作
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      // 获取鼠标在画布上的位置
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 计算鼠标在画布中的实际位置（考虑当前缩放和平移）
      const canvasX = (mouseX - pan.x) / zoomLevel;
      const canvasY = (mouseY - pan.y) / zoomLevel;
      
      // 计算缩放因子
      const delta = -e.deltaY * 0.001 * zoomLevel; // 根据当前缩放级别调整缩放速率
      const newZoom = Math.min(Math.max(zoomLevel + delta, 0.1), 5); // 限制缩放范围
      
      // 计算新的平移值，保持鼠标下的点不变
      const newPanX = mouseX - canvasX * newZoom;
      const newPanY = mouseY - canvasY * newZoom;
      
      // 更新缩放和平移
      if (onZoomChange) onZoomChange(newZoom);
      onPanChange({ x: newPanX, y: newPanY });
    }
    // 使用Shift+滚轮进行水平滚动
    else if (e.shiftKey) {
      e.preventDefault();
      onPanChange({
        x: pan.x - e.deltaY,
        y: pan.y
      });
    }
    // 默认情况下进行垂直滚动
    else {
      e.preventDefault();
      onPanChange({
        x: pan.x - e.deltaX * 0.5,
        y: pan.y - e.deltaY * 0.5
      });
    }
  }, [zoomLevel, pan, onZoomChange, onPanChange]);

  // 监听空格键按下状态
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault(); // 防止页面滚动
        setSpacePressed(true);
        document.body.style.cursor = isDragging ? 'grabbing' : 'grab';
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        document.body.style.cursor = isDragging ? 'grabbing' : '';
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  // 更新cursor逻辑
  const getCursor = useCallback(() => {
    if (freeConnectionMode) {
      return drawingLine ? 'crosshair' : 'cell';
    } else if (isDragging) {
      return 'grabbing';
    } else if (spacePressed) {
      return 'grab';
    }
    return 'default';
  }, [freeConnectionMode, drawingLine, isDragging, spacePressed]);

  // 添加鼠标事件监听
  useEffect(() => {
    // 创建原生DOM事件处理函数，而不是直接传递React事件处理函数
    const mouseMoveHandler = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        onPanChange({
          x: initialPan.x + deltaX,
          y: initialPan.y + deltaY
        });
      }
    };
    
    const mouseUpHandler = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);
    } else {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    }
    
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };
  }, [isDragging, dragStart, initialPan, onPanChange]);

  // 修改选区相关监听器
  useEffect(() => {
    // 创建DOM事件处理函数
    const docMouseMoveHandler = (e: MouseEvent) => {
      if (selectionBox.visible) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = (e.clientX - rect.left - pan.x) / zoomLevel;
        const y = (e.clientY - rect.top - pan.y) / zoomLevel;
        
        setSelectionBox(prev => ({
          ...prev,
          endX: x,
          endY: y
        }));
      }
    };
    
    const docMouseUpHandler = () => {
      if (!selectionBox.visible) return;
      
      // 获取选区内的卡片和连接线
      const selectedCards = getCardsInSelectionBox();
      const selectedConnections = getConnectionsInSelectionBox();
      
      // 如果有选中的卡片，调用onCardsSelect
      if (selectedCards.length > 0) {
        onCardsSelect(selectedCards);
      }
      
      // 如果有选中的连接线，并且没有选中的卡片
      if (selectedConnections.length > 0 && selectedCards.length === 0) {
        // 选择第一条连接线
        onConnectionSelect(selectedConnections[0], false);
      }
      
      // 关闭选区框
      setSelectionBox({
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0,
        visible: false
      });
    };

    if (selectionBox.visible) {
      document.addEventListener('mousemove', docMouseMoveHandler);
      document.addEventListener('mouseup', docMouseUpHandler);
    }
    
    return () => {
      document.removeEventListener('mousemove', docMouseMoveHandler);
      document.removeEventListener('mouseup', docMouseUpHandler);
    };
  }, [selectionBox.visible, zoomLevel, pan, onCardsSelect, getCardsInSelectionBox, getConnectionsInSelectionBox, onConnectionSelect]);
  
  // 修改临时连线渲染函数
  const renderFreeConnectionLine = useCallback(() => {
    if (!drawingLine || !freeConnectionMode) return null;
    
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
        {/* 改用贝塞尔曲线替代直线，使连接看起来更自然 */}
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
        {/* 添加箭头指示方向 */}
        <polygon
          points={`${currentMousePosition.x},${currentMousePosition.y} 
                  ${currentMousePosition.x - 10},${currentMousePosition.y - 5} 
                  ${currentMousePosition.x - 10},${currentMousePosition.y + 5}`}
          fill="#4285f4"
        />
      </svg>
    );
  }, [freeConnectionMode, drawingLine, lineStartPoint, currentMousePosition]);

  // 确保内容不被顶部工具栏遮挡的逻辑
  useEffect(() => {
    // 计算顶部工具栏高度，为内容区域设置适当的偏移
    const headerHeight = 60; // 根据实际工具栏高度调整
    if (canvasRef.current) {
      canvasRef.current.style.paddingTop = `${headerHeight}px`;
    }
  }, []);

  // 计算选区样式
  const getSelectionBoxStyle = () => {
    if (!selectionBox.visible) return {};

    const left = Math.min(selectionBox.startX, selectionBox.endX);
    const top = Math.min(selectionBox.startY, selectionBox.endY);
    const width = Math.abs(selectionBox.endX - selectionBox.startX);
    const height = Math.abs(selectionBox.endY - selectionBox.startY);

    return {
      position: 'absolute' as 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      border: '2px dashed #4285f4',
      backgroundColor: 'rgba(66, 133, 244, 0.1)',
      pointerEvents: 'none' as 'none',
      zIndex: 5
    };
  };

  // 添加监听整个文档的鼠标移动事件
  useEffect(() => {
    const handleDocumentMouseMove = (e: MouseEvent) => {
      if (selectionBox.visible) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
        const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
        
        setSelectionBox(prev => ({
          ...prev,
          endX: canvasX,
          endY: canvasY
        }));
        
        // 实时选择框选区域内的卡片和连接线
        const selectedCardIds = getCardsInSelectionBox();
        const selectedConnIds = getConnectionsInSelectionBox();
        
        // 通知父组件选中的元素
        onCardsSelect(selectedCardIds);
        // 如果有连接线选中回调
        if (onConnectionSelect && selectedConnIds.length > 0) {
          // 每次框选时清除之前的连接线选择状态并设置新的
          selectedConnIds.forEach(connId => {
            onConnectionSelect(connId, true);
          });
        }
      }
    };
    
    const handleDocumentMouseUp = (e: MouseEvent) => {
      if (selectionBox.visible) {
        // 完成选区选择
        const selectedCardIds = getCardsInSelectionBox();
        const selectedConnIds = getConnectionsInSelectionBox();
        if (selectedCardIds.length > 0) {
          onCardsSelect(selectedCardIds);
        }
        if (selectedConnIds.length > 0) {
          selectedConnIds.forEach(connId => {
            onConnectionSelect(connId, true);
          });
        }
        // 重置选区
        setSelectionBox(prev => ({ ...prev, visible: false }));
      }
    };
    
    // 监听整个文档的鼠标事件以处理拖拽选区
    if (selectionBox.visible) {
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleDocumentMouseMove);
      document.removeEventListener('mouseup', handleDocumentMouseUp);
    };
  }, [selectionBox.visible, zoomLevel, pan, onCardsSelect, getCardsInSelectionBox, getConnectionsInSelectionBox, onConnectionSelect]);

  // 处理右键菜单 - 添加自定义上下文菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // 阻止默认的上下文菜单
    
    // 如果需要，这里可以添加自定义右键菜单的逻辑
  }, []);


  // 处理卡片点击
  const handleCardClick = useCallback((cardId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (freeConnectionMode) {
      // 自由连线模式下的处理...
    } else {
      // 正常模式下点击卡片
      const card = cards.find(c => c.id === cardId);
      const cardInfo = card ? `${cardId} (${card.content.substring(0, 15)}${card.content.length > 15 ? '...' : ''})` : cardId;
      
      // 如果有已选中的连接线，先清除连接线的选择
      if (selectedConnectionIds.length > 0) {
        LogUtils.selection('取消选择', '连接线', selectedConnectionIds);
        // 遍历每个已选中的连接线，清除选择状态
        selectedConnectionIds.forEach(id => {
          onConnectionSelect(id, true);
        });
      }
      
      if (event.ctrlKey || event.metaKey) {
        // Ctrl+点击多选
        if (selectedCardIds.includes(cardId)) {
          LogUtils.selection('取消选择', '卡片', cardInfo);
        } else {
          LogUtils.selection('添加选择', '卡片', cardInfo);
        }
      } else {
        if (!selectedCardIds.includes(cardId)) {
          LogUtils.selection('选择', '卡片', cardInfo);
        }
        // 如果已经选中了，不需要重复记录日志
      }
      
      onCardSelect(cardId, event.ctrlKey || event.metaKey);
    }
  }, [freeConnectionMode, cards, selectedCardIds, selectedConnectionIds, onCardSelect, onConnectionSelect]);
  
  // 处理背景点击事件，取消所有选择
  const handleBackgroundClick = useCallback((event: React.MouseEvent) => {
    if (!isDragging && !isPanning && !selectionBox.visible) {
      // 点击背景取消选择
      if (selectedCardIds.length > 0) {
        LogUtils.selection('取消所有选择', '卡片', selectedCardIds);
      }
      if (selectedConnectionIds.length > 0) {
        LogUtils.selection('取消所有选择', '连接线', selectedConnectionIds);
      }
      
      // 清除所有选择
      onCardsSelect([]);
      
      // 清除连接线选择 - 修复这里的逻辑，确保连接线被清除
      if (selectedConnectionIds.length > 0 && onConnectionSelect) {
        // 遍历每个选中的连接线ID，显式取消选择
        selectedConnectionIds.forEach(id => {
          onConnectionSelect(id, true); // 传递true以便使用"取消"逻辑
        });
      }
    }
  }, [isDragging, isPanning, selectionBox.visible, selectedCardIds, selectedConnectionIds, onCardsSelect, onConnectionSelect]);

  // 处理连接线点击
  const handleConnectionClick = useCallback((connectionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const connection = connections.find(conn => conn.id === connectionId);
    const connectionInfo = connection 
      ? `${connectionId} (${connection.startCardId} → ${connection.endCardId})` 
      : connectionId;
      
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+点击多选连接线
      if (selectedConnectionIds.includes(connectionId)) {
        LogUtils.selection('取消选择', '连接线', connectionInfo);
      } else {
        LogUtils.selection('添加选择', '连接线', connectionInfo);
      }
      onConnectionSelect(connectionId, true); // 使用多选模式
    } else {
      // 单选连接线 - 在单选时需要先取消之前的选择
      // 如果有其他已选中的连接线，记录取消它们的选择
      if (selectedConnectionIds.length > 0) {
        const deselectedConnections = selectedConnectionIds.filter(id => id !== connectionId);
        if (deselectedConnections.length > 0) {
          const deselectedInfo = deselectedConnections.map(id => {
            const conn = connections.find(c => c.id === id);
            return conn ? `${id} (${conn.startCardId} → ${conn.endCardId})` : id;
          });
          LogUtils.selection('取消选择', '连接线', deselectedInfo);
        }
      }
      
      // 如果选择了新的连接线，记录选择操作
      if (!selectedConnectionIds.includes(connectionId) || selectedConnectionIds.length > 1) {
        LogUtils.selection('选择', '连接线', connectionInfo);
      }
      
      // 执行单选
      onConnectionSelect(connectionId, false);
    }
  }, [connections, selectedConnectionIds, onConnectionSelect]);

  // 渲染临时连线预览
  const renderTemporaryConnection = useCallback(() => {
    if (!connectionMode || !connectionTargetCardId) return null;
    
    // 使用传入的 connectionStart 而不是在组件内部查找
    const startCard = cards.find(card => card.id === connectionStart);
    const endCard = cards.find(card => card.id === connectionTargetCardId);
    
    if (!startCard || !endCard) return null;
    
    const startX = startCard.x + startCard.width / 2;
    const startY = startCard.y + startCard.height / 2;
    const endX = endCard.x + endCard.width / 2;
    const endY = endCard.y + endCard.height / 2;
    
    // 临时连线使用虚线样式
    return (
      <svg
        className="temporary-connection"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2
        }}
      >
        <path
          d={`M ${startX} ${startY} L ${endX} ${endY}`}
          stroke="#4285f4"
          strokeWidth={2}
          strokeDasharray="5,5"
          fill="none"
        />
      </svg>
    );
  }, [connectionMode, connectionStart, connectionTargetCardId, cards]);

  // 添加一个临时绘制图层
  const renderDrawingLayer = useCallback(() => {
    if (!freeConnectionMode) return null;
    
    return (
      <div
        ref={drawLayerRef}
        className="drawing-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1000,
          cursor: drawingLine ? 'crosshair' : 'cell',
          pointerEvents: 'all'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    );
  }, [freeConnectionMode, drawingLine, handleMouseDown, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className={`canvas-wrapper ${connectionSelectionMode ? 'connection-selection-mode' : ''}`}
      ref={(node) => {
        // 同时保存React ref和内部ref
        if (node) {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          canvasRef.current = node;
        }
      }}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu} // 添加右键菜单处理
      onClick={handleBackgroundClick} // 添加背景点击处理
      style={{ 
        cursor: getCursor(),
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* 无限画布的背景和内容容器 */}
      <div 
        className={`infinite-canvas ${isDragging ? 'dragging' : ''} ${spacePressed ? 'space-pressed' : ''} ${connectionSelectionMode ? 'connection-selection-mode' : ''}`}
        style={{ 
          ...getGridStyle(),
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          transform: `scale(${zoomLevel})`,
          transformOrigin: '0 0',
        }}
      >
        <div 
          ref={contentRef}
          className="canvas-content"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            transform: `translate(${pan.x / zoomLevel}px, ${pan.y / zoomLevel}px)`,
          }}
        >
          {/* 显示选区 */}
          {selectionBox.visible && (
            <div style={getSelectionBoxStyle()} />
          )}
          
          {/* 先渲染连接线，放在卡片下面 */}
          {connections.map(connection => (
            <Connection
              key={connection.id}
              connection={connection}
              cards={cards}
              isSelected={selectedConnectionIds.includes(connection.id)} // 添加选中状态
              isHighlighted={connectionSelectionMode} // 在连接线选择模式下高亮所有连接线
              isEditing={editingConnectionId === connection.id}
              onClick={(e) => { // 添加点击事件
                e.stopPropagation();
                onConnectionSelect(connection.id, isMultiSelectKey(e));
              }}
              onLabelChange={(label) => onConnectionLabelChange && onConnectionLabelChange(connection.id, label)}
              onEditComplete={onConnectionEditComplete}
            />
          ))}
          
          {/* 渲染临时预览连线 */}
          {renderTemporaryConnection()}
          
          {/* 渲染自由连线 */}
          {renderFreeConnectionLine()}
          
          {/* 然后渲染卡片，确保卡片在连接线之上 */}
          {cards.map(card => (
            <Card
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id || selectedCardIds.includes(card.id) || card.id === connectionTargetCardId}
              isTargeted={card.id === connectionTargetCardId}
              isEditing={editingCardId === card.id}
              onClick={(e) => handleCardClick(card.id, e)} 
              onContentChange={(content: string) => onCardContentChange(card.id, content)}
              onEditComplete={onEditComplete}
              onMove={selectedCardIds.includes(card.id) && selectedCardIds.length > 1
                ? (cardId, deltaX, deltaY) => onMultipleCardMove && onMultipleCardMove(selectedCardIds, deltaX, deltaY)
                : onCardMove}
            />
          ))}
        </div>
      </div>
      {/* 添加独立的绘制图层 */}
      {renderDrawingLayer()}
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
