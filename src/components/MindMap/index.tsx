import React, { useRef, useState, useEffect, useCallback } from 'react';
import '../../styles/MindMap.css';
import { useCards } from '../../hooks/useCards';
import { useConnections } from '../../hooks/useConnections';
import { useKeyBindings } from '../../hooks/useKeyBindings';
import { useHistory } from '../../hooks/useHistory';
import { saveMindMapToStorage, loadMindMapFromStorage } from '../../utils/storageUtils';
import { calculateConnectedCardPosition, findNearestCardInDirection } from '../../utils/positionUtils';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import HelpModal from '../Modals/HelpModal';
import KeyBindingModal from '../Modals/KeyBindingModal';
import { ISize } from '../../types';

const MindMap: React.FC = () => {
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
  
  // 状态管理
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
  
  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 显示帮助
      if (event.key === keyBindings.help) {
        setShowHelp(prev => !prev);
        return;
      }
      
      // Tab键状态跟踪
      if (event.key === 'Tab') {
        setTabPressed(true);
        event.preventDefault();
      }
      
      // 撤销和重做
      if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }
      
      // 显示快捷键设置
      if (event.key === keyBindings.showKeyBindings && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setShowKeyBindings(prev => !prev);
        return;
      }
      
      // 提升新建卡片的优先级，即使在编辑状态也可以保存并创建新卡片
      if (event.key === keyBindings.newCard && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (editingCardId) {
          setEditingCardId(null); // 先保存当前编辑
        }
        createCard(getMapSize());
        return;
      }
      
      // Tab + 方向键选择卡片
      if (tabPressed && selectedCardId) {
        if (event.key === keyBindings.moveUp) {
          event.preventDefault();
          selectNearestCard('up');
          return;
        }
        if (event.key === keyBindings.moveDown) {
          event.preventDefault();
          selectNearestCard('down');
          return;
        }
        if (event.key === keyBindings.moveLeft) {
          event.preventDefault();
          selectNearestCard('left');
          return;
        }
        if (event.key === keyBindings.moveRight) {
          event.preventDefault();
          selectNearestCard('right');
          return;
        }
      }
      
      // Ctrl + 方向键创建连接卡片
      if ((event.ctrlKey || event.metaKey) && selectedCardId && !tabPressed && !event.shiftKey) {
        const selectedCard = cards.find(card => card.id === selectedCardId);
        if (!selectedCard) return;
        
        if (event.key === keyBindings.moveUp) {
          event.preventDefault();
          createConnectedCard('up');
          return;
        }
        if (event.key === keyBindings.moveDown) {
          event.preventDefault();
          createConnectedCard('down');
          return;
        }
        if (event.key === keyBindings.moveLeft) {
          event.preventDefault();
          createConnectedCard('left');
          return;
        }
        if (event.key === keyBindings.moveRight) {
          event.preventDefault();
          createConnectedCard('right');
          return;
        }
      }
      
      // 如果正在编辑卡片内容，不处理除了上面处理的快捷键以外的其他快捷键
      if (editingCardId) {
        return;
      }
      
      // 如果显示帮助或快捷键设置，不处理除了Escape以外的快捷键
      if ((showHelp || showKeyBindings) && event.key === 'Escape') {
        setShowHelp(false);
        setShowKeyBindings(false);
        return;
      }
      
      // 避免与浏览器冲突的快捷键
      if (
        (event.key === keyBindings.newCard && (event.ctrlKey || event.metaKey)) ||
        (event.key === keyBindings.save && (event.ctrlKey || event.metaKey)) ||
        (event.key === keyBindings.load && (event.ctrlKey || event.metaKey)) ||
        (event.key === keyBindings.resetView && (event.ctrlKey || event.metaKey)) ||
        (event.key === keyBindings.zoomIn && (event.ctrlKey || event.metaKey)) ||
        (event.key === keyBindings.zoomOut && (event.ctrlKey || event.metaKey)) ||
        event.key === keyBindings.nextCard
      ) {
        event.preventDefault();
      }
      
      switch (event.key) {
        case keyBindings.editCard: // 编辑选中的卡片
          if (selectedCardId) {
            setEditingCardId(selectedCardId);
          }
          break;
          
        case 'Escape': // 退出编辑模式或连线模式
          if (editingCardId) {
            setEditingCardId(null);
          } else if (connectionMode) {
            cancelConnectionMode();
          } else {
            setSelectedCardId(null);
          }
          break;
          
        case keyBindings.deleteCard: // 删除选中的卡片或连线
        case 'Backspace':
          if (selectedCardId) {
            deleteCardConnections(selectedCardId);
            deleteCard(selectedCardId);
          }
          break;
          
        case keyBindings.startConnection: // 开始连线模式
          if (selectedCardId && !connectionMode) {
            startConnectionMode(selectedCardId);
          }
          break;
          
        case keyBindings.nextCard: // 在卡片之间切换
          if (cards.length > 0) {
            selectNextCard(event.shiftKey);
          }
          break;
          
        // 移动卡片
        case keyBindings.moveUp:
          if (selectedCardId) {
            event.preventDefault(); // 防止页面滚动
            startContinuousMove(0, -1, event.shiftKey);
          }
          break;
        case keyBindings.moveDown:
          if (selectedCardId) {
            event.preventDefault();
            startContinuousMove(0, 1, event.shiftKey);
          }
          break;
        case keyBindings.moveLeft:
          if (selectedCardId) {
            event.preventDefault();
            startContinuousMove(-1, 0, event.shiftKey);
          }
          break;
        case keyBindings.moveRight:
          if (selectedCardId) {
            event.preventDefault();
            startContinuousMove(1, 0, event.shiftKey);
          }
          break;
          
        // 缩放
        case keyBindings.zoomIn:
          if (event.ctrlKey || event.metaKey) {
            setZoomLevel(prev => Math.min(prev + 0.1, 2));
          }
          break;
        case keyBindings.zoomOut:
          if (event.ctrlKey || event.metaKey) {
            setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
          }
          break;
        
        // 其他辅助按键
        case keyBindings.resetView: // 空格开始平移模式
          if (event.ctrlKey || event.metaKey) {
            setPan({ x: 0, y: 0 });
          }
          break;
          
        case keyBindings.save: // 保存
          if (event.ctrlKey || event.metaKey) {
            saveMindMap();
          }
          break;
          
        case keyBindings.load: // 打开
          if (event.ctrlKey || event.metaKey) {
            loadMindMap();
          }
          break;
      }
    };
    
    // 添加按键抬起事件处理
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setTabPressed(false);
      }
      
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        stopContinuousMove();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      stopContinuousMove(); // 清理定时器
    };
  }, [
    selectedCardId, 
    editingCardId, 
    cards, 
    connectionMode, 
    connectionStart, 
    keyBindings, 
    showHelp, 
    showKeyBindings, 
    tabPressed,
    undo,
    redo,
    createCard,
    deleteCard,
    deleteCardConnections,
    startConnectionMode,
    cancelConnectionMode
  ]);
  
  // 移动选中的卡片
  const moveSelectedCard = (deltaX: number, deltaY: number, isLargeStep: boolean) => {
    if (!selectedCardId) return;
    const step = isLargeStep ? 30 : 10;
    moveCard(selectedCardId, deltaX * step, deltaY * step);
  };
  
  // 开始持续移动
  const startContinuousMove = (deltaX: number, deltaY: number, isLargeStep: boolean) => {
    // 先清除可能存在的定时器
    if (moveInterval) {
      clearInterval(moveInterval);
    }
    
    // 首先执行一次移动，避免延迟感
    moveSelectedCard(deltaX, deltaY, isLargeStep);
    
    // 设置连续移动
    const interval = setInterval(() => {
      moveSelectedCard(deltaX, deltaY, isLargeStep);
    }, 100); // 每100ms移动一次
    
    setMoveInterval(interval);
  };
  
  // 停止持续移动
  const stopContinuousMove = () => {
    if (moveInterval) {
      clearInterval(moveInterval);
      setMoveInterval(null);
    }
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
  
  // 在指定方向创建连接卡片
  const createConnectedCard = (direction: 'up' | 'down' | 'left' | 'right') => {
    const selectedCard = cards.find(card => card.id === selectedCardId);
    if (!selectedCard) return;
    
    const position = calculateConnectedCardPosition(selectedCard, direction);
    const newCard = createCardAtPosition(position);
    
    // 创建连线
    const connection = {
      id: `conn-${Date.now()}`,
      startCardId: selectedCardId!,
      endCardId: newCard.id,
    };
    
    setConnectionsData([...connections, connection]);
  };
  
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
  
  // 获取地图大小
  const getMapSize = (): ISize => {
    return {
      width: mapRef.current?.clientWidth || 800,
      height: mapRef.current?.clientHeight || 600
    };
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
      { key: 'Ctrl+Enter', desc: '完成编辑' },
      { key: 'Esc', desc: '取消编辑/连线/取消选择' },
      { key: keyBindings.nextCard, desc: '在卡片间切换' },
      { key: `Shift+${keyBindings.nextCard}`, desc: '反向切换卡片' },
      { key: `Tab+方向键`, desc: '按方向选择最近的卡片' },
      { key: '方向键', desc: '移动选中的卡片' },
      { key: 'Shift+方向键', desc: '大幅移动选中的卡片' },
      { key: `Ctrl+方向键`, desc: '在指定方向创建连线和卡片' },
      { key: keyBindings.deleteCard, desc: '删除选中的卡片' },
      { key: keyBindings.startConnection, desc: '开始连线模式' },
      { key: `Ctrl+${keyBindings.zoomIn}`, desc: '放大视图' },
      { key: `Ctrl+${keyBindings.zoomOut}`, desc: '缩小视图' },
      { key: `Ctrl+${keyBindings.resetView}`, desc: '重置视图位置' },
      { key: `Ctrl+Z`, desc: '撤销' },
      { key: `Ctrl+Shift+Z`, desc: '重做' },
      { key: `Ctrl+${keyBindings.save}`, desc: '保存思维导图' },
      { key: `Ctrl+${keyBindings.load}`, desc: '加载思维导图' },
      { key: keyBindings.help, desc: '显示/隐藏帮助' },
      { key: `Ctrl+${keyBindings.showKeyBindings}`, desc: '自定义快捷键' },
    ];
  };
  
  return (
    <div className="mind-map-container">
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