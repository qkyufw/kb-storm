import React from 'react';
import { IKeyBindings } from '../../types';
import { LayoutAlgorithm, LayoutOptions } from '../../utils/layoutUtils';
import LayoutSelector from './LayoutSelector';
import '../../styles/Toolbar.css';

interface ToolbarProps {
  onCreateCard: () => void;
  onExportPNG?: () => void;
  onExportMermaid?: () => void;
  onImportMermaid?: () => void;
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
  onExportPNG,
  onExportMermaid,
  onImportMermaid,
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
      tooltip: `新建卡片 (${keyBindings.newCard ? `Ctrl+${keyBindings.newCard.toUpperCase()}` : '未设置'})`, // 将显示为 Ctrl+D
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
    }
  ];
  
  // 导出/导入按钮
  const exportImportItems = [
    // 导出PNG图像
    onExportPNG && {
      id: 'export-png',
      icon: '🖼️',
      tooltip: '导出为PNG图像',
      onClick: onExportPNG,
      disabled: false
    },
    // Mermaid导出按钮
    onExportMermaid && {
      id: 'export-mermaid',
      icon: '📊',
      tooltip: '导出为Mermaid代码',
      onClick: onExportMermaid,
      disabled: false
    },
    // Mermaid导入按钮
    onImportMermaid && {
      id: 'import-mermaid',
      icon: '📥',
      tooltip: '导入Mermaid代码',
      onClick: onImportMermaid,
      disabled: false
    },
  ].filter(Boolean) as typeof toolbarItems;
  
  // 插入分隔符
  if (exportImportItems.length > 0) {
    toolbarItems.push({ id: 'divider-export', isDivider: true });
    toolbarItems.push(...exportImportItems);
  }
  
  // 帮助和设置按钮
  toolbarItems.push(
    { id: 'divider-4', isDivider: true },
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
  );

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
