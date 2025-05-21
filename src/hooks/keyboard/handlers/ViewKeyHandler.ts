import { KeyboardEventContext, KeyHandlerResult, KeyboardHandler } from '../../../types/KeyboardTypes';
import { useUIStore } from '../../../store/UIStore';
import { Logger } from '../../../utils/log';

/**
 * 视图控制键盘处理器 - 处理缩放、平移、重置视图等操作
 */
export class ViewKeyHandler implements KeyboardHandler {
  priority = 30; // 中高优先级
  
  handleKeyDown(event: KeyboardEvent, context: KeyboardEventContext): KeyHandlerResult {
    const { keyBindings, ctrlOrMeta, isEditing } = context;
    const key = event.key.toLowerCase();
    
    // 如果正在编辑，不处理
    if (isEditing) {
      return { handled: false };
    }
    
    const ui = useUIStore.getState();
    
    // 处理缩放操作
    if (ctrlOrMeta) {
      if (key === keyBindings.zoomIn.toLowerCase()) {
        event.preventDefault();
        ui.handleZoomIn();
        return { handled: true };
      }
      
      if (key === keyBindings.zoomOut.toLowerCase()) {
        event.preventDefault();
        ui.handleZoomOut();
        return { handled: true };
      }
      
      // 重置视图 - 使用Ctrl+0
      if (key === '0') {
        event.preventDefault();
        ui.resetView();
        return { handled: true };
      }
      
      // 显示快捷键设置
      if (key === keyBindings.showKeyBindings.toLowerCase()) {
        event.preventDefault();
        ui.setShowKeyBindings(!ui.showKeyBindings);
        return { handled: true };
      }
    }
    
    return { handled: false };
  }
}
