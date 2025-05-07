import React, { useEffect, useState, useCallback } from 'react';
import './styles/MindMap.css';
import { useMindMapCore } from './hooks/core/useMindMapCore';
import { useCardDragging } from './hooks/core/useCards';
import MindMapKeyboardHandler from './handlers/MindMapKeyboardHandler';
import MindMapContextKeyboardHandler from './handlers/MindMapContextKeyboardHandler';
import Canvas from './components/Content/Canvas';
import { createCardMovementHandlers, createConnectedCardFunction } from './handlers/cardInteractionHandlers';
import MindMapHeader from './components/Header/MindMapHeader';
import { findNearestCardInDirection } from './utils/cardPositioning';
import { 
  MermaidImportModal, 
  MermaidExportModal, 
  MarkdownExportModal, 
  MarkdownImportModal 
} from './components/Modals/ModalComponents';
import Toast from './components/feedback/Toast';
import { IConnection } from './types/CoreTypes';
import { useMindMapKeyboard } from './hooks/interaction/useBasicKeyboardOperations';
import { useMindMapExport } from './hooks/io/useMapExportImport';
import { useFreeConnection } from './hooks/interaction/useDrawableConnection';
import { MindMapProvider } from './context/MindMapContext';

function App() {
  // 使用核心钩子
  const core = useMindMapCore();
  
  const { cards, connections, keyBindings, clipboard, history } = core;
  
  // 空格键状态跟踪
  const [spacePressed, setSpacePressed] = useState(false);
  
  // 提示消息状态
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // 使用导入导出钩子
  const exportImport = useMindMapExport({
    cards: cards.cards,
    connections: connections.connections,
    mapRef: core.mapRef as React.RefObject<HTMLDivElement>,
    addHistory: history.addToHistory,
    setCardsData: cards.setCardsData,
    setConnectionsData: connections.setConnectionsData,
    setSelectedCardId: cards.setSelectedCardId,
    currentLayout: cards.getLayoutSettings()
  });
  
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
  
  // 卡片选择处理
  const handleCardSelect = (cardId: string, isMultiSelect: boolean = false) => {
    if (connections.connectionMode) {
      connections.completeConnection(cardId);
    } else {
      // 在选择卡片时清除已选中的连接线
      if (connections.selectedConnectionIds.length > 0) {
        connections.clearConnectionSelection();
      }
      
      // 然后选择卡片
      cards.selectCard(cardId, isMultiSelect);
    }
  };
  
  // 使用键盘快捷键钩子
  useMindMapKeyboard({
    editingCardId: cards.editingCardId,
    handleCopy: clipboard.handleCopy,
    handleCut: clipboard.handleCut,
    handlePaste: core.handlePaste,
    handleDelete: core.handleDelete,
    handleUndo: core.handleUndo,
    handleRedo: core.handleRedo,
    keyBindings
  });
  
  // 窗口大小改变监听
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(() => {
        core.updateViewportInfo();
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [core]);
  
  // 缩放监听
  useEffect(() => {
    requestAnimationFrame(() => {
      core.updateViewportInfo();
    });
  }, [core.zoomLevel, core.pan, core]);
  
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
  
  // 使用自由连线钩子
  const freeConnection = useFreeConnection({
    cards: cards.cards,
    onCreateConnection: (startCardId, endCardId) => {
      if (startCardId && endCardId && startCardId !== endCardId) {
        // 创建新的连接
        const newConnection: IConnection = {
          id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          startCardId,
          endCardId,
          label: ''
        };
        
        connections.setConnectionsData([...connections.connections, newConnection]);
        history.addToHistory();
        
        // 显示成功提示
        setToastMessage('连线成功');
      } else {
        // 显示不同的错误提示信息
        if (!startCardId && !endCardId) {
          setToastMessage('连接失败：起点和终点都必须在卡片上');
        } else if (!startCardId) {
          setToastMessage('连接失败：起点必须在卡片上');
        } else if (!endCardId) {
          setToastMessage('连接失败：终点必须在卡片上');
        } else if (startCardId === endCardId) {
          setToastMessage('连接失败：不能连接到同一张卡片');
        }
      }
    }
  });

  // 使用Hook中的状态和方法
  const {
    freeConnectionMode,
    drawingLine,
    lineStartPoint,
    currentMousePosition,
    toggleFreeConnectionMode,
    startDrawing,
    drawingMove,
    endDrawing,
  } = freeConnection;

  // 进入自由连线模式的方法
  const handleEnterFreeConnectionMode = useCallback(() => {
    toggleFreeConnectionMode();
    setToastMessage('自由连线模式：绘制一条连接线，起点和终点必须在不同的卡片上');
  }, [toggleFreeConnectionMode]);

  // 退出自由连线模式的方法
  const handleExitFreeConnectionMode = useCallback(() => {
    toggleFreeConnectionMode();
  }, [toggleFreeConnectionMode]);

  return (
    <MindMapProvider>
      <div className="app-container">
        {/* 键盘处理器 */}
        <MindMapContextKeyboardHandler />
        <MindMapKeyboardHandler
          cards={cards.cards}
          selectedCardId={cards.selectedCardId}
          editingCardId={cards.editingCardId}
          connectionMode={connections.connectionMode}
          connectionStart={connections.connectionStart}
          keyBindings={keyBindings}
          tabPressed={core.tabPressed}
          spacePressed={spacePressed}
          showKeyBindings={core.showKeyBindings}
          setTabPressed={core.setTabPressed}
          setSpacePressed={setSpacePressed}
          setShowKeyBindings={core.setShowKeyBindings}
          setEditingCardId={cards.setEditingCardId}
          setSelectedCardId={cards.setSelectedCardId}
          moveCard={cards.moveCard}
          startConnectionMode={connections.startConnectionMode}
          cancelConnectionMode={connections.cancelConnectionMode}
          completeConnection={connections.completeConnection}
          deleteCards={(cardId: string) => cards.deleteCards([cardId])}
          handleConnectionsDelete={connections.handleConnectionsDelete}
          selectNextCard={cards.selectNextCard}
          selectNearestCard={selectNearestCard}
          createConnectedCard={createConnectedCard}
          createCard={cards.createCard}
          setZoomLevel={core.setZoomLevel}
          setPan={core.setPan}
          undo={core.handleUndo}
          redo={core.handleRedo}
          getMapSize={core.getMapSize}
          startContinuousMove={startContinuousMove}
          stopContinuousMove={stopContinuousMove}
          selectedConnectionIds={connections.selectedConnectionIds}
          connections={connections.connections}
          selectConnection={connections.selectConnection}
          selectNextConnection={connections.selectNextConnection}
          selectCards={cards.selectCards}
          updateConnectionLabel={connections.updateConnectionLabel}
          setEditingConnectionId={connections.setEditingConnectionId}
          editingConnectionId={connections.editingConnectionId}
          findNearestCardInDirection={(currentCardId, direction) => {
            const currentCard = cards.cards.find(card => card.id === currentCardId);
            if (!currentCard) return null;
            
            const possibleTargets = cards.cards.filter(card => 
              card.id !== connections.connectionStart
            );
            
            const nearestCard = findNearestCardInDirection(
              currentCard,
              possibleTargets,
              direction
            );
            return nearestCard?.id || null;
          }}
          setConnectionTargetCardId={connections.setConnectionTargetCardId}
          connectionTargetCardId={connections.connectionTargetCardId}
          freeConnectionMode={freeConnectionMode}
          setFreeConnectionMode={toggleFreeConnectionMode}
        />
        
        {/* 工具栏 - 直接作为 App 的子组件 */}
        <MindMapHeader
          onCreateCard={handleCreateCard}
          onExportPNG={exportImport.handleExportPNG}
          onExportMermaid={exportImport.handleExportMermaid}
          onExportMarkdown={exportImport.handleExportMarkdown}
          onImportMermaid={exportImport.handleOpenMermaidImport}
          onImportMarkdown={exportImport.handleOpenMarkdownImport}
          onShowKeyBindings={() => core.setShowKeyBindings(true)}
          onCopy={clipboard.handleCopy}
          onCut={clipboard.handleCut}
          onPaste={core.handlePaste}
          onDelete={core.handleDelete}
          keyBindings={keyBindings}
          canUndo={core.history.canUndo}
          canRedo={core.history.canRedo}
          onUndo={core.handleUndo}
          onRedo={core.handleRedo}
          currentLayout={cards.getLayoutSettings()}
          onLayoutChange={cards.changeLayoutAlgorithm}
          hasSelection={cards.selectedCardIds.length > 0 || connections.selectedConnectionIds.length > 0}
          onEnterFreeConnectionMode={handleEnterFreeConnectionMode}
          freeConnectionMode={freeConnectionMode}
          onExitFreeConnectionMode={handleExitFreeConnectionMode}
        />
        
        {/* Canvas 组件 */}
        <Canvas
          mapRef={core.mapRef}
          cards={cards.cards}
          connections={connections.connections}
          selectedCardId={cards.selectedCardId}
          selectedCardIds={cards.selectedCardIds}
          selectedConnectionIds={connections.selectedConnectionIds}
          editingCardId={cards.editingCardId}
          connectionMode={connections.connectionMode}
          connectionStart={connections.connectionStart}
          zoomLevel={core.zoomLevel}
          pan={core.pan}
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
          onCloseKeyBindings={() => core.setShowKeyBindings(false)}
          onSaveKeyBindings={core.updateKeyBindings}
          editingConnectionId={connections.editingConnectionId}
          onConnectionLabelChange={connections.updateConnectionLabel}
          onConnectionEditComplete={() => connections.setEditingConnectionId(null)}
          connectionTargetCardId={connections.connectionTargetCardId}
          freeConnectionMode={freeConnectionMode}
          drawingLine={drawingLine}
          lineStartPoint={lineStartPoint}
          currentMousePosition={currentMousePosition}
          onStartDrawing={startDrawing}
          onDrawingMove={drawingMove}
          onEndDrawing={endDrawing}
        />
        
        {/* 模态对话框 */}
        {exportImport.showMermaidImportModal && (
          <MermaidImportModal
            onImport={exportImport.handleImportMermaid}
            onClose={exportImport.closeMermaidImportModal}
          />
        )}

        {exportImport.showMermaidExportModal && (
          <MermaidExportModal
            mermaidCode={exportImport.mermaidCode}
            onClose={exportImport.closeMermaidExportModal}
          />
        )}

        {exportImport.showMarkdownExportModal && (
          <MarkdownExportModal
            markdownContent={exportImport.markdownContent}
            onClose={exportImport.closeMarkdownExportModal}
          />
        )}

        {exportImport.showMarkdownImportModal && (
          <MarkdownImportModal
            onImport={exportImport.handleImportMarkdown}
            onClose={exportImport.closeMarkdownImportModal}
          />
        )}

        {/* 提示消息 */}
        {toastMessage && (
          <Toast 
            message={toastMessage} 
            duration={1000}
            onClose={() => setToastMessage(null)}
          />
        )}
      </div>
    </MindMapProvider>
  );
}

export default App;
