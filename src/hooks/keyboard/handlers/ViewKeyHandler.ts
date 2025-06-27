import { KeyboardEventContext, KeyHandlerResult, KeyboardHandler } from '../../../types/KeyboardTypes';
import { useUIStore } from '../../../store/UIStore';
import { matchesKeyBinding } from '../../../utils/storageUtils';

/**
 * 视图控制键盘处理器 - 处理缩放、平移、重置视图等操作
 */
export class ViewKeyHandler implements KeyboardHandler {
  priority = 30; // 中高优先级
  
  handleKeyDown(event: KeyboardEvent, context: KeyboardEventContext): KeyHandlerResult {
    const { keyBindings, isEditing } = context;

    // 如果正在编辑，不处理
    if (isEditing) {
      return { handled: false };
    }

    const ui = useUIStore.getState();

    // 处理缩放和视图操作
    if (matchesKeyBinding(event, keyBindings.zoomIn)) {
      event.preventDefault(); // 阻止浏览器默认缩放
      ui.handleZoomIn();
      return { handled: true };
    }

    if (matchesKeyBinding(event, keyBindings.zoomOut)) {
      event.preventDefault(); // 阻止浏览器默认缩放
      ui.handleZoomOut();
      return { handled: true };
    }

    if (matchesKeyBinding(event, keyBindings.resetView)) {
      event.preventDefault(); // 阻止浏览器默认行为
      ui.resetView();
      return { handled: true };
    }

    if (matchesKeyBinding(event, keyBindings.showKeyBindings)) {
      event.preventDefault();
      ui.setShowKeyBindings(!ui.showKeyBindings);
      return { handled: true };
    }

    return { handled: false };
  }
}
