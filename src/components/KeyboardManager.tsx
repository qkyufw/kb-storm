import React from 'react';
import { useKeyboardManager } from '../hooks/keyboard/useKeyboardManager';

/**
 * 键盘管理器组件 - 整合各个专用处理器
 */
const KeyboardManager: React.FC = () => {
  // 使用键盘管理器Hook
  useKeyboardManager();
  
  // 不渲染任何UI元素
  return null;
};

export default KeyboardManager;
