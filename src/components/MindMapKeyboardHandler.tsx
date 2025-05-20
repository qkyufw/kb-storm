import React, { useEffect, useState } from 'react';
import { Logger } from '../utils/log';

// 导入 Stores
import { useCardStore } from '../store/cardStore';
import { useConnectionStore } from '../store/connectionStore';
import { useUIStore } from '../store/UIStore';
import { useHistoryStore } from '../store/historyStore';
import { useClipboardStore } from '../store/clipboardStore';
import { pasteClipboardService } from '../services/MindMapService';
import { useFreeConnectionStore } from '../store/freeConnectionStore';


// 导入服务
import { 
  selectNextCardService, 
  selectNearestCardService,
  findNearestCardService,
  deleteSelectedElementsService
} from '../services/MindMapService';

// 导入 Hooks
import { useKeyBindings } from '../hooks/interaction/useKeyboardShortcuts';

// 交互服务
import { createCardMovementHandlers, createConnectedCardFunction } from '../handlers/cardInteractionHandlers';

// 新的接口 - 仅接收自由连接状态
interface MindMapKeyboardHandlerProps {}

/**
 * 键盘处理组件 - 大部分状态从store获取，但自由连接状态通过props传入
 */
const MindMapKeyboardHandler: React.FC<MindMapKeyboardHandlerProps> = () => {
  // 使用所有 stores
  const cards = useCardStore();
  const connections = useConnectionStore();
  const ui = useUIStore();
  const history = useHistoryStore();
  const clipboard = useClipboardStore();
  const freeConnection = useFreeConnectionStore();
  const { keyBindings } = useKeyBindings();
  
  // 添加本地状态
  const [connectionSelectionMode, setConnectionSelectionMode] = useState(false);

  // 创建连接卡片功能
  const createConnectedCard = createConnectedCardFunction(
    cards.cards,
    connections.connections,
    cards.selectedCardId,
    cards.createCardAtPosition,
    connections.setConnectionsData
  );

  // 创建卡片移动处理
  const { startContinuousMove, stopContinuousMove } = createCardMovementHandlers(
    cards.selectedCardId,
    cards.moveCard,
    (interval) => {
      if (interval !== ui.moveInterval) {
        ui.setMoveInterval(interval);
      }
    }
  );

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 优先处理撤销和重做快捷键
      if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        event.stopPropagation();
        if (event.shiftKey) {
          history.redo();
        } else {
          history.undo();
        }
        return;
      }

      // 处理复制粘贴快捷键
      if ((event.ctrlKey || event.metaKey) && !event.altKey) {
        switch (event.key.toLowerCase()) {
          case keyBindings.copy: // 复制
            event.preventDefault();
            if (!cards.editingCardId && !connections.editingConnectionId) {
              clipboard.handleCopy();
              return;
            }
            break;
            
          case keyBindings.cut: // 剪切
            event.preventDefault();
            if (!cards.editingCardId && !connections.editingConnectionId) {
              clipboard.handleCut();
              return;
            }
            break;
            
          case keyBindings.paste: // 粘贴
            event.preventDefault();
            if (!cards.editingCardId && !connections.editingConnectionId) {
              pasteClipboardService();
              return;
            }
            break;
        }
      }
      
      // Tab键状态跟踪和处理
      if (event.key === 'Tab') {
        event.preventDefault();
        
        ui.setTabPressed(true);
        
        // Tab + 空格切换卡片/连接线选择模式
        if (ui.spacePressed) {
          const newMode = !connectionSelectionMode;
          setConnectionSelectionMode(newMode);
          Logger.selection('切换', newMode ? '连接线选择模式' : '卡片选择模式', null);
          return;
        }
        
        // 在连接线选择模式下，通过Tab切换连接线
        if (connectionSelectionMode) {
          Logger.selection('通过Tab切换', '连接线', event.shiftKey ? '反向' : '正向');
          connections.selectNextConnection(event.shiftKey);
          return;
        }
        
        // 在卡片选择模式下，通过Tab切换卡片
        if (!event.ctrlKey && !event.altKey && !event.metaKey && !ui.tabPressed) {
          Logger.selection('通过Tab切换', '卡片', event.shiftKey ? '反向' : '正向');
          selectNextCardService(event.shiftKey);
        }
        return;
      }
      
      // 空格键状态跟踪
      if (event.code === 'Space' && !event.ctrlKey && !event.metaKey) {
        ui.setSpacePressed(true);
        return;
      }
      
      // 如果在连线模式下，使用方向键选择目标卡片
      if (connections.connectionMode) {
        // 在连线模式下，方向键用于选择目标卡片
        if (event.key === keyBindings.moveUp || event.key === 'ArrowUp') {
          event.preventDefault();
          const sourceCardId = connections.connectionTargetCardId || 
            cards.selectedCardId || connections.connectionStart;
          if (sourceCardId) {
            const targetCardId = findNearestCardService(sourceCardId, 'up');
            if (targetCardId) connections.setConnectionTargetCardId(targetCardId);
          }
          return;
        }
        if (event.key === keyBindings.moveDown || event.key === 'ArrowDown') {
          event.preventDefault();
          const sourceCardId = connections.connectionTargetCardId || 
            cards.selectedCardId || connections.connectionStart;
          if (sourceCardId) {
            const targetCardId = findNearestCardService(sourceCardId, 'down');
            if (targetCardId) connections.setConnectionTargetCardId(targetCardId);
          }
          return;
        }
        if (event.key === keyBindings.moveLeft || event.key === 'ArrowLeft') {
          event.preventDefault();
          const sourceCardId = connections.connectionTargetCardId || 
            cards.selectedCardId || connections.connectionStart;
          if (sourceCardId) {
            const targetCardId = findNearestCardService(sourceCardId, 'left');
            if (targetCardId) connections.setConnectionTargetCardId(targetCardId);
          }
          return;
        }
        if (event.key === keyBindings.moveRight || event.key === 'ArrowRight') {
          event.preventDefault();
          const sourceCardId = connections.connectionTargetCardId || 
            cards.selectedCardId || connections.connectionStart;
          if (sourceCardId) {
            const targetCardId = findNearestCardService(sourceCardId, 'right');
            if (targetCardId) connections.setConnectionTargetCardId(targetCardId);
          }
          return;
        }
        
        // 在连线模式下按Enter确认连线
        if (event.key === 'Enter' && connections.connectionTargetCardId) {
          event.preventDefault();
          connections.completeConnection(connections.connectionTargetCardId);
          connections.setConnectionTargetCardId(null);
          return;
        }
        
        // 在连线模式下按Esc取消连线
        if (event.key === 'Escape') {
          event.preventDefault();
          connections.cancelConnectionMode();
          connections.setConnectionTargetCardId(null);
          return;
        }
      }
      
      // 在自由连线模式下按Esc退出
      // 使用从props传入的状态和函数
      if (event.key === 'Escape' && freeConnection.freeConnectionMode) {
        freeConnection.toggleFreeConnectionMode(false);
        return;
      }
      
      // Tab + 方向键选择卡片 (当Tab键被按住时)
      if (ui.tabPressed && cards.selectedCardId) {
        if (event.key === keyBindings.moveUp || event.key === 'ArrowUp') {
          event.preventDefault();
          selectNearestCardService('up');
          return;
        }
        if (event.key === keyBindings.moveDown || event.key === 'ArrowDown') {
          event.preventDefault();
          selectNearestCardService('down');
          return;
        }
        if (event.key === keyBindings.moveLeft || event.key === 'ArrowLeft') {
          event.preventDefault();
          selectNearestCardService('left');
          return;
        }
        if (event.key === keyBindings.moveRight || event.key === 'ArrowRight') {
          event.preventDefault();
          selectNearestCardService('right');
          return;
        }
      }
      
      // 显示快捷键设置
      if (event.key === keyBindings.showKeyBindings && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        ui.setShowKeyBindings(!ui.showKeyBindings);
        return;
      }
      
      // 提升新建卡片的优先级，即使在编辑状态也可以保存并创建新卡片 (Ctrl+D)
      if (event.key.toLowerCase() === keyBindings.newCard.toLowerCase() && 
          (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (cards.editingCardId) {
          cards.setEditingCardId(null); // 先保存当前编辑
        }
        const mapSize = ui.getMapSize();
        cards.createCard(mapSize, ui.viewportInfo);
        return;
      }
      
      // Ctrl + 方向键创建连接卡片
      if ((event.ctrlKey || event.metaKey) && cards.selectedCardId && 
          !ui.tabPressed && !event.shiftKey) {
        const selectedCard = cards.cards.find(card => card.id === cards.selectedCardId);
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
      if (cards.editingCardId || connections.editingConnectionId) {
        if (event.key === 'Escape') {
          if (cards.editingCardId) {
            cards.setEditingCardId(null);
          }
          if (connections.editingConnectionId) {
            connections.setEditingConnectionId(null);
          }
        }
        return;
      }

      // 修改处理连接线和卡片编辑的 Enter 键逻辑
      if (event.key === 'Enter') {
        // 如果有选中的连接线，进入连接线编辑模式
        if (connections.selectedConnectionIds.length === 1) {
          event.preventDefault();
          Logger.selection('开始编辑', '连接线', connections.selectedConnectionIds[0]);
          connections.setEditingConnectionId(connections.selectedConnectionIds[0]);
          return;
        }
        
        // 否则，如果有选中的卡片，进入卡片编辑模式
        if (cards.selectedCardId) {
          event.preventDefault();
          Logger.selection('开始编辑', '卡片', cards.selectedCardId);
          cards.setEditingCardId(cards.selectedCardId);
          return;
        }
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
          if (cards.selectedCardId) {
            event.preventDefault(); // 阻止默认事件
            Logger.selection('开始编辑', '卡片', cards.selectedCardId);
            cards.setEditingCardId(cards.selectedCardId);
          }
          break;
          
        case 'Escape': // 退出编辑模式或连线模式
          if (cards.editingCardId) {
            Logger.selection('结束编辑', '卡片', cards.editingCardId);
            cards.setEditingCardId(null);
          } else if (connections.connectionMode) {
            Logger.selection('取消', '连线模式', null);
            connections.cancelConnectionMode();
          } else {
            // 同时取消卡片和连接线的选择
            if (cards.selectedCardId) {
              Logger.selection('取消选择', '卡片', cards.selectedCardId);
              cards.setSelectedCardId(null);
            }
            // 如果有选中的连接线，取消选择
            if (connections.selectedConnectionIds.length > 0) {
              Logger.selection('取消选择', '连接线', connections.selectedConnectionIds);
              connections.clearConnectionSelection();
            }
          }
          break;
          
        case keyBindings.deleteCards: // 删除选中的卡片或连线
        case 'Backspace':
          deleteSelectedElementsService();
          break;
          
        // 开始连线模式 - 修改为组合键 (Ctrl+I)
        case keyBindings.startConnection.toLowerCase():
          if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
            // 避免与复制冲突，检查是否没有选中的卡片
            if (cards.selectedCardId && !connections.connectionMode) {
              event.preventDefault(); // 阻止复制操作
              connections.startConnectionMode(cards.selectedCardId);
            }
            return;
          }
          break;
          
        case keyBindings.nextCard: // 在卡片之间切换
          if (cards.cards.length > 0) {
            Logger.selection('切换', '卡片', event.shiftKey ? '反向' : '正向');
            selectNextCardService(event.shiftKey);
          }
          break;
          
        // 移动卡片 - 只有在不在连线模式下才移动卡片
        case keyBindings.moveUp:
        case 'ArrowUp':
          if (!connections.connectionMode && cards.selectedCardId && 
              (event.key === keyBindings.moveUp || event.key === 'ArrowUp')) {
            event.preventDefault(); // 防止页面滚动
            startContinuousMove(0, -1, event.shiftKey);
          }
          break;
        case keyBindings.moveDown:
        case 'ArrowDown':
          if (!connections.connectionMode && cards.selectedCardId && 
              (event.key === keyBindings.moveDown || event.key === 'ArrowDown')) {
            event.preventDefault();
            startContinuousMove(0, 1, event.shiftKey);
          }
          break;
        case keyBindings.moveLeft:
        case 'ArrowLeft':
          if (!connections.connectionMode && cards.selectedCardId && 
              (event.key === keyBindings.moveLeft || event.key === 'ArrowLeft')) {
            event.preventDefault();
            startContinuousMove(-1, 0, event.shiftKey);
          }
          break;
        case keyBindings.moveRight:
        case 'ArrowRight':
          if (!connections.connectionMode && cards.selectedCardId && 
              (event.key === keyBindings.moveRight || event.key === 'ArrowRight')) {
            event.preventDefault();
            startContinuousMove(1, 0, event.shiftKey);
          }
          break;
          
        // 缩放
        case keyBindings.zoomIn:
          if (event.ctrlKey || event.metaKey) {
            ui.handleZoomIn();
          }
          break;
        case keyBindings.zoomOut:
          if (event.ctrlKey || event.metaKey) {
            ui.handleZoomOut();
          }
          break;
        
        // 其他辅助按键
        case keyBindings.resetView: // 空格开始平移模式
          if (event.ctrlKey || event.metaKey) {
            ui.resetView();
          }
          break;

        case keyBindings.selectAll: // 全选
          if ((event.ctrlKey || event.metaKey) && !connectionSelectionMode) {
            event.preventDefault();
            const allCardIds = cards.cards.map(card => card.id);
            Logger.selection('全选', '卡片', allCardIds);
            cards.selectCards(allCardIds);
          }
          break;
      }
    };
    
    // 添加按键抬起事件处理
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        ui.setTabPressed(false);
      }
      
      if (event.code === 'Space') {
        ui.setSpacePressed(false);
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
    // 依赖数组
    cards.selectedCardId,
    cards.selectedCardIds,
    cards.editingCardId,
    cards.cards,
    connections.connectionMode,
    connections.connectionStart,
    connections.connectionTargetCardId,
    connections.editingConnectionId,
    connections.selectedConnectionIds,
    ui.tabPressed,
    ui.spacePressed,
    ui.showKeyBindings,
    keyBindings,
    connectionSelectionMode,
    freeConnection.freeConnectionMode,
  ]);
  
  return null; // 这是一个行为组件，不渲染任何UI
};

export default MindMapKeyboardHandler;