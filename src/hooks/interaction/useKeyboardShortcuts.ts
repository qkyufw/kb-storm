import { useEffect, useState } from 'react';
import { IKeyBindings } from '../../types/CoreTypes';
import { saveKeyBindings, loadKeyBindings } from '../../utils/storageUtils';

// 默认快捷键配置
const DEFAULT_KEY_BINDINGS: IKeyBindings = {
  // 将新建卡片改为 Alt+Enter
  newCard: 'Alt+Enter',
  editCard: 'Enter',
  deleteCards: 'Delete',
  // 将开始连线
  startConnection: 'i',
  nextCard: 'Tab',
  prevCard: 'Tab', // 与 nextCard 相同，但需要配合 Shift 使用
  moveUp: 'ArrowUp',
  moveDown: 'ArrowDown',
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  zoomIn: 'Ctrl++',
  zoomOut: 'Ctrl+-',
  resetView: 'Ctrl+0',
  save: 'Ctrl+s',
  load: 'Ctrl+o',
  showKeyBindings: 'Ctrl+k',
  selectAll: 'Ctrl+a',
  copy: 'Ctrl+c',
  cut: 'Ctrl+x',
  paste: 'Ctrl+v',
  undo: 'Ctrl+z',
  redo: 'Ctrl+Shift+z'
};

/**
 * 升级旧的快捷键配置到新的组合键格式
 */
const upgradeKeyBindings = (oldBindings: IKeyBindings): IKeyBindings => {
  const upgraded = { ...oldBindings };

  // 检查并升级需要 Ctrl 修饰键的快捷键
  const needsCtrlUpgrade = [
    'selectAll', 'copy', 'cut', 'paste', 'undo', 'redo',
    'zoomIn', 'zoomOut', 'resetView', 'showKeyBindings', 'save', 'load'
  ] as const;

  needsCtrlUpgrade.forEach(key => {
    const value = upgraded[key];
    if (value && !value.includes('Ctrl') && !value.includes('Alt') && !value.includes('Shift')) {
      // 如果是单键，升级为 Ctrl+键
      upgraded[key] = `Ctrl+${value}`;
    }
  });

  // 特殊处理一些键
  if (upgraded.newCard === 'd') {
    upgraded.newCard = 'Alt+Enter';
  }

  // 升级旧的重做快捷键从 Ctrl+y 到 Ctrl+Shift+z
  if (upgraded.redo === 'Ctrl+y' || upgraded.redo === 'y') {
    upgraded.redo = 'Ctrl+Shift+z';
  }

  return upgraded;
};

/**
 * 自定义键绑定钩子
 */
export const useKeyBindings = () => {
  // 加载保存的键绑定，如果没有则使用默认值
  const [keyBindings, setKeyBindings] = useState<IKeyBindings>(() => {
    const saved = loadKeyBindings();
    if (saved) {
      // 升级旧的配置格式
      const upgraded = upgradeKeyBindings(saved);
      // 如果升级后的配置与原配置不同，保存升级后的配置
      if (JSON.stringify(upgraded) !== JSON.stringify(saved)) {
        saveKeyBindings(upgraded);
      }
      return upgraded;
    }
    return DEFAULT_KEY_BINDINGS;
  });

  // 添加事件监听器来响应快捷键更新
  useEffect(() => {
    const handleKeyBindingsUpdate = () => {
      const saved = loadKeyBindings();
      if (saved) {
        setKeyBindings(saved);
      }
    };
    
    window.addEventListener('keybindingsUpdated', handleKeyBindingsUpdate);
    return () => {
      window.removeEventListener('keybindingsUpdated', handleKeyBindingsUpdate);
    };
  }, []);

  // 更新键绑定
  const updateKeyBindings = (newBindings: IKeyBindings) => {
    // 对于特定的固定快捷键，始终使用默认值
    const mergedBindings = {
      ...newBindings,
      // 这些是我们希望固定的快捷键
      editCard: DEFAULT_KEY_BINDINGS.editCard,
      nextCard: DEFAULT_KEY_BINDINGS.nextCard,
      prevCard: DEFAULT_KEY_BINDINGS.prevCard,
      moveUp: DEFAULT_KEY_BINDINGS.moveUp,
      moveDown: DEFAULT_KEY_BINDINGS.moveDown,
      moveLeft: DEFAULT_KEY_BINDINGS.moveLeft,
      moveRight: DEFAULT_KEY_BINDINGS.moveRight,
      // 将连线快捷键改为组合键形式，但在存储中仍使用单键
      startConnection: newBindings.startConnection || DEFAULT_KEY_BINDINGS.startConnection
    };
    
    setKeyBindings(mergedBindings);
    saveKeyBindings(mergedBindings);
  };

  return { keyBindings, updateKeyBindings };
};

export default useKeyBindings;
