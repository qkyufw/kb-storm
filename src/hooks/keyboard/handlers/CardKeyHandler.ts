import { KeyboardEventContext, KeyHandlerResult, KeyboardHandler } from '../../../types/KeyboardTypes';
import { useCardStore } from '../../../store/cardStore';
import { useConnectionStore } from '../../../store/connectionStore';
import { useUIStore } from '../../../store/UIStore';
import { deleteSelectedElementsService, createCardService } from '../../../utils/interactions';
import { createCardMovementHandlers } from '../../../utils/interactions/cardInteractions';
import { Logger } from '../../../utils/log';
import { matchesKeyBinding } from '../../../utils/storageUtils';

/**
 * 卡片操作键盘处理器 - 处理卡片创建、编辑、移动、删除等操作
 */
export class CardKeyHandler implements KeyboardHandler {
  priority = 50; // 中低优先级
  private moveInterval: NodeJS.Timeout | null = null;
  
  handleKeyDown(event: KeyboardEvent, context: KeyboardEventContext): KeyHandlerResult {
    const { keyBindings, ctrlOrMeta, isEditing } = context;
    const key = event.key.toLowerCase();
    
    const cards = useCardStore.getState();
    const connections = useConnectionStore.getState();
    const ui = useUIStore.getState();
    const { interactionMode } = ui;
    
    // 如果是Enter键且有选中的卡片，进入编辑模式
    if (key === 'enter' && !isEditing && !ctrlOrMeta && !connections.connectionMode) {
      if (cards.selectedCardId) {
        event.preventDefault();
        Logger.selection('开始编辑', '卡片', cards.selectedCardId);
        cards.setEditingCardId(cards.selectedCardId);
        return { handled: true };
      }
    }
    
    // 处理ESC键退出编辑模式
    if (key === 'escape' && cards.editingCardId) {
      Logger.selection('结束编辑', '卡片', cards.editingCardId);
      cards.setEditingCardId(null);
      return { handled: true };
    }
    
    // 新建卡片 - 支持组合键
    if (matchesKeyBinding(event, keyBindings.newCard)) {
      event.preventDefault();

      // 如果正在编辑，先保存
      if (cards.editingCardId) {
        cards.setEditingCardId(null);
      }

      createCardService();
      return { handled: true };
    }
    
    // 删除操作
    if (key === keyBindings.deleteCards.toLowerCase() || key === 'backspace') {
      if (!isEditing) {
        deleteSelectedElementsService();
        return { handled: true };
      }
    }
    
    // 全选操作
    if (matchesKeyBinding(event, keyBindings.selectAll)) {
      event.preventDefault();
      const allCardIds = cards.cards.map(card => card.id);
      Logger.selection('全选', '卡片', allCardIds);
      cards.selectCards(allCardIds);
      return { handled: true };
    }
    
    // 卡片移动 - 方向键 - 仅在卡片移动模式或者按住Shift键时处理
    if (!isEditing && !connections.connectionMode && 
        cards.selectedCardId && 
        (interactionMode === 'cardMovement' || event.shiftKey)) {
      
      const moveHandler = createCardMovementHandlers(
        cards.selectedCardId,
        cards.moveCard,
        (interval) => {
          this.moveInterval = interval;
          ui.setMoveInterval(interval);
        }
      );
      
      const isShiftPressed = event.shiftKey;
      
      switch (key) {
        case keyBindings.moveUp.toLowerCase():
          event.preventDefault();
          moveHandler.startContinuousMove(0, -1, isShiftPressed);
          return { handled: true };

        case keyBindings.moveDown.toLowerCase():
          event.preventDefault();
          moveHandler.startContinuousMove(0, 1, isShiftPressed);
          return { handled: true };

        case keyBindings.moveLeft.toLowerCase():
          event.preventDefault();
          moveHandler.startContinuousMove(-1, 0, isShiftPressed);
          return { handled: true };

        case keyBindings.moveRight.toLowerCase():
          event.preventDefault();
          moveHandler.startContinuousMove(1, 0, isShiftPressed);
          return { handled: true };
      }
    }
    
    return { handled: false };
  }
  
  handleKeyUp(event: KeyboardEvent, context: KeyboardEventContext): KeyHandlerResult {
    // 方向键释放，停止移动
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(event.key.toLowerCase())) {
      if (this.moveInterval) {
        clearInterval(this.moveInterval);
        this.moveInterval = null;
        useUIStore.getState().setMoveInterval(null);
      }
      return { handled: true };
    }
    
    return { handled: false };
  }
}
