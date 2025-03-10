import React, { useRef, useState, useEffect, useCallback } from 'react';
import '../../styles/MindMap.css';
import { useCards } from '../../hooks/useCards';
import { useConnections } from '../../hooks/useConnections';
import { useKeyBindings } from '../../hooks/useKeyBindings';
import { useHistory } from '../../hooks/useHistory';
import { saveMindMapToStorage, loadMindMapFromStorage } from '../../utils/storageUtils';
import { findNearestCardInDirection } from '../../utils/positionUtils';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import HelpModal from '../Modals/HelpModal';
import KeyBindingModal from '../Modals/KeyBindingModal';
import MindMapKeyboardHandler from './MindMapKeyboardHandler';
import { createCardMovementHandlers, createConnectedCardFunction } from './MindMapActions';
import { ISize, ICard, IConnection } from '../../types';
import { generateHelpText } from '../../utils/helpTextUtils';
import ZoomControls from './ZoomControls';

const MindMap: React.FC = () => {
  const {
    cards,
    selectedCardId,
    selectedCardIds, // 添加多选卡片ID数组
    editingCardId,
    createCard,
    createCardAtPosition,
    updateCardContent,
    deleteCard,
    deleteCards, // 添加批量删除方法
    moveCard,
    moveMultipleCards, // 添加批量移动方法
    setSelectedCardId,
    setEditingCardId,
    setCardsData,
    changeLayoutAlgorithm,
    getLayoutSettings,
    selectCard, // 添加选择卡片方法
    selectCards, // 添加批量选择方法
    clearSelection // 添加清除选择方法
  } = useCards();
  
  const {
    connections,
    connectionMode,
    connectionStart,
    selectedConnectionIds, // 添加选中连接线ID数组
    startConnectionMode,
    completeConnection,
    cancelConnectionMode,
    deleteCardConnections,
    setConnectionsData,
    selectConnection, // 添加选择连接线方法
    selectConnections, // 添加批量选择连接线方法
    clearConnectionSelection, // 添加清除连接线选择方法
    deleteSelectedConnections, // 添加删除选中连接线方法
    copySelectedConnections, // 添加复制选中连接线方法
    deleteConnection // 添加 deleteConnection 引用
  } = useConnections();
  
  const { keyBindings, updateKeyBindings } = useKeyBindings();
  
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showKeyBindings, setShowKeyBindings] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [moveInterval, setMoveInterval] = useState<NodeJS.Timeout | null>(null);
  const [tabPressed, setTabPressed] = useState<boolean>(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [viewportInfo, setViewportInfo] = useState<{
    viewportWidth: number,
    viewportHeight: number,
    zoom: number,
    pan: { x: number, y: number }
  }>({
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    zoom: 1,
    pan: { x: 0, y: 0 }
  });
  
  const restoreState = useCallback((state: { cards: typeof cards, connections: typeof connections, selectedCardId: string | null }) => {
    setCardsData(state.cards);
    setConnectionsData(state.connections);
    setSelectedCardId(state.selectedCardId);
  }, [setCardsData, setConnectionsData, setSelectedCardId]);
  
  const { undo: historyUndo, redo: historyRedo, canUndo, canRedo } = useHistory(
    cards,
    connections,
    selectedCardId,
    restoreState
  );
  
  const [showUndoMessage, setShowUndoMessage] = useState<boolean>(false);
  const [showRedoMessage, setShowRedoMessage] = useState<boolean>(false);
  
  const handleUndo = useCallback(() => {
    if (canUndo) {
      console.log('执行撤销操作');
      historyUndo();
      setShowUndoMessage(true);
      setTimeout(() => setShowUndoMessage(false), 800);
    } else {
      console.log('无法撤销：没有可撤销的操作');
    }
  }, [canUndo, historyUndo]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      console.log('执行重做操作');
      historyRedo();
      setShowRedoMessage(true);
      setTimeout(() => setShowRedoMessage(false), 800);
    } else {
      console.log('无法重做：没有可重做的操作');
    }
  }, [canRedo, historyRedo]);
  
  const { startContinuousMove, stopContinuousMove } = createCardMovementHandlers(
    selectedCardId,
    moveCard,
    (interval: NodeJS.Timeout | null) => {
      if (moveInterval) clearInterval(moveInterval);
      setMoveInterval(interval);
    }
  );
  
  const getMapSize = (): ISize => {
    return {
      width: mapRef.current?.clientWidth || 800,
      height: mapRef.current?.clientHeight || 600
    };
  };
  
  const getCurrentViewportInfo = useCallback(() => {
    return {
      viewportWidth: viewportInfo.viewportWidth,
      viewportHeight: viewportInfo.viewportHeight,
      zoom: zoomLevel,
      pan: pan
    };
  }, [viewportInfo, zoomLevel, pan]);
  
  const handleCreateCard = useCallback(() => {
    createCard(getMapSize(), getCurrentViewportInfo());
  }, [createCard, getMapSize, getCurrentViewportInfo]);
  
  const selectNearestCard = (direction: 'up' | 'down' | 'left' | 'right') => {
    const selectedCard = cards.find(card => card.id === selectedCardId);
    if (!selectedCard) return;
    
    const nearestCard = findNearestCardInDirection(selectedCard, cards, direction);
    if (nearestCard) {
      setSelectedCardId(nearestCard.id);
    }
  };
  
  const selectNextCard = (reverse: boolean = false) => {
    if (cards.length === 0) return;
    
    const currentIndex = selectedCardId 
      ? cards.findIndex(card => card.id === selectedCardId) 
      : -1;
    
    let nextIndex;
    if (reverse) {
      nextIndex = currentIndex <= 0 ? cards.length - 1 : currentIndex - 1;
    } else {
      nextIndex = (currentIndex + 1) % cards.length;
    }
    
    setSelectedCardId(cards[nextIndex].id);
  };
  
  const createConnectedCard = createConnectedCardFunction(
    cards,
    connections,
    selectedCardId,
    createCardAtPosition,
    setConnectionsData
  );
  
  const saveMindMap = () => {
    saveMindMapToStorage({ cards, connections });
    // 移除弹窗通知
  };
  
  const loadMindMap = () => {
    const data = loadMindMapFromStorage();
    if (data) {
      setCardsData(data.cards);
      setConnectionsData(data.connections);
      setSelectedCardId(null);
      // 移除弹窗通知
    }
  };
  
  const handleCardSelect = (cardId: string, isMultiSelect: boolean = false) => {
    if (connectionMode) {
      completeConnection(cardId);
    } else {
      selectCard(cardId, isMultiSelect);
    }
  };
  
  const getHelpText = () => {
    return generateHelpText(keyBindings);
  };
  
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) {
        if (event.shiftKey) {
          console.log('全局监听 - 执行重做操作');
          handleRedo();
        } else {
          console.log('全局监听 - 执行撤销操作');
          handleUndo();
        }
        event.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (moveInterval) clearInterval(moveInterval);
    };
  }, [handleUndo, handleRedo, moveInterval]);
  
  useEffect(() => {
    const handleResize = () => {
      setViewportInfo(prev => ({
        ...prev,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      }));
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  const handleWheel = useCallback((event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      
      const delta = -event.deltaY * 0.01;
      const newZoom = Math.min(Math.max(zoomLevel + delta, 0.1), 5);
      
      setZoomLevel(newZoom);
    }
  }, [zoomLevel]);
  
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;
    
    mapElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      mapElement.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);
  
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimer = useRef<NodeJS.Timeout | null>(null);
  
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
  
  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    showZoomInfo(1);
  }, [showZoomInfo]);
  
  const updateViewportInfo = useCallback(() => {
    setViewportInfo(prev => ({
      ...prev,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      zoom: zoomLevel,
      pan
    }));
  }, [zoomLevel, pan]);
  
  const handleZoomIn = useCallback(() => {
    showZoomInfo(Math.min(zoomLevel + 0.1, 5));
  }, [zoomLevel, showZoomInfo]);
  
  const handleZoomOut = useCallback(() => {
    showZoomInfo(Math.max(zoomLevel - 0.1, 0.1));
  }, [zoomLevel, showZoomInfo]);
  
  useEffect(() => {
    const handleResize = () => {
      updateViewportInfo();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateViewportInfo]);
  
  useEffect(() => {
    updateViewportInfo();
  }, [zoomLevel, pan, updateViewportInfo]);

  const handleCardMove = useCallback((cardId: string, deltaX: number, deltaY: number) => {
    const scaledDeltaX = deltaX / zoomLevel;
    const scaledDeltaY = deltaY / zoomLevel;
    moveCard(cardId, scaledDeltaX, scaledDeltaY);
  }, [moveCard, zoomLevel]);

  const handleMultipleCardMove = useCallback((cardIds: string[], deltaX: number, deltaY: number) => {
    const scaledDeltaX = deltaX / zoomLevel;
    const scaledDeltaY = deltaY / zoomLevel;
    moveMultipleCards(cardIds, scaledDeltaX, scaledDeltaY);
  }, [moveMultipleCards, zoomLevel]);
  
  const handleDeleteSelectedCards = useCallback(() => {
    if (selectedCardIds.length > 0) {
      selectedCardIds.forEach(id => {
        deleteCardConnections(id);
      });
      deleteCards(selectedCardIds);
    } else if (selectedCardId) {
      deleteCardConnections(selectedCardId);
      deleteCard(selectedCardId);
    }
  }, [selectedCardIds, selectedCardId, deleteCards, deleteCard, deleteCardConnections]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && !editingCardId) {
        handleDeleteSelectedCards();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectCards(cards.map(card => card.id));
      }
      
      if (e.key === 'Escape' && !editingCardId && !connectionMode) {
        clearSelection();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cards, editingCardId, connectionMode, handleDeleteSelectedCards, clearSelection, selectCards]);
  
  useEffect(() => {
    const hasSeenTips = localStorage.getItem('mindmap-tips-shown');
    if (!hasSeenTips) {
      setTimeout(() => {
        alert(`欢迎使用无限画布！
        
  - 点击并拖动空白区域移动视图
  - 按住空格键+鼠标左键也可以移动视图
  - 鼠标滚轮或触控板缩放视图
  - 选中卡片后可以直接拖动它
  - 双击卡片开始编辑
        `);
        localStorage.setItem('mindmap-tips-shown', 'true');
      }, 1000);
    }
  }, []);
  
  // 剪贴板状态
  const [clipboard, setClipboard] = useState<{
    cards: ICard[],
    connections: IConnection[]
  }>({ cards: [], connections: [] });
  
  // 复制选中的卡片和连接线
  const handleCopy = useCallback(() => {
    // 复制选中的卡片
    const cardsToCopy = cards.filter(card => selectedCardIds.includes(card.id));
    
    // 复制选中的连接线
    const connectionsToCopy = connections.filter(conn => 
      selectedConnectionIds.includes(conn.id) || 
      (selectedCardIds.includes(conn.startCardId) && selectedCardIds.includes(conn.endCardId))
    );
    
    // 保存到剪贴板
    setClipboard({
      cards: JSON.parse(JSON.stringify(cardsToCopy)), // 深拷贝
      connections: JSON.parse(JSON.stringify(connectionsToCopy)) // 深拷贝
    });
  }, [cards, connections, selectedCardIds, selectedConnectionIds]);
  
  // 剪切选中的卡片和连接线
  const handleCut = useCallback(() => {
    // 先复制
    const cardsToCopy = cards.filter(card => selectedCardIds.includes(card.id));
    const connectionsToCopy = connections.filter(conn => 
      selectedConnectionIds.includes(conn.id) || 
      (selectedCardIds.includes(conn.startCardId) && selectedCardIds.includes(conn.endCardId))
    );
    
    // 保存到剪贴板
    setClipboard({
      cards: JSON.parse(JSON.stringify(cardsToCopy)),
      connections: JSON.parse(JSON.stringify(connectionsToCopy))
    });
    
    // 删除选中的卡片
    if (selectedCardIds.length > 0) {
      deleteCards(selectedCardIds);
    }
    
    // 删除选中的连接线
    if (selectedConnectionIds.length > 0) {
      deleteSelectedConnections();
    }
    
    // 清除选择
    clearSelection();
    clearConnectionSelection();
  }, [cards, connections, selectedCardIds, selectedConnectionIds, deleteCards, deleteSelectedConnections, clearSelection, clearConnectionSelection]);
  
  // 跟踪鼠标位置
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 转换为画布坐标
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        // 获取鼠标在画布中的相对位置
        const canvasX = (e.clientX - rect.left - pan.x) / zoomLevel;
        const canvasY = (e.clientY - rect.top - pan.y) / zoomLevel;
        setMousePosition({ x: canvasX, y: canvasY });
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [pan, zoomLevel]);
  
  // 粘贴卡片和连接线到鼠标位置
  const handlePaste = useCallback(() => {
    if (clipboard.cards.length === 0 && clipboard.connections.length === 0) {
      return;
    }
    
    // 生成新ID的映射
    const idMap: Record<string, string> = {};
    
    // 计算卡片的中心位置
    const centerX = clipboard.cards.reduce((sum, card) => sum + card.x + card.width/2, 0) / Math.max(1, clipboard.cards.length);
    const centerY = clipboard.cards.reduce((sum, card) => sum + card.y + card.height/2, 0) / Math.max(1, clipboard.cards.length);
    
    // 计算偏移量使卡片组中心对准鼠标位置
    const offsetX = mousePosition.x - centerX;
    const offsetY = mousePosition.y - centerY;
    
    // 粘贴卡片，生成新ID并偏移位置
    const newCards = clipboard.cards.map(card => {
      const newId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      idMap[card.id] = newId;
      
      return {
        ...card,
        id: newId,
        x: card.x + offsetX, // 将卡片偏移到鼠标位置
        y: card.y + offsetY
      };
    });
    
    // 粘贴连接线，更新引用的卡片ID
    const newConnections = clipboard.connections.map(conn => {
      const newId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 只有当连接的两端卡片都在新粘贴的卡片中时才创建新连接
      if (idMap[conn.startCardId] && idMap[conn.endCardId]) {
        return {
          ...conn,
          id: newId,
          startCardId: idMap[conn.startCardId],
          endCardId: idMap[conn.endCardId]
        };
      }
      return null;
    }).filter(conn => conn !== null) as IConnection[];
    
    // 更新状态
    setCardsData([...cards, ...newCards]);
    setConnectionsData([...connections, ...newConnections]);
    
    // 选择新粘贴的卡片
    selectCards(newCards.map(card => card.id));
  }, [clipboard, cards, connections, setCardsData, setConnectionsData, selectCards, mousePosition]);
  
  // 删除选中的单个元素而不是所有
  const handleDelete = useCallback(() => {
    // 如果只选中了一个卡片，只删除它
    if (selectedCardIds.length === 1) {
      const cardId = selectedCardIds[0];
      deleteCardConnections(cardId);
      deleteCard(cardId);
      clearSelection();
    }
    // 如果只选中了一个连接线，只删除它
    else if (selectedConnectionIds.length === 1) {
      const connectionId = selectedConnectionIds[0];
      deleteConnection(connectionId); // 使用 deleteConnection 函数
      clearConnectionSelection();
    }
    // 如果同时选中了多个元素，优先删除卡片
    else if (selectedCardIds.length > 0) {
      const cardId = selectedCardIds[0];
      deleteCardConnections(cardId);
      deleteCard(cardId);
      selectCards(selectedCardIds.filter(id => id !== cardId));
    }
    else if (selectedConnectionIds.length > 0) {
      const connectionId = selectedConnectionIds[0];
      deleteConnection(connectionId); // 使用 deleteConnection 函数
      selectConnections(selectedConnectionIds.filter(id => id !== connectionId));
    }
  }, [selectedCardIds, selectedConnectionIds, deleteCard, deleteCardConnections, deleteConnection, clearSelection, clearConnectionSelection, selectCards, selectConnections]);

  // 添加键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在编辑，不处理快捷键
      if (editingCardId) return;
      
      // 复制: Ctrl+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }
      
      // 剪切: Ctrl+X
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        handleCut();
      }
      
      // 粘贴: Ctrl+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }
      
      // 删除: Delete
      if (e.key === 'Delete') {
        e.preventDefault();
        handleDelete();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingCardId, handleCopy, handleCut, handlePaste, handleDelete]);
  
  return (
    <div className="mind-map-container">
      <MindMapKeyboardHandler
        cards={cards}
        selectedCardId={selectedCardId}
        editingCardId={editingCardId}
        connectionMode={connectionMode}
        keyBindings={keyBindings}
        tabPressed={tabPressed}
        showHelp={showHelp}
        showKeyBindings={showKeyBindings}
        setTabPressed={setTabPressed}
        setShowHelp={setShowHelp}
        setShowKeyBindings={setShowKeyBindings}
        setEditingCardId={setEditingCardId}
        setSelectedCardId={setSelectedCardId}
        moveCard={moveCard}
        startConnectionMode={startConnectionMode}
        cancelConnectionMode={cancelConnectionMode}
        completeConnection={completeConnection}
        deleteCard={deleteCard}
        deleteCardConnections={deleteCardConnections}
        selectNextCard={selectNextCard}
        selectNearestCard={selectNearestCard}
        createConnectedCard={createConnectedCard}
        createCard={createCard}
        setZoomLevel={setZoomLevel}
        setPan={setPan}
        saveMindMap={saveMindMap}
        loadMindMap={loadMindMap}
        undo={handleUndo}
        redo={handleRedo}
        getMapSize={getMapSize}
        startContinuousMove={startContinuousMove}
        stopContinuousMove={stopContinuousMove}
      />
      
      <div className="fixed-header">
        <Toolbar
          onCreateCard={handleCreateCard}
          onSave={saveMindMap}
          onLoad={loadMindMap}
          onShowHelp={() => setShowHelp(true)}
          onShowKeyBindings={() => setShowKeyBindings(true)}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          onDelete={handleDelete}
          keyBindings={keyBindings}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          currentLayout={getLayoutSettings()}
          onLayoutChange={changeLayoutAlgorithm}
          hasSelection={selectedCardIds.length > 0 || selectedConnectionIds.length > 0}
        />
      </div>
      
      <Canvas
        ref={mapRef}
        cards={cards}
        connections={connections}
        selectedCardId={selectedCardId}
        selectedCardIds={selectedCardIds} // 传递多选数组
        selectedConnectionIds={selectedConnectionIds} // 传递选中的连接线ID数组
        editingCardId={editingCardId}
        connectionMode={connectionMode}
        zoomLevel={zoomLevel}
        pan={pan}
        onCardSelect={handleCardSelect}
        onConnectionSelect={selectConnection} // 添加连接线选择回调
        onCardsSelect={selectCards} // 传递批量选择回调
        onCardContentChange={updateCardContent}
        onEditComplete={() => setEditingCardId(null)}
        onPanChange={setPan}
        onZoomChange={showZoomInfo}
        onCardMove={handleCardMove}
        onMultipleCardMove={handleMultipleCardMove} // 传递批量移动回调
      />
      
      <ZoomControls
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={resetView}
      />
      
      {showHelp && (
        <HelpModal
          helpItems={getHelpText()}
          onClose={() => setShowHelp(false)}
        />
      )}
      
      {showKeyBindings && (
        <KeyBindingModal
          keyBindings={keyBindings}
          onSave={updateKeyBindings}
          onClose={() => setShowKeyBindings(false)}
        />
      )}
      
      {connectionMode && (
        <div className="connection-mode-indicator">
          连线模式: 请选择目标卡片，ESC取消
        </div>
      )}
      
      {showUndoMessage && (
        <div className="action-feedback undo">
          已撤销操作
        </div>
      )}
      
      {showRedoMessage && (
        <div className="action-feedback redo">
          已重做操作
        </div>
      )}
      
      {selectedCardIds.length > 1 && (
        <div className="action-feedback selection">
          已选择 {selectedCardIds.length} 张卡片
        </div>
      )}
      
      {(selectedCardIds.length > 0 || selectedConnectionIds.length > 0) && (
        <div className="action-feedback selection">
          已选择 {selectedCardIds.length} 张卡片和 {selectedConnectionIds.length} 条连接线
        </div>
      )}
    </div>
  );
};

export default MindMap;