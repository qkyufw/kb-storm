import { KeyboardEventContext, KeyHandlerResult, KeyboardHandler } from '../../../types/KeyboardTypes';
import { useClipboardStore } from '../../../store/clipboardStore';
import { useHistoryStore } from '../../../store/historyStore';
import { pasteClipboardService } from '../../../services/MindMapService';
import { Logger } from '../../../utils/log';

/**
 * 编辑操作键盘处理器 - 处理复制、剪切、粘贴、撤销、重做等操作
 */
export class EditKeyHandler implements KeyboardHandler {
  priority = 10; // 高优先级
  
  handleKeyDown(event: KeyboardEvent, context: KeyboardEventContext): KeyHandlerResult {
    const { keyBindings, ctrlOrMeta, isEditing } = context;
    
    // 如果正在编辑，不处理快捷键
    if (isEditing) {
      return { handled: false };
    }
    
    // 处理撤销/重做
    if (event.key.toLowerCase() === 'z' && ctrlOrMeta) {
      event.preventDefault();
      const history = useHistoryStore.getState();
      
      if (event.shiftKey) {
        Logger.selection('执行', '重做', null);
        history.redo();
      } else {
        Logger.selection('执行', '撤销', null);
        history.undo();
      }
      return { handled: true };
    }
    
    // 复制、剪切、粘贴等编辑操作
    if (ctrlOrMeta) {
      const clipboard = useClipboardStore.getState();
      
      switch (event.key.toLowerCase()) {
        case keyBindings.copy:
          event.preventDefault();
          Logger.selection('执行', '复制', null);
          clipboard.handleCopy();
          return { handled: true };
          
        case keyBindings.cut:
          event.preventDefault();
          Logger.selection('执行', '剪切', null);
          clipboard.handleCut();
          return { handled: true };
          
        case keyBindings.paste:
          event.preventDefault();
          Logger.selection('执行', '粘贴', null);
          pasteClipboardService();
          return { handled: true };
          
        case keyBindings.selectAll:
          // 全选处理将留给CardKeyHandler
          return { handled: false };
      }
    }
    
    return { handled: false };
  }
}
