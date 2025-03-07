import { useEffect, useState } from 'react';

// 简单的键盘快捷键钩子
export const useKeyboardShortcuts = (
  keyMap: Record<string, () => void>,
  dependencies: any[] = []
) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      
      // 更新按下的键
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.add(key);
        return newSet;
      });
      
      // 检查快捷键
      for (const shortcut in keyMap) {
        const keys = shortcut.toLowerCase().split('+');
        
        const modifiersRequired = {
          ctrl: keys.includes('ctrl'),
          shift: keys.includes('shift'),
          alt: keys.includes('alt'),
          meta: keys.includes('meta')
        };
        
        const mainKey = keys.filter(k => !['ctrl', 'shift', 'alt', 'meta'].includes(k))[0];
        
        if (
          key === mainKey &&
          event.ctrlKey === modifiersRequired.ctrl &&
          event.shiftKey === modifiersRequired.shift &&
          event.altKey === modifiersRequired.alt &&
          event.metaKey === modifiersRequired.meta
        ) {
          event.preventDefault();
          keyMap[shortcut]();
          break;
        }
      }
    };
    
    const handleKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      setPressedKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [...dependencies]);
  
  return {
    pressedKeys
  };
};

export default useKeyboardShortcuts;
