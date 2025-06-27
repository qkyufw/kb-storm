import { KeyboardEventContext, KeyHandlerResult, KeyboardHandler } from '../../../types/KeyboardTypes';
import { useClipboardStore } from '../../../store/clipboardStore';
import { useHistoryStore } from '../../../store/historyStore';
import { pasteClipboardService } from '../../../utils/interactions';
import { Logger } from '../../../utils/log';
import { matchesKeyBinding } from '../../../utils/storageUtils';

/**
 * 编辑操作键盘处理器 - 处理复制、剪切、粘贴、撤销、重做等操作
 */
export class EditKeyHandler implements KeyboardHandler {
  priority = 10; // 高优先级
  
  handleKeyDown(event: KeyboardEvent, context: KeyboardEventContext): KeyHandlerResult {
    const { keyBindings, isEditing } = context;
    
    // 如果正在编辑，不处理快捷键
    if (isEditing) {
      return { handled: false };
    }
    
    // 处理撤销/重做
    if (matchesKeyBinding(event, keyBindings.undo)) {
      event.preventDefault();
      const history = useHistoryStore.getState();
      Logger.selection('执行', '撤销', null);
      history.undo();
      return { handled: true };
    }

    if (matchesKeyBinding(event, keyBindings.redo)) {
      event.preventDefault();
      const history = useHistoryStore.getState();
      Logger.selection('执行', '重做', null);
      history.redo();
      return { handled: true };
    }
    
    // 复制、剪切、粘贴等编辑操作
    const clipboard = useClipboardStore.getState();

    if (matchesKeyBinding(event, keyBindings.copy)) {
      event.preventDefault();
      Logger.selection('执行', '复制', null);
      clipboard.handleCopy();
      return { handled: true };
    }

    if (matchesKeyBinding(event, keyBindings.cut)) {
      event.preventDefault();
      Logger.selection('执行', '剪切', null);
      clipboard.handleCut();
      return { handled: true };
    }

    if (matchesKeyBinding(event, keyBindings.paste)) {
      event.preventDefault();
      Logger.selection('执行', '粘贴', null);
      pasteClipboardService();
      return { handled: true };
    }
    
    return { handled: false };
  }
}
