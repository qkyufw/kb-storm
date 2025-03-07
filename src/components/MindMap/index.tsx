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
  // 使用自定义Hook管理状态
  const {
    cards,
    selectedCardId,
    editingCardId,
    createCard,
    createCardAtPosition,
    updateCardContent,
    deleteCard,
    moveCard,
    setSelectedCardId,
    setEditingCardId,
    setCardsData,
    changeLayoutAlgorithm,
    getLayoutSettings
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
  
  // UI相关状态
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showKeyBindings, setShowKeyBindings] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [moveInterval, setMoveInterval] = useState<NodeJS.Timeout | null>(null);
  const [tabPressed, setTabPressed] = useState<boolean>(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  
  // 新增视口信息跟踪
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
  
  // 为历史记录Hook提供恢复状态的回调
  const restoreState = useCallback((state: { cards: typeof cards, connections: typeof connections, selectedCardId: string | null }) => {
    setCardsData(state.cards);
    setConnectionsData(state.connections);
    setSelectedCardId(state.selectedCardId);
  }, [setCardsData, setConnectionsData, setSelectedCardId]);
  
  // 使用历史记录Hook
  const { undo: historyUndo, redo: historyRedo, canUndo, canRedo } = useHistory(
    cards,
    connections,
    selectedCardId,
    restoreState
  );
  
  // 添加撤销/重做状态变化的反馈
  const [showUndoMessage, setShowUndoMessage] = useState<boolean>(false);
  const [showRedoMessage, setShowRedoMessage] = useState<boolean>(false);
  
  // 增强撤销/重做功能，添加视觉反馈
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
  
  // 创建卡片移动处理函数
  const { startContinuousMove, stopContinuousMove } = createCardMovementHandlers(
    selectedCardId,
    moveCard,
    (interval: NodeJS.Timeout | null) => {
      if (moveInterval) clearInterval(moveInterval);
      setMoveInterval(interval);
    }
  );
  
  // 获取地图大小
  const getMapSize = (): ISize => {
    return {
      width: mapRef.current?.clientWidth || 800,
      height: mapRef.current?.clientHeight || 600
    };
  };
  
  // 获取当前视口信息
  const getCurrentViewportInfo = useCallback(() => {
    return {
      viewportWidth: viewportInfo.viewportWidth,
      viewportHeight: viewportInfo.viewportHeight,
      zoom: zoomLevel,
      pan: pan
    };
  }, [viewportInfo, zoomLevel, pan]);
  
  // 修改创建卡片函数，传递视口信息
  const handleCreateCard = useCallback(() => {
    createCard(getMapSize(), getCurrentViewportInfo());
  }, [createCard, getMapSize, getCurrentViewportInfo]);
  
  // 按方位选择最近的卡片
  const selectNearestCard = (direction: 'up' | 'down' | 'left' | 'right') => {
    const selectedCard = cards.find(card => card.id === selectedCardId);
    if (!selectedCard) return;
    
    const nearestCard = findNearestCardInDirection(selectedCard, cards, direction);
    if (nearestCard) {
      setSelectedCardId(nearestCard.id);
    }
  };
  
  // 选择下一个卡片
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
  
  // 创建连接卡片的函数
  const createConnectedCard = createConnectedCardFunction(
    cards,
    connections,
    selectedCardId,
    createCardAtPosition,
    setConnectionsData
  );
  
  // 保存思维导图
  const saveMindMap = () => {
    saveMindMapToStorage({ cards, connections });
    alert('思维导图已保存');
  };
  
  // 加载思维导图
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
  
  // 卡片选择处理
  const handleCardSelect = (cardId: string) => {
    if (connectionMode) {
      completeConnection(cardId);
    } else {
      setSelectedCardId(cardId);
    }
  };
  
  // 帮助信息生成函数
  const getHelpText = () => {
    return generateHelpText(keyBindings);
  };
  
  // 清理副作用
  useEffect(() => {
    // 添加全局键盘监听作为回退方案
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
  
  // 监听窗口大小变化，更新视口信息
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
  
  // 鼠标滚轮缩放处理
  const handleWheel = useCallback((event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      
      // 计算缩放因子
      const delta = -event.deltaY * 0.01;
      const newZoom = Math.min(Math.max(zoomLevel + delta, 0.1), 5); // 允许0.1到5倍缩放
      
      // 更新缩放级别
      setZoomLevel(newZoom);
    }
  }, [zoomLevel]);
  
  // 添加鼠标滚轮事件监听
  useEffect(() => {
    const mapElement = mapRef.current;
    if (!mapElement) return;
    
    mapElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      mapElement.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);
  
  // 缩放显示状态
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomIndicatorTimer = useRef<NodeJS.Timeout | null>(null);
  
  // 显示缩放指示器
  const showZoomInfo = useCallback((newZoom: number) => {
    setZoomLevel(newZoom);
    setShowZoomIndicator(true);
    
    // 清除之前的计时器
    if (zoomIndicatorTimer.current) {
      clearTimeout(zoomIndicatorTimer.current);
    }
    
    // 1秒后隐藏指示器
    zoomIndicatorTimer.current = setTimeout(() => {
      setShowZoomIndicator(false);
      zoomIndicatorTimer.current = null;
    }, 1000);
  }, []);
  
  // 重置视图
  const resetView = useCallback(() => {
    setPan({ x: 0, y: 0 });
    showZoomInfo(1);
  }, [showZoomInfo]);
  
  // 更新视口尺寸信息
  const updateViewportInfo = useCallback(() => {
    setViewportInfo(prev => ({
      ...prev,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      zoom: zoomLevel,
      pan
    }));
  }, [zoomLevel, pan]);
  
  // 强化的缩放控制
  const handleZoomIn = useCallback(() => {
    showZoomInfo(Math.min(zoomLevel + 0.1, 5));
  }, [zoomLevel, showZoomInfo]);
  
  const handleZoomOut = useCallback(() => {
    showZoomInfo(Math.max(zoomLevel - 0.1, 0.1));
  }, [zoomLevel, showZoomInfo]);
  
  // 监听窗口大小变化，更新视口信息
  useEffect(() => {
    const handleResize = () => {
      updateViewportInfo();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateViewportInfo]);
  
  // 监听Canvas视口变化
  useEffect(() => {
    // 当缩放或平移变化时更新视口信息
    updateViewportInfo();
  }, [zoomLevel, pan, updateViewportInfo]);

  // 在现有代码中添加卡片拖动处理函数
  const handleCardMove = useCallback((cardId: string, deltaX: number, deltaY: number) => {
    // 将屏幕坐标中的移动转换为画布坐标中的移动
    const scaledDeltaX = deltaX / zoomLevel;
    const scaledDeltaY = deltaY / zoomLevel;
    moveCard(cardId, scaledDeltaX, scaledDeltaY);
  }, [moveCard, zoomLevel]);

  // 添加用户首次操作时的提示信息
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
      {/* 添加键盘处理器组件 */}
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
        editingCardId={editingCardId}
        connectionMode={connectionMode}
        zoomLevel={zoomLevel}
        pan={pan}
        onCardSelect={handleCardSelect}
        onCardContentChange={updateCardContent}
        onEditComplete={() => setEditingCardId(null)}
        onPanChange={setPan}
        onZoomChange={showZoomInfo} // 传递缩放回调
        onCardMove={handleCardMove}  // 添加拖动回调
      />
      
      {/* 添加独立的缩放控件 - 保留这一个 */}
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
      
      {/* 添加撤销/重做操作的视觉反馈 */}
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
      
      {/* 删除多余的缩放指示器 */}
    </div>
  );
};

export default MindMap;