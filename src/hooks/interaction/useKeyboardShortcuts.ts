import { useState } from 'react';
import { IKeyBindings } from '../../types/CoreTypes';
import { saveKeyBindings, loadKeyBindings } from '../../utils/storageUtils';

// 默认快捷键配置
const DEFAULT_KEY_BINDINGS: IKeyBindings = {
  // 将新建卡片
  newCard: 'd', 
  editCard: 'Enter',
  deleteCard: 'Delete',
  // 将开始连线
  startConnection: 'i', 
  nextCard: 'Tab',
  prevCard: 'Tab', // 与 nextCard 相同，但需要配合 Shift 使用
  moveUp: 'ArrowUp',
  moveDown: 'ArrowDown',
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  zoomIn: '+',
  zoomOut: '-',
  resetView: ' ',
  save: 's',
  load: 'o',
  help: '?',
  showKeyBindings: 'k',
  selectAll: 'a',
  copy: 'c',
  cut: 'x',
  paste: 'v',
  undo: 'z',
  redo: 'y'
};

/**
 * 自定义键绑定钩子
 */
export const useKeyBindings = () => {
  // 加载保存的键绑定，如果没有则使用默认值
  const [keyBindings, setKeyBindings] = useState<IKeyBindings>(() => {
    const saved = loadKeyBindings();
    return saved || DEFAULT_KEY_BINDINGS;
  });

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
