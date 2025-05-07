import React, { useEffect, useState, useCallback } from 'react';
import './styles/MindMap.css';
import { useMindMapCore } from './hooks/core/useMindMapCore';
import { useCardDragging } from './hooks/core/useCards';
import MindMapKeyboardHandler from './handlers/MindMapKeyboardHandler';
import MindMapContent from './components/Content/MindMapContent';
import { createCardMovementHandlers, createConnectedCardFunction } from './handlers/cardInteractionHandlers';
import MindMapFeedback from './components/feedback/MindMapFeedback';
import MindMapHeader from './components/Header/MindMapHeader';
import { findNearestCardInDirection } from './utils/cardPositioning';
import { 
  MermaidImportModal, 
  MermaidExportModal, 
  MarkdownExportModal, 
  MarkdownImportModal 
} from './components/Modals/ModalComponents';
import Toast from './components/common/Toast';
import { IConnection } from './types/CoreTypes';
import { useMindMapKeyboard } from './hooks/interaction/useBasicKeyboardOperations';
import { useMindMapExport } from './hooks/io/useMapExportImport'; // 导入新钩子
import { useFreeConnection } from './hooks/interaction/useDrawableConnection'; // 确保导入.tsx版本的Hook

const MindMap: React.FC = () => {
  // 使用核心钩子
  const core = useMindMapCore();
  
  const { cards, connections, keyBindings, clipboard, history } = core;
  
  // 添加空格键状态跟踪
  const [spacePressed, setSpacePressed] = useState(false);
  
  // 添加toastMessage状态
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // 使用导入导出钩子
  const exportImport = useMindMapExport({
    cards: cards.cards,
    connections: connections.connections,
    mapRef: core.mapRef as React.RefObject<HTMLDivElement>, // 使用类型断言解决类型不匹配
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
  
  // 窗口大小改变监听 - 修复 useEffect 依赖
  useEffect(() => {
    const handleResize = () => {
      // 避免在每次渲染时都创建新的函数
      requestAnimationFrame(() => {
        core.updateViewportInfo();
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [ core ]);
  
  // 缩放监听 - 修复 useEffect 依赖
  useEffect(() => {
    // 使用 requestAnimationFrame 来防止过度更新
    requestAnimationFrame(() => {
      core.updateViewportInfo();
    });
  }, [ core ]);
  
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
    // renderFreeConnectionLine
  } = freeConnection;

  // 更新进入自由连线模式的方法
  const handleEnterFreeConnectionMode = useCallback(() => {
    toggleFreeConnectionMode();
    setToastMessage('自由连线模式：绘制一条连接线，起点和终点必须在不同的卡片上');
  }, [toggleFreeConnectionMode]);

  // 更新退出自由连线模式的方法
  const handleExitFreeConnectionMode = useCallback(() => {
    toggleFreeConnectionMode();
  }, [toggleFreeConnectionMode]);

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
        deleteCards={(cardId: string) => cards.deleteCards([cardId])}
        handleConnectionsDelete={connections.handleConnectionsDelete}
        selectNextCard={selectNextCard}
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
        spacePressed={spacePressed}
        setSpacePressed={setSpacePressed}
        selectedConnectionIds={connections.selectedConnectionIds}
        connections={connections.connections}
        selectConnection={connections.selectConnection}
        selectNextConnection={connections.selectNextConnection}
        selectCards={cards.selectCards} // 添加这一行
        updateConnectionLabel={connections.updateConnectionLabel}
        setEditingConnectionId={connections.setEditingConnectionId}
        editingConnectionId={connections.editingConnectionId}
        findNearestCardInDirection={(currentCardId, direction) => {
          // 确保始终排除连接的起点卡片，避免自我连接
          const currentCard = cards.cards.find(card => card.id === currentCardId);
          if (!currentCard) return null;
          
          // 获取所有可能的目标卡片，排除起始卡片
          const possibleTargets = cards.cards.filter(card => 
            card.id !== connections.connectionStart // 排除连接起点
          );
          
          // 使用修改后的参数调用函数
          const nearestCard = findNearestCardInDirection(
            currentCard,
            possibleTargets,
            direction
          );
          return nearestCard?.id || null;
        }}
        setConnectionTargetCardId={connections.setConnectionTargetCardId}
        connectionTargetCardId={connections.connectionTargetCardId}
        connectionStart={connections.connectionStart} // 正确传递 connectionStart 属性
        freeConnectionMode={freeConnectionMode}
        setFreeConnectionMode={toggleFreeConnectionMode} // 修复setFreeConnectionMode错误
      />
      
      {/* 替换悬浮工具栏为固定工具栏 */}
      <MindMapHeader
        onCreateCard={handleCreateCard}
        onExportPNG={exportImport.handleExportPNG}
        onExportMermaid={exportImport.handleExportMermaid}
        onImportMermaid={exportImport.handleOpenMermaidImport}
        onShowHelp={() => core.setShowHelp(true)}
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
        onExportMarkdown={exportImport.handleExportMarkdown}
        onImportMarkdown={exportImport.handleOpenMarkdownImport}
        onEnterFreeConnectionMode={handleEnterFreeConnectionMode}
        freeConnectionMode={freeConnectionMode}
        onExitFreeConnectionMode={handleExitFreeConnectionMode}
      />
      
      {/* 思维导图内容 - 确保占满整个容器 */}
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
        onCloseKeyBindings={() => core.setShowKeyBindings(false)}
        onSaveKeyBindings={core.updateKeyBindings}
        editingConnectionId={connections.editingConnectionId}
        onConnectionLabelChange={connections.updateConnectionLabel}
        onConnectionEditComplete={() => connections.setEditingConnectionId(null)}
        connectionTargetCardId={connections.connectionTargetCardId}
        connectionStart={connections.connectionStart} // 传递给 MindMapContent 组件
        freeConnectionMode={freeConnectionMode} // 传递自由连线模式状态
        drawingLine={drawingLine} // 传递绘制线条状态
        lineStartPoint={lineStartPoint} // 传递线条起点
        currentMousePosition={currentMousePosition} // 传递当前鼠标位置
        onStartDrawing={startDrawing} // 传递开始绘制线条回调
        onDrawingMove={drawingMove} // 传递绘制线条移动回调
        onEndDrawing={endDrawing} // 传递结束绘制线条回调
      />
      
      
      <MindMapFeedback
        connectionMode={connections.connectionMode}
        showUndoMessage={core.showUndoMessage}
        showRedoMessage={core.showRedoMessage}
      />

      {/* 添加 Mermaid 导入对话框 */}
      {exportImport.showMermaidImportModal && (
        <MermaidImportModal
          onImport={exportImport.handleImportMermaid}
          onClose={exportImport.closeMermaidImportModal}
        />
      )}

      {/* 添加 Mermaid 导出对话框 */}
      {exportImport.showMermaidExportModal && (
        <MermaidExportModal
          mermaidCode={exportImport.mermaidCode}
          onClose={exportImport.closeMermaidExportModal}
        />
      )}

      {/* 添加Markdown导出模态框 */}
      {exportImport.showMarkdownExportModal && (
        <MarkdownExportModal
          markdownContent={exportImport.markdownContent}
          onClose={exportImport.closeMarkdownExportModal}
        />
      )}

      {/* 添加Markdown导入模态框 */}
      {exportImport.showMarkdownImportModal && (
        <MarkdownImportModal
          onImport={exportImport.handleImportMarkdown}
          onClose={exportImport.closeMarkdownImportModal}
        />
      )}

      {/* 添加提示消息，持续时间改为1秒 */}
      {toastMessage && (
        <Toast 
          message={toastMessage} 
          duration={1000}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};

export default MindMap;