import React, { useEffect, useCallback, useState } from 'react';
import { ICard, ISize, IConnection } from '../types/CoreTypes';
import { LogUtils } from '../utils/logUtils';

// 键盘处理组件
interface MindMapKeyboardHandlerProps {
  cards: ICard[];
  selectedCardId: string | null;
  editingCardId: string | null;
  connectionMode: boolean; // 这个应该是直接作为属性传入，而不是通过connections对象
  connectionStart: string | null; // 添加连接线起始卡片 ID 的属性
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
  connections: IConnection[]; // 这个应该只是连接数组，而不包含connectionMode属性
  selectConnection: (connectionId: string, isMultiSelect: boolean) => void; // 添加选择连接线方法
  selectNextConnection: (reverse: boolean) => void; // 添加选择下一条线方法
  selectCards: (cardIds: string[]) => void; // 添加批量选择卡片的函数
  updateConnectionLabel: (connectionId: string, label: string) => void; // 添加更新连接线标签的方法
  setEditingConnectionId: (connectionId: string | null) => void; // 添加设置编辑连接线ID的方法
  editingConnectionId: string | null; // 添加正在编辑的连接线ID
  findNearestCardInDirection: (currentCardId: string, direction: 'up' | 'down' | 'left' | 'right') => string | null;
  setConnectionTargetCardId: (cardId: string | null) => void;
  connectionTargetCardId: string | null;
  freeConnectionMode: boolean;
  setFreeConnectionMode: (mode: boolean) => void;
}

const MindMapKeyboardHandler: React.FC<MindMapKeyboardHandlerProps> = ({
  cards,
  selectedCardId,
  editingCardId,
  connectionMode, // 直接从props中获取
  connectionStart, // 确保将 connectionStart 解构出来
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
  selectNextConnection,
  selectCards, // 添加到解构中
  updateConnectionLabel,
  setEditingConnectionId,
  editingConnectionId,
  findNearestCardInDirection,
  setConnectionTargetCardId,
  connectionTargetCardId,
  freeConnectionMode,
  setFreeConnectionMode
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
      
      // Tab键状态跟踪和处理
      if (event.key === 'Tab') {
        event.preventDefault(); // 总是阻止默认的Tab行为
        
        // 设置Tab状态为按下，用于Tab+方向键组合
        setTabPressed(true);
        
        // Tab + 空格切换卡片/连接线选择模式
        if (spacePressed) {
          const newMode = !connectionSelectionMode;
          setConnectionSelectionMode(newMode);
          LogUtils.selection('切换', newMode ? '连接线选择模式' : '卡片选择模式', null);
          return;
        }
        
        // 在连接线选择模式下，通过Tab切换连接线
        if (connectionSelectionMode) {
          LogUtils.selection('通过Tab切换', '连接线', event.shiftKey ? '反向' : '正向');
          selectNextConnection(event.shiftKey);
          return;
        }
        
        // 在卡片选择模式下，通过Tab切换卡片
        if (!event.ctrlKey && !event.altKey && !event.metaKey && !tabPressed) {
          LogUtils.selection('通过Tab切换', '卡片', event.shiftKey ? '反向' : '正向');
          selectNextCard(event.shiftKey);
        }
        return;
      }
      
      // 空格键状态跟踪
      if (event.code === 'Space' && !event.ctrlKey && !event.metaKey) {
        setSpacePressed(true);
        return;
      }
      
      // 如果在连线模式下，使用方向键选择目标卡片
      if (connectionMode) {
        // 在连线模式下，方向键用于选择目标卡片
        if (event.key === keyBindings.moveUp || event.key === 'ArrowUp') {
          event.preventDefault();
          // 修改：从当前目标卡片继续移动，如果没有目标卡片，则从起始卡片开始
          const sourceCardId = connectionTargetCardId || selectedCardId || connectionStart;
          if (sourceCardId) {
            const targetCardId = findNearestCardInDirection(sourceCardId, 'up');
            if (targetCardId) setConnectionTargetCardId(targetCardId);
          }
          return;
        }
        if (event.key === keyBindings.moveDown || event.key === 'ArrowDown') {
          event.preventDefault();
          const sourceCardId = connectionTargetCardId || selectedCardId || connectionStart;
          if (sourceCardId) {
            const targetCardId = findNearestCardInDirection(sourceCardId, 'down');
            if (targetCardId) setConnectionTargetCardId(targetCardId);
          }
          return;
        }
        if (event.key === keyBindings.moveLeft || event.key === 'ArrowLeft') {
          event.preventDefault();
          const sourceCardId = connectionTargetCardId || selectedCardId || connectionStart;
          if (sourceCardId) {
            const targetCardId = findNearestCardInDirection(sourceCardId, 'left');
            if (targetCardId) setConnectionTargetCardId(targetCardId);
          }
          return;
        }
        if (event.key === keyBindings.moveRight || event.key === 'ArrowRight') {
          event.preventDefault();
          const sourceCardId = connectionTargetCardId || selectedCardId || connectionStart;
          if (sourceCardId) {
            const targetCardId = findNearestCardInDirection(sourceCardId, 'right');
            if (targetCardId) setConnectionTargetCardId(targetCardId);
          }
          return;
        }
        
        // 在连线模式下按Enter确认连线
        if (event.key === 'Enter' && connectionTargetCardId) {
          event.preventDefault();
          completeConnection(connectionTargetCardId);
          setConnectionTargetCardId(null);
          return;
        }
        
        // 在连线模式下按Esc取消连线
        if (event.key === 'Escape') {
          event.preventDefault();
          cancelConnectionMode();
          setConnectionTargetCardId(null);
          return;
        }
      }
      
      // 在自由连线模式下按Esc退出
      if (event.key === 'Escape' && freeConnectionMode) {
        setFreeConnectionMode(false);
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
      
      // 提升新建卡片的优先级，即使在编辑状态也可以保存并创建新卡片 (Ctrl+D)
      if (event.key.toLowerCase() === keyBindings.newCard.toLowerCase() && (event.ctrlKey || event.metaKey)) {
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
        
        if (event.key === keyBindings.moveUp || event.key === 'ArrowUp') {
          event.preventDefault();
          createConnectedCard('up');
          return;
        }
        if (event.key === keyBindings.moveDown || event.key === 'ArrowDown') {
          event.preventDefault();
          createConnectedCard('down');
          return;
        }
        if (event.key === keyBindings.moveLeft || event.key === 'ArrowLeft') {
          event.preventDefault();
          createConnectedCard('left');
          return;
        }
        if (event.key === keyBindings.moveRight || event.key === 'ArrowRight') {
          event.preventDefault();
          createConnectedCard('right');
          return;
        }
      }
      
      // 如果正在编辑卡片内容或连接线标签，不处理快捷键
      if (editingCardId || editingConnectionId) {
        if (event.key === 'Escape') {
          if (editingCardId) {
            setEditingCardId(null);
          }
          if (editingConnectionId) {
            setEditingConnectionId(null);
          }
        }
        return;
      }

      // 修改处理连接线和卡片编辑的 Enter 键逻辑
      if (event.key === 'Enter') {
        // 如果有选中的连接线，进入连接线编辑模式
        if (selectedConnectionIds.length === 1) {
          event.preventDefault();
          LogUtils.selection('开始编辑', '连接线', selectedConnectionIds[0]);
          setEditingConnectionId(selectedConnectionIds[0]);
          return;
        }
        
        // 否则，如果有选中的卡片，进入卡片编辑模式
        if (selectedCardId) {
          event.preventDefault();
          LogUtils.selection('开始编辑', '卡片', selectedCardId);
          setEditingCardId(selectedCardId);
          return;
        }
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
          keyBindings.copy,
          keyBindings.cut,
          keyBindings.paste,
          'z' // 撤销/重做
        ].includes(event.key.toLowerCase())) {
          event.preventDefault();
        }
      } else if (event.key === keyBindings.nextCard) {
        event.preventDefault();
      }
      
      switch (event.key) {
        case keyBindings.editCard: // 编辑选中的卡片
          if (selectedCardId) {
            event.preventDefault(); // 阻止默认事件
            LogUtils.selection('开始编辑', '卡片', selectedCardId);
            setEditingCardId(selectedCardId);
          }
          break;
          
        case 'Escape': // 退出编辑模式或连线模式
          if (editingCardId) {
            LogUtils.selection('结束编辑', '卡片', editingCardId);
            setEditingCardId(null);
          } else if (connectionMode) {
            LogUtils.selection('取消', '连线模式', null);
            cancelConnectionMode();
          } else {
            // 同时取消卡片和连接线的选择
            if (selectedCardId) {
              LogUtils.selection('取消选择', '卡片', selectedCardId);
              setSelectedCardId(null);
            }
            // 如果有选中的连接线，取消选择
            if (selectedConnectionIds.length > 0) {
              LogUtils.selection('取消选择', '连接线', selectedConnectionIds);
              // 清除连接线选择
              selectedConnectionIds.forEach(id => {
                selectConnection(id, true); // 使用多选模式来取消所有选择
              });
            }
          }
          break;
          
        case keyBindings.deleteCard: // 删除选中的卡片或连线
        case 'Backspace':
          if (selectedCardId) {
            LogUtils.selection('删除', '卡片', selectedCardId);
            deleteCardConnections(selectedCardId);
            deleteCard(selectedCardId);
          }
          break;
          
        // 开始连线模式 - 修改为组合键 (Ctrl+I)
        case keyBindings.startConnection.toLowerCase():
          if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
            // 避免与复制冲突，检查是否没有选中的卡片
            if (selectedCardId && !connectionMode) { // 这里直接使用props中的connectionMode
              event.preventDefault(); // 阻止复制操作
              startConnectionMode(selectedCardId);
            }
            return;
          }
          break;
          
        case keyBindings.nextCard: // 在卡片之间切换
          if (cards.length > 0) {
            LogUtils.selection('切换', '卡片', event.shiftKey ? '反向' : '正向');
            selectNextCard(event.shiftKey);
          }
          break;
          
        // 移动卡片 - 只有在不在连线模式下才移动卡片
        case keyBindings.moveUp:
        case 'ArrowUp':
          if (!connectionMode && selectedCardId && (event.key === keyBindings.moveUp || event.key === 'ArrowUp')) {
            event.preventDefault(); // 防止页面滚动
            startContinuousMove(0, -1, event.shiftKey);
          }
          break;
        case keyBindings.moveDown:
        case 'ArrowDown':
          if (!connectionMode && selectedCardId && (event.key === keyBindings.moveDown || event.key === 'ArrowDown')) {
            event.preventDefault();
            startContinuousMove(0, 1, event.shiftKey);
          }
          break;
        case keyBindings.moveLeft:
        case 'ArrowLeft':
          if (!connectionMode && selectedCardId && (event.key === keyBindings.moveLeft || event.key === 'ArrowLeft')) {
            event.preventDefault();
            startContinuousMove(-1, 0, event.shiftKey);
          }
          break;
        case keyBindings.moveRight:
        case 'ArrowRight':
          if (!connectionMode && selectedCardId && (event.key === keyBindings.moveRight || event.key === 'ArrowRight')) {
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

        case keyBindings.selectAll: // 全选
          if ((event.ctrlKey || event.metaKey) && !connectionSelectionMode) {
            event.preventDefault();
            const allCardIds = cards.map(card => card.id);
            LogUtils.selection('全选', '卡片', allCardIds);
            selectCards(allCardIds);
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
    selectNextConnection,
    selectCards, // 添加到依赖数组
    updateConnectionLabel,
    setEditingConnectionId,
    editingConnectionId,
    findNearestCardInDirection,
    setConnectionTargetCardId,
    connectionTargetCardId,
    connectionStart, // 添加到依赖数组
    freeConnectionMode,
    setFreeConnectionMode,
    // 添加缺失的依赖项
    completeConnection,
    setSelectedCardId,
    setEditingCardId,
    moveCard,
    setShowHelp,
    setShowKeyBindings,
    setTabPressed,
    setSpacePressed,
    selectedConnectionIds,
    connections,
    selectConnection
  ]);
  
  return null; // 这是一个行为组件，不渲染任何UI
};

export default MindMapKeyboardHandler;