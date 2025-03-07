import React, { useState, useEffect, useRef } from 'react';
import '../styles/KeyBindingModal.css';

// 定义快捷键配置接口
interface IKeyBindings {
  newCard: string;
  editCard: string;
  deleteCard: string;
  startConnection: string;
  nextCard: string;
  prevCard: string;
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
  zoomIn: string;
  zoomOut: string;
  resetView: string;
  save: string;
  load: string;
  help: string;
  showKeyBindings: string;
}

interface KeyBindingModalProps {
  keyBindings: IKeyBindings;
  onSave: (bindings: IKeyBindings) => void;
  onClose: () => void;
}

interface KeyBindingItem {
  key: keyof IKeyBindings;
  label: string;
  requiresModifier: boolean;
}

const KeyBindingModal: React.FC<KeyBindingModalProps> = ({ keyBindings, onSave, onClose }) => {
  const [editingBindings, setEditingBindings] = useState<IKeyBindings>({ ...keyBindings });
  const [editingKey, setEditingKey] = useState<keyof IKeyBindings | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  
  // 定义可配置的快捷键列表
  const keyBindingItems: KeyBindingItem[] = [
    { key: 'newCard', label: '新建卡片', requiresModifier: true },
    { key: 'editCard', label: '编辑卡片', requiresModifier: false },
    { key: 'deleteCard', label: '删除卡片', requiresModifier: false },
    { key: 'startConnection', label: '开始连线', requiresModifier: false },
    { key: 'nextCard', label: '下一个卡片', requiresModifier: false },
    { key: 'prevCard', label: '上一个卡片', requiresModifier: false },
    { key: 'moveUp', label: '向上移动', requiresModifier: false },
    { key: 'moveDown', label: '向下移动', requiresModifier: false },
    { key: 'moveLeft', label: '向左移动', requiresModifier: false },
    { key: 'moveRight', label: '向右移动', requiresModifier: false },
    { key: 'zoomIn', label: '放大视图', requiresModifier: true },
    { key: 'zoomOut', label: '缩小视图', requiresModifier: true },
    { key: 'resetView', label: '重置视图', requiresModifier: true },
    { key: 'save', label: '保存文件', requiresModifier: true },
    { key: 'load', label: '加载文件', requiresModifier: true },
    { key: 'help', label: '显示帮助', requiresModifier: false },
    { key: 'showKeyBindings', label: '快捷键设置', requiresModifier: true }
  ];
  
  // 处理按键捕获
  useEffect(() => {
    if (!editingKey) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      // 忽略修饰键单独按下的情况
      if (e.key === 'Control' || e.key === 'Alt' || e.key === 'Shift' || e.key === 'Meta') {
        return;
      }
      
      const item = keyBindingItems.find(item => item.key === editingKey);
      
      // 如果要求修饰键，但没有按下修饰键，则不处理
      if (item?.requiresModifier && !(e.ctrlKey || e.metaKey)) {
        alert('此快捷键需要搭配 Ctrl 或 Command 键使用');
        return;
      }
      
      // 更新编辑中的键绑定
      setEditingBindings(prev => ({
        ...prev,
        [editingKey]: e.key
      }));
      
      // 结束编辑状态
      setEditingKey(null);
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingKey, keyBindingItems]);
  
  // 恢复默认设置
  const resetToDefaults = () => {
    const defaultBindings: IKeyBindings = {
      newCard: 'n',
      editCard: 'Enter',
      deleteCard: 'Delete',
      startConnection: 'c',
      nextCard: 'Tab',
      prevCard: 'Tab',
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
      showKeyBindings: 'k'
    };
    
    setEditingBindings(defaultBindings);
  };
  
  // 保存设置
  const handleSave = () => {
    onSave(editingBindings);
    onClose();
  };
  
  return (
    <div className="key-binding-modal-overlay">
      <div className="key-binding-modal">
        <h2>自定义键盘快捷键</h2>
        
        <div className="key-binding-list">
          {keyBindingItems.map(item => (
            <div key={item.key} className="key-binding-item">
              <span className="key-binding-label">{item.label}</span>
              <div 
                className={`key-binding-value ${editingKey === item.key ? 'editing' : ''}`}
                onClick={() => setEditingKey(item.key)}
              >
                {editingKey === item.key ? (
                  <div className="key-capture" ref={captureRef}>
                    按下键盘按键...
                  </div>
                ) : (
                  <>
                    {item.requiresModifier && <span className="key-modifier">Ctrl + </span>}
                    <span className="key-name">{editingBindings[item.key].toUpperCase()}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="key-binding-actions">
          <button className="reset-button" onClick={resetToDefaults}>恢复默认</button>
          <div>
            <button className="cancel-button" onClick={onClose}>取消</button>
            <button className="save-button" onClick={handleSave}>保存</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyBindingModal;
