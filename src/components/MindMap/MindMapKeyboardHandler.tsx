import React, { useEffect, useCallback, useState } from 'react';
import { ICard, ISize, IConnection } from '../../types';

interface MindMapKeyboardHandlerProps {
  cards: ICard[];
  selectedCardId: string | null;
  editingCardId: string | null;
  connectionMode: boolean;
  keyBindings: any;
  tabPressed: boolean;
  spacePressed: boolean; // 添加空格按下状态跟踪
  setTabPressed: (pressed: boolean) => void;
  setSpacePressed: (pressed: boolean) => void; // 添加设置空格按下状态的方法
  showHelp: boolean;
  showKeyBindings: boolean;
  setShowHelp: (show: boolean | ((prevShow: boolean) => boolean)) => void; // 修复类型
  setShowKeyBindings: (show: boolean | ((prevShow: boolean) => boolean)) => void; // 修复类型
  setEditingCardId: (id: string | null) => void;
  setSelectedCardId: (id: string | null) => void;
  moveCard: (cardId: string, deltaX: number, deltaY: number) => void;
  startConnectionMode: (cardId: string) => void;
  cancelConnectionMode: () => void;
  completeConnection: (endCardId: string) => void;
  deleteCard: (cardId: string) => void;
  deleteCardConnections: (cardId: string) => void;
  selectNextCard: (reverse: boolean) => void;
  selectNearestCard: (direction: 'up' | 'down' | 'left' | 'right') => void;
  createConnectedCard: (direction: 'up' | 'down' | 'left' | 'right') => void;
  createCard: (size: ISize) => void;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  saveMindMap: () => void;
  loadMindMap: () => void;
  undo: () => void;
  redo: () => void;
  getMapSize: () => ISize;
  startContinuousMove: (deltaX: number, deltaY: number, isLargeStep: boolean) => void;
  stopContinuousMove: () => void;
  selectedConnectionIds: string[]; // 添加选中连接线ID数组
  connections: IConnection[]; // 添加连接线数组
  selectConnection: (connectionId: string, isMultiSelect: boolean) => void; // 添加选择连接线方法
  selectNextConnection: (reverse: boolean) => void; // 添加选择下一条线方法
}

const MindMapKeyboardHandler: React.FC<MindMapKeyboardHandlerProps> = ({
  cards,
  selectedCardId,
  editingCardId,
  connectionMode,
  keyBindings,
  tabPressed,
  spacePressed,
  setTabPressed,
  setSpacePressed,
  showHelp,
  showKeyBindings,
  setShowHelp,
  setShowKeyBindings,
  setEditingCardId,
  setSelectedCardId,
  moveCard,
  startConnectionMode,
  cancelConnectionMode,
  completeConnection,
  deleteCard,
  deleteCardConnections,
  selectNextCard,
  selectNearestCard,
  createConnectedCard,
  createCard,
  setZoomLevel,
  setPan,
  saveMindMap,
  loadMindMap,
  undo,
  redo,
  getMapSize,
  startContinuousMove,
  stopContinuousMove,
  selectedConnectionIds,
  connections,
  selectConnection,
  selectNextConnection
}) => {
  // 添加连接线选择模式状态
  const [connectionSelectionMode, setConnectionSelectionMode] = useState(false);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 优先处理撤销和重做快捷键，这些是最重要的
      if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) {
        console.log('检测到撤销/重做快捷键');
        event.preventDefault();
        event.stopPropagation();
        if (event.shiftKey) {
          console.log('执行重做操作');
          redo(); // Ctrl+Shift+Z 重做
        } else {
          console.log('执行撤销操作');
          undo(); // Ctrl+Z 撤销
        }
        return;
      }
      
      // 显示帮助
      if (event.key === keyBindings.help) {
        setShowHelp((prev: boolean) => !prev); // 添加类型标注
        return;
      }
      
      // 撤销和重做 - 明确处理这些快捷键
      if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (event.shiftKey) {
          redo(); // Ctrl+Shift+Z 重做
        } else {
          undo(); // Ctrl+Z 撤销
        }
        return;
      }
      
      // Tab键状态跟踪和处理
      if (event.key === 'Tab') {
        event.preventDefault(); // 总是阻止默认的Tab行为
        
        // 设置Tab状态为按下，用于Tab+方向键组合
        setTabPressed(true);
        
        // Tab + 空格切换卡片/连接线选择模式
        if (spacePressed) {
          setConnectionSelectionMode(prev => !prev);
          return;
        }
        
        // 在连接线选择模式下，通过Tab切换连接线
        if (connectionSelectionMode) {
          selectNextConnection(event.shiftKey);
          return;
        }
        
        // 在卡片选择模式下，通过Tab切换卡片
        if (!event.ctrlKey && !event.altKey && !event.metaKey && !tabPressed) {
          selectNextCard(event.shiftKey);
        }
        return;
      }
      
      // 空格键状态跟踪
      if (event.code === 'Space' && !event.ctrlKey && !event.metaKey) {
        setSpacePressed(true);
        return;
      }
      
      // Tab + 方向键选择卡片 (当Tab键被按住时)
      if (tabPressed && selectedCardId) {
        if (event.key === keyBindings.moveUp || event.key === 'ArrowUp') {
          event.preventDefault();
          selectNearestCard('up');
          return;
        }
        if (event.key === keyBindings.moveDown || event.key === 'ArrowDown') {
          event.preventDefault();
          selectNearestCard('down');
          return;
        }
        if (event.key === keyBindings.moveLeft || event.key === 'ArrowLeft') {
          event.preventDefault();
          selectNearestCard('left');
          return;
        }
        if (event.key === keyBindings.moveRight || event.key === 'ArrowRight') {
          event.preventDefault();
          selectNearestCard('right');
          return;
        }
      }
      
      // 显示快捷键设置
      if (event.key === keyBindings.showKeyBindings && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setShowKeyBindings((prev: boolean) => !prev); // 添加类型标注
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
      
      // 避免与浏览器冲突的快捷键 - 简化重复判断
      if (event.ctrlKey || event.metaKey) {
        // 避免浏览器默认行为
        if ([
          keyBindings.newCard,
          keyBindings.save,
          keyBindings.load,
          keyBindings.resetView,
          keyBindings.zoomIn,
          keyBindings.zoomOut,
          'z' // 撤销/重做
        ].includes(event.key)) {
          event.preventDefault();
        }
      } else if (event.key === keyBindings.nextCard) {
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
      
      if (event.code === 'Space') {
        setSpacePressed(false);
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
    keyBindings, 
    showHelp, 
    showKeyBindings, 
    tabPressed,
    spacePressed,
    connectionSelectionMode,
    undo,  // 重要：确保undo函数包含在依赖中
    redo,  // 重要：确保redo函数包含在依赖中
    createCard,
    deleteCard,
    deleteCardConnections,
    startConnectionMode,
    cancelConnectionMode,
    selectNextCard,
    selectNearestCard,
    createConnectedCard,
    startContinuousMove,
    stopContinuousMove,
    getMapSize,
    saveMindMap,
    loadMindMap,
    setZoomLevel,
    setPan,
    selectNextConnection
  ]);
  
  return null; // 这是一个行为组件，不渲染任何UI
};

export default MindMapKeyboardHandler;