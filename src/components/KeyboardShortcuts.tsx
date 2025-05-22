import React, { useEffect } from 'react';
import { useUIStore } from '../store/UIStore';

const KeyboardShortcuts: React.FC = () => {
  const ui = useUIStore();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 处理缩放相关快捷键
      if (e.ctrlKey) {
        switch (e.key) {
          case '=': // Ctrl+= 放大视图
          case '+': // 兼容不同键盘布局
            e.preventDefault(); // 阻止浏览器默认缩放
            ui.handleZoomIn();
            break;
          
          case '-': // Ctrl+- 缩小视图
          case '_': // 兼容不同键盘布局
            e.preventDefault(); // 阻止浏览器默认缩放
            ui.handleZoomOut();
            break;
          
          case '0': // Ctrl+0 重置视图
            e.preventDefault(); // 阻止浏览器默认行为
            ui.resetView();
            break;
        }
      }
    };

    // 添加全局事件监听器
    window.addEventListener('keydown', handleKeyDown);
    
    // 清理函数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [ui]);
  
  // 这是一个无UI组件，只处理键盘事件
  return null;
};

export default KeyboardShortcuts;
