// 快捷键管理Hook
import { useState, useEffect } from 'react';
import { IKeyBindings } from '../types';
import { loadKeyBindings, saveKeyBindings } from '../utils/storageUtils';

const DEFAULT_KEY_BINDINGS: IKeyBindings = {
  newCard: 'n',          // Ctrl + N
  editCard: 'Enter',
  deleteCard: 'Delete',
  startConnection: 'c',
  nextCard: 'Tab',
  prevCard: 'Tab',       // Shift + Tab
  moveUp: 'ArrowUp',
  moveDown: 'ArrowDown',
  moveLeft: 'ArrowLeft',
  moveRight: 'ArrowRight',
  zoomIn: '+',           // Ctrl + +
  zoomOut: '-',          // Ctrl + -
  resetView: ' ',        // Ctrl + Space
  save: 's',             // Ctrl + S
  load: 'o',             // Ctrl + O
  help: '?',
  showKeyBindings: 'k',  // Ctrl + K
  copy: 'c',             // Ctrl + C
  cut: 'x',              // Ctrl + X
  paste: 'v',            // Ctrl + V
  undo: 'z',             // Ctrl + Z
  redo: 'z',             // Ctrl + Shift + Z
  selectAll: 'a'         // Ctrl + A
};

export const useKeyBindings = () => {
  const [keyBindings, setKeyBindingsState] = useState<IKeyBindings>(DEFAULT_KEY_BINDINGS);
  
  // 加载保存的快捷键配置
  useEffect(() => {
    const savedBindings = loadKeyBindings();
    if (savedBindings) {
      // 确保所有默认配置都存在，即使加载的配置中缺少一些项
      const mergedBindings = { ...DEFAULT_KEY_BINDINGS, ...savedBindings };
      setKeyBindingsState(mergedBindings);
    }
  }, []);
  
  // 更新并保存快捷键配置
  const updateKeyBindings = (newBindings: IKeyBindings) => {
    setKeyBindingsState(newBindings);
    saveKeyBindings(newBindings);
  };
  
  // 重置为默认配置
  const resetToDefaults = () => {
    setKeyBindingsState(DEFAULT_KEY_BINDINGS);
    saveKeyBindings(DEFAULT_KEY_BINDINGS);
  };
  
  return { 
    keyBindings,
    updateKeyBindings,
    resetToDefaults
  };
};
