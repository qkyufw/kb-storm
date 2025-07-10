import { useEffect, useMemo, useRef, useCallback } from 'react';
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
import { matchesKeyBinding } from '../../utils/storageUtils';

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

  // 缓存上下文对象的基础部分，减少重复创建
  const baseContext = useMemo(() => ({
    keyBindings,
    cards,
    connections,
    ui
  }), [keyBindings, cards, connections, ui]);

  // 缓存常用的计算结果
  const isEditingRef = useRef<boolean>(false);
  const lastEditingState = useRef<{ cardId: string | null; connectionId: string | null }>({
    cardId: null,
    connectionId: null
  });

  // 优化的isEditing计算函数
  const getIsEditing = useCallback(() => {
    const currentCardId = cards.editingCardId;
    const currentConnectionId = connections.editingConnectionId;

    // 只有当状态真正改变时才重新计算
    if (lastEditingState.current.cardId !== currentCardId ||
        lastEditingState.current.connectionId !== currentConnectionId) {
      lastEditingState.current = { cardId: currentCardId, connectionId: currentConnectionId };
      isEditingRef.current = currentCardId !== null || currentConnectionId !== null;
    }

    return isEditingRef.current;
  }, [cards.editingCardId, connections.editingConnectionId]);
  
  // 设置键盘事件监听
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase() || '';
      const ctrlOrMetaPressed = e.ctrlKey || e.metaKey;
      
      // 首先检查 Ctrl+Space 组合键
      if (ctrlOrMetaPressed && e.code === 'Space') {
        console.log("[KeyboardManager] 检测到 Ctrl+Space");
        
        // 创建上下文并直接调用ViewKeyHandler - 优化：复用基础上下文
        const context: KeyboardEventContext = {
          ...baseContext,
          event: e,
          isEditing: getIsEditing(),
          ctrlOrMeta: true,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          tabPressed: ui.tabPressed,
          spacePressed: false  // 关键：设为false，避免被视为平移操作
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
      const isNewCardShortcut = matchesKeyBinding(e, keyBindings.newCard);
      
      // 检查是否在输入框中
      const isInInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;

      // 如果在输入框中，仅处理特定的快捷键，其他按键让浏览器正常处理
      if (isInInput) {
        // 允许ESC和Ctrl+Enter通过以退出编辑模式
        const isExitEditShortcut = key === 'escape' || (key === 'enter' && ctrlOrMetaPressed);

        if (!(isNewCardShortcut || isExitEditShortcut)) {
          return; // 浏览器正常处理输入框中的按键
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
      
      // 创建上下文环境 - 优化：复用基础上下文，只更新变化的部分
      const context: KeyboardEventContext = {
        ...baseContext,
        event: e,
        isEditing: getIsEditing(),
        ctrlOrMeta: ctrlOrMetaPressed,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        tabPressed: ui.tabPressed,
        spacePressed: ui.spacePressed
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
      
      // 创建上下文环境 - 优化：复用基础上下文，只更新变化的部分
      const context: KeyboardEventContext = {
        ...baseContext,
        event: e,
        isEditing: getIsEditing(),
        ctrlOrMeta: e.ctrlKey || e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
        tabPressed: ui.tabPressed,
        spacePressed: ui.spacePressed
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
