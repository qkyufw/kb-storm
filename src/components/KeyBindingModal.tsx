import React, { useState, useEffect, useRef } from 'react';
import '../styles/modals/KeyBindingModal.css';
import { IKeyBindings } from '../types/CoreTypes';

interface KeyBindingModalProps {
  keyBindings: IKeyBindings;
  onSave: (bindings: IKeyBindings) => void;
  onClose: () => void;
}

interface KeyBindingItem {
  key: keyof IKeyBindings | string; // 允许硬编码的快捷键名称
  label: string;
  requiresModifier: boolean;
  fixed?: boolean; // 添加固定标志
  combination?: boolean; // 添加组合键标志
  group?: string;
  hardcoded?: boolean; // 标记为硬编码的快捷键
  value?: string; // 硬编码快捷键的值
}

const KeyBindingModal: React.FC<KeyBindingModalProps> = ({ keyBindings, onSave, onClose }) => {
  const [editingBindings, setEditingBindings] = useState<IKeyBindings>({ ...keyBindings });
  const [editingKey, setEditingKey] = useState<keyof IKeyBindings | null>(null);
  const captureRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // 定义可配置的快捷键列表
  const editableKeyBindings: KeyBindingItem[] = [
    // 可修改的快捷键
    { key: 'newCard', label: '新建卡片', requiresModifier: true, group: '可修改快捷键' },
    { key: 'startConnection', label: '开始连线', requiresModifier: true, combination: true, group: '可修改快捷键' },
    { key: 'showKeyBindings', label: '快捷键设置', requiresModifier: true, group: '可修改快捷键' },
  ];
  
  // 定义固定快捷键列表
  const fixedKeyBindings: KeyBindingItem[] = [
    // 模式切换组
    { key: 'selectMode', label: '卡片选择模式', requiresModifier: false, fixed: true, group: '模式切换', hardcoded: true, value: '1' },
    { key: 'moveMode', label: '卡片移动模式', requiresModifier: false, fixed: true, group: '模式切换', hardcoded: true, value: '2' },
    { key: 'connectionMode', label: '连接线选择模式', requiresModifier: false, fixed: true, group: '模式切换', hardcoded: true, value: '3' },
    
    // 卡片操作组
    { key: 'editCard', label: '编辑卡片', requiresModifier: false, fixed: true, group: '卡片操作' },
    { key: 'deleteCards', label: '删除卡片', requiresModifier: false, fixed: true, group: '卡片操作' },
    { key: 'completeEditing', label: '完成编辑', requiresModifier: true, fixed: true, group: '卡片操作', hardcoded: true, value: 'Ctrl+Enter/Esc' },
    
    // 连线操作组
    { key: 'confirmConnection', label: '确认连接', requiresModifier: false, fixed: true, group: '连线操作', hardcoded: true, value: 'Enter' },
    { key: 'cancelConnection', label: '取消连接', requiresModifier: false, fixed: true, group: '连线操作', hardcoded: true, value: 'Esc' },
    
    // 选择和导航组
    { key: 'nextCard', label: '下一个卡片', requiresModifier: false, fixed: true, group: '选择与导航' },
    { key: 'prevCard', label: '上一个卡片', requiresModifier: false, fixed: true, group: '选择与导航' },
    { key: 'selectAll', label: '全选', requiresModifier: true, fixed: true, group: '选择与导航' },
    
    // 高级操作组
    { key: 'createConnectedCard', label: '创建连接卡片', requiresModifier: true, fixed: true, group: '高级操作', hardcoded: true, value: 'Ctrl+方向键' },
    { key: 'moveCardFast', label: '快速移动卡片', requiresModifier: false, fixed: true, group: '高级操作', hardcoded: true, value: 'Shift+方向键' },
    
    // 移动组
    { key: 'moveUp', label: '向上移动', requiresModifier: false, fixed: true, group: '移动卡片' },
    { key: 'moveDown', label: '向下移动', requiresModifier: false, fixed: true, group: '移动卡片' },
    { key: 'moveLeft', label: '向左移动', requiresModifier: false, fixed: true, group: '移动卡片' },
    { key: 'moveRight', label: '向右移动', requiresModifier: false, fixed: true, group: '移动卡片' },
    
    // 视图控制组
    { key: 'zoomIn', label: '放大视图', requiresModifier: true, fixed: true, group: '视图控制' },
    { key: 'zoomOut', label: '缩小视图', requiresModifier: true, fixed: true, group: '视图控制' },
    { key: 'resetView', label: '重置视图', requiresModifier: true, fixed: true, group: '视图控制', hardcoded: true, value: 'Ctrl+0' },
    
    // 编辑组
    { key: 'copy', label: '复制', requiresModifier: true, fixed: true, group: '编辑操作' },
    { key: 'cut', label: '剪切', requiresModifier: true, fixed: true, group: '编辑操作' },
    { key: 'paste', label: '粘贴', requiresModifier: true, fixed: true, group: '编辑操作' },
    { key: 'undo', label: '撤销', requiresModifier: true, fixed: true, group: '编辑操作' },
    { key: 'redo', label: '重做', requiresModifier: true, fixed: true, group: '编辑操作', hardcoded: true, value: 'Ctrl+Shift+Z' },
  ];
  
  // 合并所有快捷键项
  const keyBindingItems = [...editableKeyBindings, ...fixedKeyBindings];
  
  // 获取所有分组，确保"可修改快捷键"组排在最前面
  const groups = ['可修改快捷键', ...Array.from(new Set(fixedKeyBindings.map(item => item.group)))];
  
  // 按ESC键退出
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  
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
      resetView: '0', // 改为0，而不是空格
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
    window.dispatchEvent(new Event('keybindingsUpdated'));
    onClose();
  };
  
  // 获取显示的键值
  const getDisplayKeyValue = (item: KeyBindingItem): string => {
    if (item.hardcoded) {
      return item.value || '未设置';
    } else if (editingBindings[item.key as keyof IKeyBindings]) {
      const keyValue = editingBindings[item.key as keyof IKeyBindings];
      // 处理特殊键的显示
      if (keyValue === ' ') {
        return '空格';
      }
      return keyValue.toUpperCase();
    }
    return '未设置';
  };
  
  // 判断是否为可修改的快捷键
  const isEditable = (item: KeyBindingItem): boolean => {
    return !item.fixed && !item.hardcoded;
  };
  
  return (
    <div className="key-binding-modal-overlay" onClick={onClose}>
      <div 
        className="key-binding-modal" 
        onClick={e => e.stopPropagation()} 
        ref={modalRef}
      >
        <h2>自定义键盘快捷键</h2>
        <p className="key-binding-info">蓝色为可修改快捷键，保存后刷新生效</p>
        
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
                    className={`key-binding-value ${editingKey === item.key ? 'editing' : ''} 
                               ${isEditable(item) ? 'editable' : 'fixed'}
                               ${editingKey === item.key ? 'editing' : ''}`}
                    onClick={() => isEditable(item) && setEditingKey(item.key as keyof IKeyBindings)}
                  >
                    {editingKey === item.key ? (
                      <div className="key-capture" ref={captureRef}>
                        按下键盘按键...
                      </div>
                    ) : (
                      <>
                        {(item.requiresModifier || item.combination) && !item.hardcoded && <span className="key-modifier">Ctrl + </span>}
                        <span className="key-name">
                          {getDisplayKeyValue(item)}
                        </span>
                        {(item.fixed || item.hardcoded) && <span className="key-fixed-badge">固定</span>}
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
