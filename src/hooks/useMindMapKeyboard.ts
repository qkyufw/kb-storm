import { useEffect } from 'react';
import { IKeyBindings } from '../types';

/**
 * 键盘快捷键处理
 */
export const useMindMapKeyboard = ({
  editingCardId,
  handleCopy,
  handleCut,
  handlePaste,
  handleDelete,
  handleUndo,
  handleRedo,
  keyBindings
}: {
  editingCardId: string | null;
  handleCopy: () => void;
  handleCut: () => void;
  handlePaste: () => void;
  handleDelete: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  keyBindings: IKeyBindings;
}) => {
  // 全局按键监听
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'z' && (event.ctrlKey || event.metaKey)) {
        if (event.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
        event.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleUndo, handleRedo]);
  
  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在编辑，不处理快捷键
      if (editingCardId) return;
      
      // 复制: Ctrl+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }
      
      // 剪切: Ctrl+X
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        handleCut();
      }
      
      // 粘贴: Ctrl+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }
      
      // 删除: Delete
      if (e.key === 'Delete') {
        e.preventDefault();
        handleDelete();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingCardId, handleCopy, handleCut, handlePaste, handleDelete]);
  
  return {}; // 这个hook主要用于副作用，不需要返回值
};
