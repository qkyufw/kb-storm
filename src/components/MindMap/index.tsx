import React, { useEffect, useState, useRef } from 'react';
import '../../styles/MindMap.css';
import { useMindMapCore } from '../../hooks/useMindMapCore';
import { useCardDragging } from '../../hooks/useCardDragging';
import { 
  saveMindMapToStorage, 
  loadMindMapFromStorage,
  exportAsExcalidraw,
  exportToPNG, // 保留导出PNG功能
  exportAsMermaid,
  exportToMarkdown, // 导入新函数
  importFromExcalidrawFile,
  importFromMermaid,
  importFromMarkdown // 导入新函数
} from '../../utils/storageUtils';
import MindMapKeyboardHandler from './MindMapKeyboardHandler';
import MindMapContent from './MindMapContent';
import { createCardMovementHandlers, createConnectedCardFunction } from './MindMapActions';
import MindMapFeedback from './MindMapFeedback';
import MindMapHeader from './MindMapHeader'; // 导入新组件
import { findNearestCardInDirection } from '../../utils/positionUtils';
import MermaidImportModal from '../Modals/MermaidImportModal';
import MermaidExportModal from '../Modals/MermaidExportModal'; // 导入新组件
import MarkdownExportModal from '../Modals/MarkdownExportModal'; // 导入新组件
import MarkdownImportModal from '../Modals/MarkdownImportModal'; // 导入新组件
import { useCardLayout } from '../../hooks/useCardLayout'; // 修复导入

const MindMap: React.FC = () => {
  // 使用核心钩子
  const core = useMindMapCore();
  
  const { cards, connections, keyBindings, clipboard, selection, history } = core;
  
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
  
  // 导出为Mermaid格式
  const handleExportMermaid = () => {
    const code = exportAsMermaid({
      cards: cards.cards,
      connections: connections.connections
    });
    setMermaidCode(code);
    setShowMermaidExportModal(true);
  };
  
  // 导入Mermaid格式
  const handleImportMermaid = async (mermaidCode: string) => {
    const data = await importFromMermaid(mermaidCode);
    if (data) {
      cards.setCardsData(data.cards);
      connections.setConnectionsData(data.connections);
      cards.setSelectedCardId(null);
    }
  };
  
  // 导出为Markdown格式
  const handleExportMarkdown = () => {
    const content = exportToMarkdown({
      cards: cards.cards,
      connections: connections.connections
    });
    setMarkdownContent(content);
    setShowMarkdownExportModal(true);
  };
  
  // 导入Markdown格式
  const handleImportMarkdown = async (mdContent: string) => {
    // 获取当前布局信息
    const layoutInfo = {
      algorithm: currentLayout.algorithm,
      options: currentLayout.options,
      viewportInfo: {
        viewportWidth: canvasRef.current?.clientWidth || window.innerWidth,
        viewportHeight: canvasRef.current?.clientHeight || window.innerHeight,
        zoom: zoomLevel,
        pan: pan
      }
    };
    
    // 将布局信息传递给导入函数
    const data = importFromMarkdown(mdContent, layoutInfo);
    
    if (data) {
      cards.setCardsData(data.cards);
      connections.setConnectionsData(data.connections);
      history.addToHistory();
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
  
  // 添加空格键状态跟踪
  const [spacePressed, setSpacePressed] = useState(false);
  const [showMermaidImportModal, setShowMermaidImportModal] = useState(false);
  const [showMermaidExportModal, setShowMermaidExportModal] = useState(false);
  const [mermaidCode, setMermaidCode] = useState('');
  const [showMarkdownExportModal, setShowMarkdownExportModal] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [showMarkdownImportModal, setShowMarkdownImportModal] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const { layoutAlgorithm, layoutOptions, changeLayout, calculateCardPosition } = useCardLayout(
    cards.cards, 
    () => ({ width: 1000, height: 800 })
  );

  // 在组件中添加当前布局状态
  const currentLayout = {
    algorithm: layoutAlgorithm,
    options: layoutOptions
  };

  // 导出为PNG图像
  const handleExportPNG = async () => {
    await exportToPNG({
      cards: cards.cards,
      connections: connections.connections
    }, core.mapRef as React.RefObject<HTMLDivElement>);
  };

  // 导出为Excalidraw格式
  const handleExportExcalidraw = () => {
    exportAsExcalidraw({
      cards: cards.cards,
      connections: connections.connections
    });
  };

  // 处理 Mermaid 导入对话框
  const handleImportMermaidClick = () => {
    setShowMermaidImportModal(true);
  };

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
      />
      
      {/* 替换悬浮工具栏为固定工具栏 */}
      <MindMapHeader
        onCreateCard={handleCreateCard}
        onExportPNG={handleExportPNG}
        onExportMermaid={handleExportMermaid}
        onImportMermaid={handleImportMermaidClick}
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
        onExportMarkdown={handleExportMarkdown} // 添加 Markdown 导出处理函数
        onImportMarkdown={() => setShowMarkdownImportModal(true)} // 确保在Toolbar组件中传递导入Markdown的回调
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
        onCloseHelp={() => core.setShowHelp(false)}
        onCloseKeyBindings={() => core.setShowKeyBindings(false)}
        onSaveKeyBindings={core.updateKeyBindings}
        editingConnectionId={connections.editingConnectionId}
        onConnectionLabelChange={connections.updateConnectionLabel}
        onConnectionEditComplete={() => connections.setEditingConnectionId(null)}
        connectionTargetCardId={connections.connectionTargetCardId}
        connectionStart={connections.connectionStart} // 传递给 MindMapContent 组件
      />
      
      <MindMapFeedback
        connectionMode={connections.connectionMode}
        showUndoMessage={core.showUndoMessage}
        showRedoMessage={core.showRedoMessage}
      />

      {/* 添加 Mermaid 导入对话框 */}
      {showMermaidImportModal && (
        <MermaidImportModal
          onImport={handleImportMermaid}
          onClose={() => setShowMermaidImportModal(false)}
        />
      )}

      {/* 添加 Mermaid 导出对话框 */}
      {showMermaidExportModal && (
        <MermaidExportModal
          mermaidCode={mermaidCode}
          onClose={() => setShowMermaidExportModal(false)}
        />
      )}

      {/* 添加Markdown导出模态框 */}
      {showMarkdownExportModal && (
        <MarkdownExportModal
          markdownContent={markdownContent}
          onClose={() => setShowMarkdownExportModal(false)}
        />
      )}

      {/* 添加Markdown导入模态框 */}
      {showMarkdownImportModal && (
        <MarkdownImportModal
          onImport={handleImportMarkdown}
          onClose={() => setShowMarkdownImportModal(false)}
        />
      )}
    </div>
  );
};

export default MindMap;