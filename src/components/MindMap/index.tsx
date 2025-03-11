import React, { useEffect } from 'react';
import '../../styles/MindMap.css';
import { useMindMapCore } from '../../hooks/useMindMapCore';
import { useCardDragging } from '../../hooks/useCardDragging';
import { saveMindMapToStorage, loadMindMapFromStorage } from '../../utils/storageUtils';
import MindMapKeyboardHandler from './MindMapKeyboardHandler';
import MindMapHeader from './MindMapHeader';
import MindMapContent from './MindMapContent';
import { createCardMovementHandlers, createConnectedCardFunction } from './MindMapActions';
import MindMapFeedback from './MindMapFeedback';
// 从utils导入辅助函数，将这个导入从文件底部移到顶部
import { findNearestCardInDirection } from '../../utils/positionUtils';

const MindMap: React.FC = () => {
  // 使用核心钩子
  const core = useMindMapCore();
  
  const { cards, connections, keyBindings, clipboard, selection } = core;
  
  // 卡片拖动处理
  const dragging = useCardDragging(core.zoomLevel, cards.moveCard, cards.moveMultipleCards);
  
  // 连续移动卡片的处理函数
  const { startContinuousMove, stopContinuousMove } = createCardMovementHandlers(
    cards.selectedCardId,
    cards.moveCard,
    (interval: NodeJS.Timeout | null) => {
      if (core.moveInterval) clearInterval(core.moveInterval);
      core.setMoveInterval(interval);
    }
  );
  
  // 创建连接卡片的函数
  const createConnectedCard = createConnectedCardFunction(
    cards.cards,
    connections.connections,
    cards.selectedCardId,
    cards.createCardAtPosition,
    connections.setConnectionsData
  );
  
  // 保存思维导图
  const saveMindMap = () => {
    saveMindMapToStorage({ cards: cards.cards, connections: connections.connections });
  };
  
  // 加载思维导图
  const loadMindMap = () => {
    const data = loadMindMapFromStorage();
    if (data) {
      cards.setCardsData(data.cards);
      connections.setConnectionsData(data.connections);
      cards.setSelectedCardId(null);
    }
  };
  
  // 卡片选择处理
  const handleCardSelect = (cardId: string, isMultiSelect: boolean = false) => {
    if (connections.connectionMode) {
      connections.completeConnection(cardId);
    } else {
      cards.selectCard(cardId, isMultiSelect);
    }
  };
  
  // 全局按键监听
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) {
        if (event.shiftKey) {
          core.handleRedo();
        } else {
          core.handleUndo();
        }
        event.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      if (core.moveInterval) clearInterval(core.moveInterval);
    };
  }, [core]);
  
  // 窗口大小改变监听
  useEffect(() => {
    const handleResize = () => core.updateViewportInfo();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [core.updateViewportInfo]);
  
  // 缩放监听
  useEffect(() => {
    core.updateViewportInfo();
  }, [core.zoomLevel, core.pan, core.updateViewportInfo]);
  
  // 显示欢迎提示
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
  
  // 创建新卡片
  const handleCreateCard = () => {
    cards.createCard(core.getMapSize(), core.viewportInfo);
  };
  
  // 卡片键盘导航
  const selectNearestCard = (direction: 'up' | 'down' | 'left' | 'right') => {
    const selectedCard = cards.cards.find(card => card.id === cards.selectedCardId);
    if (!selectedCard) return;
    
    const nearestCard = findNearestCardInDirection(selectedCard, cards.cards, direction);
    if (nearestCard) {
      cards.setSelectedCardId(nearestCard.id);
    }
  };
  
  const selectNextCard = (reverse: boolean = false) => {
    if (cards.cards.length === 0) return;
    
    const currentIndex = cards.selectedCardId 
      ? cards.cards.findIndex(card => card.id === cards.selectedCardId) 
      : -1;
    
    let nextIndex;
    if (reverse) {
      nextIndex = currentIndex <= 0 ? cards.cards.length - 1 : currentIndex - 1;
    } else {
      nextIndex = (currentIndex + 1) % cards.cards.length;
    }
    
    cards.setSelectedCardId(cards.cards[nextIndex].id);
  };
  
  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在编辑，不处理快捷键
      if (cards.editingCardId) return;
      
      // 复制: Ctrl+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        clipboard.handleCopy();
      }
      
      // 剪切: Ctrl+X
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        clipboard.handleCut();
      }
      
      // 粘贴: Ctrl+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        core.handlePaste();
      }
      
      // 删除: Delete
      if (e.key === 'Delete') {
        e.preventDefault();
        selection.handleDelete();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [cards.editingCardId, clipboard, core.handlePaste, selection]);
  
  return (
    <div className="mind-map-container">
      <MindMapKeyboardHandler
        cards={cards.cards}
        selectedCardId={cards.selectedCardId}
        editingCardId={cards.editingCardId}
        connectionMode={connections.connectionMode}
        keyBindings={keyBindings}
        tabPressed={core.tabPressed}
        showHelp={core.showHelp}
        showKeyBindings={core.showKeyBindings}
        setTabPressed={core.setTabPressed}
        setShowHelp={core.setShowHelp}
        setShowKeyBindings={core.setShowKeyBindings}
        setEditingCardId={cards.setEditingCardId}
        setSelectedCardId={cards.setSelectedCardId}
        moveCard={cards.moveCard}
        startConnectionMode={connections.startConnectionMode}
        cancelConnectionMode={connections.cancelConnectionMode}
        completeConnection={connections.completeConnection}
        deleteCard={cards.deleteCard}
        deleteCardConnections={connections.deleteCardConnections}
        selectNextCard={selectNextCard}
        selectNearestCard={selectNearestCard}
        createConnectedCard={createConnectedCard}
        createCard={cards.createCard}
        setZoomLevel={core.setZoomLevel}
        setPan={core.setPan}
        saveMindMap={saveMindMap}
        loadMindMap={loadMindMap}
        undo={core.handleUndo}
        redo={core.handleRedo}
        getMapSize={core.getMapSize}
        startContinuousMove={startContinuousMove}
        stopContinuousMove={stopContinuousMove}
      />
      
      <MindMapHeader
        onCreateCard={handleCreateCard}
        onSave={saveMindMap}
        onLoad={loadMindMap}
        onShowHelp={() => core.setShowHelp(true)}
        onShowKeyBindings={() => core.setShowKeyBindings(true)}
        onCopy={clipboard.handleCopy}
        onCut={clipboard.handleCut}
        onPaste={core.handlePaste}
        onDelete={selection.handleDelete}
        keyBindings={keyBindings}
        canUndo={core.history.canUndo}
        canRedo={core.history.canRedo}
        onUndo={core.handleUndo}
        onRedo={core.handleRedo}
        currentLayout={cards.getLayoutSettings()}
        onLayoutChange={cards.changeLayoutAlgorithm}
        hasSelection={cards.selectedCardIds.length > 0 || connections.selectedConnectionIds.length > 0}
      />
      
      <MindMapContent
        mapRef={core.mapRef}
        cards={cards.cards}
        connections={connections.connections}
        selectedCardId={cards.selectedCardId}
        selectedCardIds={cards.selectedCardIds}
        selectedConnectionIds={connections.selectedConnectionIds}
        editingCardId={cards.editingCardId}
        connectionMode={connections.connectionMode}
        zoomLevel={core.zoomLevel}
        pan={core.pan}
        showHelp={core.showHelp}
        showKeyBindings={core.showKeyBindings}
        showUndoMessage={core.showUndoMessage}
        showRedoMessage={core.showRedoMessage}
        keyBindings={keyBindings}
        onCardSelect={handleCardSelect}
        onConnectionSelect={connections.selectConnection}
        onCardsSelect={cards.selectCards}
        onCardContentChange={cards.updateCardContent}
        onEditComplete={() => cards.setEditingCardId(null)}
        onPanChange={core.setPan}
        onZoomChange={core.showZoomInfo}
        onCardMove={dragging.handleCardMove}
        onMultipleCardMove={dragging.handleMultipleCardMove}
        onZoomIn={core.handleZoomIn}
        onZoomOut={core.handleZoomOut}
        onResetView={core.resetView}
        onCloseHelp={() => core.setShowHelp(false)}
        onCloseKeyBindings={() => core.setShowKeyBindings(false)}
        onSaveKeyBindings={core.updateKeyBindings}
      />
      
      <MindMapFeedback
        connectionMode={connections.connectionMode}
        showUndoMessage={core.showUndoMessage}
        showRedoMessage={core.showRedoMessage}
      />
    </div>
  );
};

export default MindMap;