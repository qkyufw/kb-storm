import React, { useEffect, useState, useRef, useCallback } from 'react';
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
import Toast from '../Toast'; // 导入 Toast 组件
import { IConnection } from '../../types'; // 确保导入 IConnection
import { useMindMapKeyboard } from '../../hooks/useMindMapKeyboard'; // 导入键盘快捷键钩子

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
    handleDelete: selection.handleDelete,
    handleUndo: core.handleUndo,
    handleRedo: core.handleRedo,
    keyBindings
  });
  
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
  const handleExportExcalidraw = useCallback(() => {
    exportAsExcalidraw({
      cards: cards.cards,
      connections: connections.connections
    });
  }, []);

  // 处理 Mermaid 导入对话框
  const handleImportMermaidClick = () => {
    setShowMermaidImportModal(true);
  };

  // 添加自由连线相关状态
  const [freeConnectionMode, setFreeConnectionMode] = useState(false);
  const [drawingLine, setDrawingLine] = useState(false);
  const [lineStartPoint, setLineStartPoint] = useState({ x: 0, y: 0, cardId: null as string | null });
  const [currentMousePosition, setCurrentMousePosition] = useState({ x: 0, y: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // 开启自由连线模式
  const handleEnterFreeConnectionMode = useCallback(() => {
    setFreeConnectionMode(true);
    // 提示用户如何使用自由连线模式
    setToastMessage('自由连线模式：绘制一条连接线，起点和终点必须在不同的卡片上');
  }, []);
  
  // 退出自由连线模式
  const handleExitFreeConnectionMode = useCallback(() => {
    setFreeConnectionMode(false);
    setDrawingLine(false);
  }, []);
  
  // 开始绘制线条
  const handleStartDrawing = useCallback((x: number, y: number, cardId: string | null) => {
    setLineStartPoint({ x, y, cardId });
    setCurrentMousePosition({ x, y });
    setDrawingLine(true);
  }, []);
  
  // 绘制线条过程中移动
  const handleDrawingMove = useCallback((x: number, y: number) => {
    setCurrentMousePosition({ x, y });
  }, []);
  
  // 结束绘制线条
  const handleEndDrawing = useCallback((x: number, y: number, cardId: string | null) => {
    const startCardId = lineStartPoint.cardId;
    const endCardId = cardId;
    
    // 在结束时检查起点和终点是否都在不同的卡片上
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
      
      // 显示成功提示，持续时间改为1秒
      setToastMessage('连线成功');
    } else {
      // 显示不同的错误提示信息，持续时间改为1秒
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
    
    // 重置绘制状态
    setDrawingLine(false);
  }, [lineStartPoint.cardId, connections, history]);

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
        freeConnectionMode={freeConnectionMode}
        setFreeConnectionMode={setFreeConnectionMode}
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
        onEnterFreeConnectionMode={handleEnterFreeConnectionMode} // 添加自由连线模式入口
        freeConnectionMode={freeConnectionMode} // 传递自由连线模式状态
        onExitFreeConnectionMode={handleExitFreeConnectionMode} // 添加退出自由连线模式回调
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
        freeConnectionMode={freeConnectionMode} // 传递自由连线模式状态
        drawingLine={drawingLine} // 传递绘制线条状态
        lineStartPoint={lineStartPoint} // 传递线条起点
        currentMousePosition={currentMousePosition} // 传递当前鼠标位置
        onStartDrawing={handleStartDrawing} // 传递开始绘制线条回调
        onDrawingMove={handleDrawingMove} // 传递绘制线条移动回调
        onEndDrawing={handleEndDrawing} // 传递结束绘制线条回调
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