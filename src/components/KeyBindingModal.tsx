import React, { useState, useEffect, useRef } from 'react';
import '../styles/modals/KeyBindingModal.css';
import { IKeyBindings } from '../types/CoreTypes';

interface KeyBindingModalProps {
  keyBindings: IKeyBindings;
  onSave: (bindings: IKeyBindings) => void;
  onClose: () => void;
}

interface KeyBindingItem {
  key: keyof IKeyBindings;
  label: string;
  requiresModifier: boolean;
  fixed?: boolean; // 添加固定标志
  combination?: boolean; // 添加组合键标志
  group?: string;
}

const KeyBindingModal: React.FC<KeyBindingModalProps> = ({ keyBindings, onSave, onClose }) => {
  const [editingBindings, setEditingBindings] = useState<IKeyBindings>({ ...keyBindings });
  const [editingKey, setEditingKey] = useState<keyof IKeyBindings | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  
  // 定义可配置的快捷键列表，按组分类
  const keyBindingItems: KeyBindingItem[] = [
    // 卡片操作组
    { key: 'newCard', label: '新建卡片', requiresModifier: true, group: '卡片操作' },
    { key: 'editCard', label: '编辑卡片', requiresModifier: false, fixed: true, group: '卡片操作' },
    { key: 'deleteCards', label: '删除卡片', requiresModifier: false, fixed: true, group: '卡片操作' },
    { key: 'startConnection', label: '开始连线', requiresModifier: true, combination: true, group: '连线操作' },
    
    // 选择和导航组
    { key: 'nextCard', label: '下一个卡片', requiresModifier: false, fixed: true, group: '选择与导航' },
    { key: 'prevCard', label: '上一个卡片', requiresModifier: false, fixed: true, group: '选择与导航' },
    { key: 'selectAll', label: '全选', requiresModifier: true, group: '选择与导航' },
    
    // 移动组
    { key: 'moveUp', label: '向上移动', requiresModifier: false, fixed: true, group: '移动卡片' },
    { key: 'moveDown', label: '向下移动', requiresModifier: false, fixed: true, group: '移动卡片' },
    { key: 'moveLeft', label: '向左移动', requiresModifier: false, fixed: true, group: '移动卡片' },
    { key: 'moveRight', label: '向右移动', requiresModifier: false, fixed: true, group: '移动卡片' },
    
    // 视图控制组
    { key: 'zoomIn', label: '放大视图', requiresModifier: true, group: '视图控制' },
    { key: 'zoomOut', label: '缩小视图', requiresModifier: true, group: '视图控制' },
    { key: 'resetView', label: '重置视图', requiresModifier: true, group: '视图控制' },
    
    // 编辑组
    { key: 'copy', label: '复制', requiresModifier: true, group: '编辑操作' },
    { key: 'cut', label: '剪切', requiresModifier: true, group: '编辑操作' },
    { key: 'paste', label: '粘贴', requiresModifier: true, group: '编辑操作' },
    { key: 'undo', label: '撤销', requiresModifier: true, group: '编辑操作' },
    { key: 'redo', label: '重做', requiresModifier: true, group: '编辑操作' },
    
    
    { key: 'showKeyBindings', label: '快捷键设置', requiresModifier: true, group: '其他' }
  ];
  
  // 获取所有分组
  const groups = Array.from(new Set(keyBindingItems.map(item => item.group)));
  
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
        [editingKey]: e.key || '未设置' // 确保在e.key为undefined时使用默认值
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
      newCard: 'd', // 更新为 'd'
      editCard: 'Enter',
      deleteCards: 'Delete',
      startConnection: 'i', // 更新为 'i'
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
      showKeyBindings: 'k',
      selectAll: 'a',
      copy: 'c',
      cut: 'x',
      paste: 'v',
      undo: 'z',
      redo: 'y'
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
          {/* 按分组显示快捷键设置 */}
          {groups.map(group => (
            <div key={group} className="key-binding-group">
              <h3 className="group-title">{group}</h3>
              {keyBindingItems
                .filter(item => item.group === group)
                .map(item => (
                <div key={item.key} className="key-binding-item">
                  <span className="key-binding-label">{item.label}</span>
                  <div 
                    className={`key-binding-value ${editingKey === item.key ? 'editing' : ''} ${item.fixed ? 'fixed' : ''}`}
                    onClick={() => !item.fixed && setEditingKey(item.key)}
                  >
                    {editingKey === item.key ? (
                      <div className="key-capture" ref={captureRef}>
                        按下键盘按键...
                      </div>
                    ) : (
                      <>
                        {(item.requiresModifier || item.combination) && <span className="key-modifier">Ctrl + </span>}
                        <span className="key-name">
                          {/* 添加安全检查，防止undefined.toUpperCase()错误 */}
                          {editingBindings[item.key] ? editingBindings[item.key].toUpperCase() : '未设置'}
                        </span>
                        {item.fixed && <span className="key-fixed-badge">固定</span>}
                      </>
                    )}
                  </div>
                </div>
              ))}
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
