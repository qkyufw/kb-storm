import { useEffect, useMemo } from 'react';
import { CardKeyHandler } from './handlers/CardKeyHandler';
import { ConnectionKeyHandler } from './handlers/ConnectionKeyHandler';
import { NavigationKeyHandler } from './handlers/NavigationKeyHandler';
import { EditKeyHandler } from './handlers/EditKeyHandler';
import { ViewKeyHandler } from './handlers/ViewKeyHandler';
import { KeyboardHandler, KeyboardEventContext } from '../../types/KeyboardTypes';
import { useCardStore } from '../../store/cardStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useUIStore } from '../../store/UIStore';
import { useKeyBindings } from '../interaction/useKeyboardShortcuts';

/**
 * 键盘管理器 Hook - 协调各个专用处理器
 */
export const useKeyboardManager = () => {
  // 获取必要的状态
  const cards = useCardStore();
  const connections = useConnectionStore();
  const ui = useUIStore();
  const { keyBindings } = useKeyBindings();
  
  // 创建各种处理器实例
  const handlers: KeyboardHandler[] = useMemo(() => [
    new NavigationKeyHandler(),
    new CardKeyHandler(),
    new ConnectionKeyHandler(),
    new EditKeyHandler(),
    new ViewKeyHandler(),
  ].sort((a, b) => a.priority - b.priority), [keyBindings]); // 关键：依赖 keyBindings
  
  // 设置键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const ctrlOrMetaPressed = e.ctrlKey || e.metaKey;
      
      // 首先检查 Ctrl+Space 组合键
      if (ctrlOrMetaPressed && e.code === 'Space') {
        console.log("[KeyboardManager] 检测到 Ctrl+Space");
        
        // 创建上下文并直接调用ViewKeyHandler
        const context: KeyboardEventContext = {
          event: e,
          isEditing: cards.editingCardId !== null || connections.editingConnectionId !== null,
          keyBindings,
          ctrlOrMeta: true,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          tabPressed: ui.tabPressed,
          spacePressed: false,  // 关键：设为false，避免被视为平移操作
          cards,
          connections,
          ui
        };
        
        // 直接使用ViewKeyHandler处理
        const viewHandler = new ViewKeyHandler();
        const result = viewHandler.handleKeyDown(e, context);
        
        if (result.handled) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
      
      // Check if the current key event matches the newCard shortcut
      const isNewCardShortcut = (key === keyBindings.newCard.toLowerCase() && ctrlOrMetaPressed);
      
      // 检查是否在输入框中
      const isInInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      
      // 如果在输入框中，仅处理退出编辑的快捷键和新建卡片快捷键
      if (isInInput) {
        // 允许ESC和Ctrl+Enter通过以退出编辑模式
        const isExitEditShortcut = key === 'escape' || (key === 'enter' && ctrlOrMetaPressed);
        
        // 只有这些特殊快捷键可以通过
        if (!isNewCardShortcut && !isExitEditShortcut) {
          return;
        }
      }
      
      // 特殊处理Tab键
      if (e.key === 'Tab') {
        ui.setTabPressed(true);
      }
      
      // 特殊处理空格键 - 修改为不在Ctrl+空格时设置spacePressed
      if (e.code === 'Space' && !ctrlOrMetaPressed) {
        ui.setSpacePressed(true);
      }
      
      // 创建上下文环境
      const context: KeyboardEventContext = {
        event: e,
        isEditing: cards.editingCardId !== null || connections.editingConnectionId !== null,
        keyBindings,
        ctrlOrMeta: ctrlOrMetaPressed,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        tabPressed: ui.tabPressed,
        spacePressed: ui.spacePressed,
        cards,
        connections,
        ui
      };
      
      // 将事件传递给所有处理器，直到有一个处理器返回true（表示已处理）
      for (const handler of handlers) {
        const result = handler.handleKeyDown(e, context);
        if (result.handled) {
          // 事件已被处理，阻止浏览器默认行为
          e.preventDefault();
          break;
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Tab键释放
      if (e.key === 'Tab') {
        ui.setTabPressed(false);
      }
      
      // 空格键释放
      if (e.code === 'Space') { // Use e.code for physical key 'Space'
        ui.setSpacePressed(false);
      }
      
      // 如果正在移动，则清除移动间隔定时器
      if (ui.moveInterval && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        clearInterval(ui.moveInterval);
        ui.setMoveInterval(null);
      }
      
      // 创建上下文环境
      const context: KeyboardEventContext = {
        event: e,
        isEditing: cards.editingCardId !== null || connections.editingConnectionId !== null,
        keyBindings,
        ctrlOrMeta: e.ctrlKey || e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        tabPressed: ui.tabPressed,
        spacePressed: ui.spacePressed,
        cards,
        connections,
        ui
      };
      
      // 调用处理器的handleKeyUp方法（如果存在）
      for (const handler of handlers) {
        if (handler.handleKeyUp) {
          const result = handler.handleKeyUp(e, context);
          if (result.handled) {
            e.preventDefault();
            break;
          }
        }
      }
    };
    
    // 添加事件监听器
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [cards, connections, ui, handlers, keyBindings]);
};

export default useKeyboardManager;
