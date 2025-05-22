import { KeyboardEventContext, KeyHandlerResult, KeyboardHandler } from '../../../types/KeyboardTypes';
import { useCardStore } from '../../../store/cardStore';
import { useConnectionStore } from '../../../store/connectionStore';
import { useFreeConnectionStore } from '../../../store/freeConnectionStore';
import { findNearestCardService } from '../../../utils/interactions';
import { createConnectedCardFunction } from '../../../utils/interactions/cardInteractions';
import { Logger } from '../../../utils/log';

/**
 * 连接线操作键盘处理器 - 处理连接线创建、选择、编辑等操作
 */
export class ConnectionKeyHandler implements KeyboardHandler {
  priority = 20; // 高优先级
  
  handleKeyDown(event: KeyboardEvent, context: KeyboardEventContext): KeyHandlerResult {
    const { keyBindings, ctrlOrMeta, isEditing, tabPressed, ui } = context;
    const key = event.key.toLowerCase();
    
    const cards = useCardStore.getState();
    const connections = useConnectionStore.getState();
    const freeConnection = useFreeConnectionStore.getState();

    // 如果正在编辑，不处理
    if (isEditing) {
      return { handled: false };
    }

    // 处理连接线选择模式下的Tab键，用于切换箭头类型
    // 必须在最上面处理Tab键，避免被其他条件拦截
    if (event.key === 'Tab' && ui.interactionMode === 'connectionSelection') {
      event.preventDefault();
      
      // 如果有选中的连接线，则循环切换其箭头类型
      if (connections.selectedConnectionIds.length > 0) {
        console.log('切换箭头类型', connections.selectedConnectionIds[0]);
        // 只对第一个选中的连接线进行操作
        connections.cycleArrowType(connections.selectedConnectionIds[0]);
        return { handled: true };
      }
    }
    
    // 处理ESC键退出连线模式
    if (key === 'escape') {
      if (connections.connectionMode) {
        Logger.selection('取消', '连线模式', null);
        connections.cancelConnectionMode();
        connections.setConnectionTargetCardId(null);
        return { handled: true };
      }
      
      // 在自由连线模式下按Esc退出
      if (freeConnection.freeConnectionMode) {
        freeConnection.toggleFreeConnectionMode(false);
        return { handled: true };
      }
      
      if (connections.editingConnectionId) {
        connections.setEditingConnectionId(null);
        return { handled: true };
      }
    }
    
    // 处理Enter键编辑连接线标签
    if (key === 'enter' && !ctrlOrMeta) {
      if (connections.selectedConnectionIds.length === 1) {
        event.preventDefault();
        Logger.selection('开始编辑', '连接线', connections.selectedConnectionIds[0]);
        connections.setEditingConnectionId(connections.selectedConnectionIds[0]);
        return { handled: true };
      }
    }
    
    // 开始连线模式 - Ctrl+I
    if (key === keyBindings.startConnection.toLowerCase() && ctrlOrMeta) {
      if (cards.selectedCardId && !connections.connectionMode) {
        event.preventDefault();
        connections.startConnectionMode(cards.selectedCardId);
        return { handled: true };
      }
    }
    
    // 在连线模式下按Enter确认连线
    if (key === 'enter' && connections.connectionMode && connections.connectionTargetCardId) {
      event.preventDefault();
      connections.completeConnection(connections.connectionTargetCardId);
      connections.setConnectionTargetCardId(null);
      return { handled: true };
    }
    
    // 在连线模式下使用方向键选择目标卡片
    if (connections.connectionMode) {
      const sourceCardId = connections.connectionTargetCardId || 
        cards.selectedCardId || connections.connectionStart;
        
      if (sourceCardId) {
        let direction: 'up' | 'down' | 'left' | 'right' | null = null;
        
        switch (key) {
          case keyBindings.moveUp.toLowerCase():
          case 'arrowup':
            direction = 'up';
            break;
          case keyBindings.moveDown.toLowerCase():
          case 'arrowdown':
            direction = 'down';
            break;
          case keyBindings.moveLeft.toLowerCase():
          case 'arrowleft':
            direction = 'left';
            break;
          case keyBindings.moveRight.toLowerCase():
          case 'arrowright':
            direction = 'right';
            break;
        }
        
        if (direction) {
          event.preventDefault();
          const targetCardId = findNearestCardService(sourceCardId, direction);
          if (targetCardId) connections.setConnectionTargetCardId(targetCardId);
          return { handled: true };
        }
      }
    }
    
    // Ctrl + 方向键创建连接卡片
    if (ctrlOrMeta && cards.selectedCardId && !event.shiftKey && !tabPressed) {
      const selectedCard = cards.cards.find(card => card.id === cards.selectedCardId);
      
      if (!selectedCard) return { handled: false };
      
      const createConnectedCard = createConnectedCardFunction(
        cards.cards,
        connections.connections,
        cards.selectedCardId,
        cards.createCardAtPosition,
        connections.setConnectionsData
      );
      
      let direction: 'up' | 'down' | 'left' | 'right' | null = null;
      
      switch (key) {
        case keyBindings.moveUp.toLowerCase():
        case 'arrowup':
          direction = 'up';
          break;
        case keyBindings.moveDown.toLowerCase():
        case 'arrowdown':
          direction = 'down';
          break;
        case keyBindings.moveLeft.toLowerCase():
        case 'arrowleft':
          direction = 'left';
          break;
        case keyBindings.moveRight.toLowerCase():
        case 'arrowright':
          direction = 'right';
          break;
      }
      
      if (direction) {
        event.preventDefault();
        createConnectedCard(direction);
        return { handled: true };
      }
    }
    
    return { handled: false };
  }
}
