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
import { ISize } from '../../types';
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
    startConnectionMode,
    completeConnection,
    cancelConnectionMode,
    deleteCardConnections,
    setConnectionsData
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
    alert('思维导图已保存');
  };
  
  const loadMindMap = () => {
    const data = loadMindMapFromStorage();
    if (data) {
      setCardsData(data.cards);
      setConnectionsData(data.connections);
      setSelectedCardId(null);
      alert('思维导图已加载');
    } else {
      alert('未找到已保存的思维导图');
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
          keyBindings={keyBindings}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          currentLayout={getLayoutSettings()}
          onLayoutChange={changeLayoutAlgorithm}
        />
      </div>
      
      <Canvas
        ref={mapRef}
        cards={cards}
        connections={connections}
        selectedCardId={selectedCardId}
        selectedCardIds={selectedCardIds} // 传递多选数组
        editingCardId={editingCardId}
        connectionMode={connectionMode}
        zoomLevel={zoomLevel}
        pan={pan}
        onCardSelect={handleCardSelect}
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
    </div>
  );
};

export default MindMap;