import React from 'react';
import { IKeyBindings } from '../../types';
import { LayoutAlgorithm, LayoutOptions } from '../../utils/layoutUtils';
import LayoutSelector from './LayoutSelector';
import '../../styles/Toolbar.css'; // 确保引入样式文件

interface ToolbarProps {
  onCreateCard: () => void;
  onSave: () => void;
  onLoad: () => void;
  onShowHelp: () => void;
  onShowKeyBindings: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  keyBindings: IKeyBindings;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  currentLayout: {
    algorithm: LayoutAlgorithm;
    options: LayoutOptions;
  };
  onLayoutChange: (algorithm: LayoutAlgorithm, options?: LayoutOptions) => void;
  hasSelection?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onCreateCard,
  onSave,
  onLoad,
  onShowHelp,
  onShowKeyBindings,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  keyBindings,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  currentLayout,
  onLayoutChange,
  hasSelection
}) => {
  // 工具栏项定义，包含图标、提示文本和快捷键
  const toolbarItems = [
    {
      id: 'new-card',
      icon: '📝',
      tooltip: `新建卡片 (${keyBindings.newCard ? `Ctrl+${keyBindings.newCard.toUpperCase()}` : '未设置'})`,
      onClick: onCreateCard,
      disabled: false
    },
    { 
      id: 'divider-1', 
      isDivider: true 
    },
    {
      id: 'undo',
      icon: '↩️',
      tooltip: '撤销 (Ctrl+Z)',
      onClick: onUndo,
      disabled: !canUndo
    },
    {
      id: 'redo',
      icon: '↪️',
      tooltip: '重做 (Ctrl+Shift+Z)',
      onClick: onRedo,
      disabled: !canRedo
    },
    { 
      id: 'divider-2', 
      isDivider: true 
    },
    {
      id: 'copy',
      icon: '📋',
      tooltip: '复制 (Ctrl+C)',
      onClick: onCopy,
      disabled: !hasSelection
    },
    {
      id: 'cut',
      icon: '✂️',
      tooltip: '剪切 (Ctrl+X)',
      onClick: onCut,
      disabled: !hasSelection
    },
    {
      id: 'paste',
      icon: '📌',
      tooltip: '粘贴 (Ctrl+V)',
      onClick: onPaste,
      disabled: false
    },
    {
      id: 'delete',
      icon: '🗑️',
      tooltip: '删除 (Delete)',
      onClick: onDelete,
      disabled: !hasSelection
    },
    { 
      id: 'divider-3', 
      isDivider: true 
    },
    {
      id: 'save',
      icon: '💾',
      tooltip: `保存 (${keyBindings.save ? `Ctrl+${keyBindings.save.toUpperCase()}` : '未设置'})`,
      onClick: onSave,
      disabled: false
    },
    {
      id: 'load',
      icon: '📂',
      tooltip: `加载 (${keyBindings.load ? `Ctrl+${keyBindings.load.toUpperCase()}` : '未设置'})`,
      onClick: onLoad,
      disabled: false
    },
    { 
      id: 'divider-4', 
      isDivider: true 
    },
    {
      id: 'help',
      icon: '❓',
      tooltip: `帮助 (${keyBindings.help || '未设置'})`,
      onClick: onShowHelp,
      disabled: false
    },
    {
      id: 'settings',
      icon: '⚙️',
      tooltip: `快捷键设置 (${keyBindings.showKeyBindings ? `Ctrl+${keyBindings.showKeyBindings.toUpperCase()}` : '未设置'})`,
      onClick: onShowKeyBindings,
      disabled: false
    }
  ];

  return (
    <div className="toolbar">
      {toolbarItems.map(item => (
        item.isDivider ? (
          <div key={item.id} className="toolbar-divider" />
        ) : (
          <button
            key={item.id}
            className={`toolbar-button ${item.disabled ? 'disabled' : ''}`}
            onClick={item.onClick}
            disabled={item.disabled}
            title={item.tooltip}
          >
            <span className="icon">{item.icon}</span>
          </button>
        )
      ))}
      
      <LayoutSelector 
        currentLayout={currentLayout}
        onLayoutChange={onLayoutChange}
      />
    </div>
  );
};

export default Toolbar;
