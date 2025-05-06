import React from 'react';
import { IKeyBindings } from '../../types/CoreTypes';
import { LayoutAlgorithm, LayoutOptions } from '../../utils/layoutUtils';
import LayoutSelector from './LayoutSelector';
import '../../styles/toolbar/Toolbar.css';

interface ToolbarProps {
  onCreateCard: () => void;
  onExportPNG?: () => void;
  onExportMermaid?: () => void;
  onExportMarkdown?: () => void; // 添加Markdown导出回调
  onImportMermaid?: () => void;
  onImportMarkdown?: () => void; // 添加Markdown导入回调
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
  onEnterFreeConnectionMode?: () => void;
  freeConnectionMode?: boolean;
  onExitFreeConnectionMode?: () => void;
}

// 修改工具栏项的类型定义
interface ToolbarItemBase {
  id: string;
}

interface ToolbarDivider extends ToolbarItemBase {
  isDivider: true;
}

interface ToolbarButton extends ToolbarItemBase {
  icon: string;
  tooltip: string;
  onClick: (() => void) | undefined;
  disabled: boolean;
  isActive?: boolean;
  isDivider?: false; // 明确指定不是分隔符
}

type ToolbarItem = ToolbarDivider | ToolbarButton;

const Toolbar: React.FC<ToolbarProps> = ({
  onCreateCard,
  onExportPNG,
  onExportMermaid,
  onExportMarkdown, // 添加Markdown导出回调
  onImportMermaid,
  onImportMarkdown, // 添加Markdown导入回调
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
  hasSelection,
  onEnterFreeConnectionMode,
  freeConnectionMode,
  onExitFreeConnectionMode
}) => {
  // 工具栏项定义，包含图标、提示文本和快捷键
  const toolbarItems: ToolbarItem[] = [
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
  
  // 添加自由连线按钮到工具栏
  const connectionButton: ToolbarButton = {
    id: 'free-connection',
    icon: '🔗',
    tooltip: '自由连线模式 (绘制连接线)',
    onClick: freeConnectionMode ? onExitFreeConnectionMode : onEnterFreeConnectionMode,
    disabled: false,
    isActive: freeConnectionMode
  };

  // 在适当位置添加到工具栏按钮数组中
  // 例如，在divider-2之后添加
  const insertIndex = toolbarItems.findIndex(item => item.id === 'divider-2');
  if (insertIndex !== -1 && onEnterFreeConnectionMode) {
    toolbarItems.splice(insertIndex + 1, 0, connectionButton);
  }
  
  // 导出/导入按钮
  const exportImportItems: ToolbarItem[] = [
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
    // Markdown导出按钮
    onExportMarkdown && {
      id: 'export-markdown',
      icon: '📄',
      tooltip: '导出为Markdown',
      onClick: onExportMarkdown,
      disabled: false
    },
    
    // Markdown导入按钮
    onImportMarkdown && {
      id: 'import-markdown',
      icon: '📝',
      tooltip: '导入Markdown',
      onClick: onImportMarkdown,
      disabled: false
    },
  ].filter(Boolean) as ToolbarItem[];
  
  // 插入分隔符
  if (exportImportItems.length > 0) {
    toolbarItems.push({ id: 'divider-export', isDivider: true });
    toolbarItems.push(...exportImportItems);
  }
  
  // 只保留设置按钮
  toolbarItems.push(
    { id: 'divider-4', isDivider: true },
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
        'isDivider' in item && item.isDivider ? (
          <div key={item.id} className="toolbar-divider" />
        ) : (
          <button
            key={item.id}
            className={`toolbar-button ${item.disabled ? 'disabled' : ''} ${('isActive' in item && item.isActive) ? 'active' : ''}`}
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
