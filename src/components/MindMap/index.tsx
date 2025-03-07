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
    setCardsData
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
  
  // 为历史记录Hook提供恢复状态的回调
  const restoreState = useCallback((state: { cards: typeof cards, connections: typeof connections, selectedCardId: string | null }) => {
    setCardsData(state.cards);
    setConnectionsData(state.connections);
    setSelectedCardId(state.selectedCardId);
  }, [setCardsData, setConnectionsData, setSelectedCardId]);
  
  // 使用历史记录Hook
  const { undo, redo, canUndo, canRedo } = useHistory(
    cards,
    connections,
    selectedCardId,
    restoreState
  );
  
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
    return [
      { key: `Ctrl+${keyBindings.newCard.toUpperCase()}`, desc: '创建新卡片' },
      { key: keyBindings.editCard, desc: '编辑选中的卡片' },
      // ...existing code...
    ];
  };
  
  // 清理副作用
  useEffect(() => {
    return () => {
      if (moveInterval) clearInterval(moveInterval);
    };
  }, [moveInterval]);
  
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
        undo={undo}
        redo={redo}
        getMapSize={getMapSize}
        startContinuousMove={startContinuousMove}
        stopContinuousMove={stopContinuousMove}
      />
      
      <Toolbar
        onCreateCard={() => createCard(getMapSize())}
        onSave={saveMindMap}
        onLoad={loadMindMap}
        onShowHelp={() => setShowHelp(true)}
        onShowKeyBindings={() => setShowKeyBindings(true)}
        zoomLevel={zoomLevel}
        onZoomIn={() => setZoomLevel(prev => Math.min(prev + 0.1, 2))}
        onZoomOut={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.5))}
        keyBindings={keyBindings}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      
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
    </div>
  );
};

export default MindMap;