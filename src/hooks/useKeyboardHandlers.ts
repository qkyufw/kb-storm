import { useEffect, useCallback } from 'react';
import { IKeyBindings } from '../types';

// 为不同类型的键盘事件处理提供更小的组合式钩子
export const useKeyboardHandlers = (
  keyBindings: IKeyBindings,
  handlers: {
    onHelp?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onNewCard?: () => void;
    onSave?: () => void;
    onLoad?: () => void;
    // ...可以添加更多处理函数
  }
) => {
  // 基本键盘事件处理器
  const handleBasicKeyEvents = useCallback((event: KeyboardEvent) => {
    // 帮助
    if (event.key === keyBindings.help && handlers.onHelp) {
      handlers.onHelp();
      return true;
    }
    
    // 撤销/重做
    if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
      if (event.shiftKey && handlers.onRedo) {
        event.preventDefault();
        handlers.onRedo();
        return true;
      } else if (handlers.onUndo) {
        event.preventDefault();
        handlers.onUndo();
        return true;
      }
    }
    
    // 保存/加载
    if ((event.ctrlKey || event.metaKey)) {
      if (event.key === keyBindings.save && handlers.onSave) {
        event.preventDefault();
        handlers.onSave();
        return true;
      } else if (event.key === keyBindings.load && handlers.onLoad) {
        event.preventDefault();
        handlers.onLoad();
        return true;
      }
    }
    
    return false;
  }, [keyBindings, handlers]);
  
  return {
    handleBasicKeyEvents
  };
};

export default useKeyboardHandlers;
