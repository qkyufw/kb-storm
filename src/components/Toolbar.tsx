import React, { useState } from 'react';
import { LayoutAlgorithm } from '../utils/layoutUtils';
import '../styles/toolbar/Toolbar.css';

// 导入 Stores
import { useCardStore } from '../store/cardStore';
import { useConnectionStore } from '../store/connectionStore';
import { useUIStore } from '../store/UIStore';
import { useHistoryStore } from '../store/historyStore';
import { useClipboardStore } from '../store/clipboardStore';
import { useFreeConnectionStore } from '../store/freeConnectionStore';
import { useExportImportStore } from '../store/exportImportStore';
import { useKeyBindings } from '../hooks/interaction/useKeyboardShortcuts';

// 导入服务
import {
  createCardService, 
  pasteClipboardService, 
  deleteSelectedElementsService
} from '../services/MindMapService';

// 工具栏项目类型定义
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
  isDivider?: false;
}

type ToolbarItem = ToolbarDivider | ToolbarButton;

const MindMapHeader: React.FC = () => {
  // 使用 stores
  const cards = useCardStore();
  const connections = useConnectionStore();
  const ui = useUIStore();
  const history = useHistoryStore();
  const clipboard = useClipboardStore();
  const freeConnection = useFreeConnectionStore();
  const exportImport = useExportImportStore();
  const { keyBindings, updateKeyBindings } = useKeyBindings();

  // 处理删除操作
  const handleDelete = () => {
    deleteSelectedElementsService();
  };

  // 布局选择器状态
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [spacing, setSpacing] = useState(cards.getLayoutSettings().options.spacing || 180);
  const [jitter, setJitter] = useState(cards.getLayoutSettings().options.jitter || 10);
  
  // 布局算法定义与预览图示
  const layouts: { id: LayoutAlgorithm, name: string, description: string, preview: string }[] = [
    { 
      id: 'random', 
      name: '随机布局', 
      description: '卡片在当前视图范围内随机分布，自动避免重叠', 
      preview: '⟿ ⤧ ⟿'
    },
  ];
  
  const handleLayoutSelect = (algorithm: LayoutAlgorithm) => {
    cards.changeLayoutAlgorithm(algorithm, { 
      spacing: spacing, 
      jitter: jitter 
    });
    setIsLayoutOpen(false);
  };

  // 检查是否有选择的元素
  const hasSelection = cards.selectedCardIds.length > 0 || connections.selectedConnectionIds.length > 0;

  // 工具栏项定义
  const toolbarItems: ToolbarItem[] = [
    {
      id: 'new-card',
      icon: '📝',
      tooltip: `新建卡片 (${keyBindings.newCard ? `Ctrl+${keyBindings.newCard.toUpperCase()}` : '未设置'})`,
      onClick: () => createCardService(),
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
      onClick: history.undo,
      disabled: !history.canUndo
    },
    {
      id: 'redo',
      icon: '↪️',
      tooltip: '重做 (Ctrl+Shift+Z)',
      onClick: history.redo,
      disabled: !history.canRedo
    },
    { 
      id: 'divider-2', 
      isDivider: true 
    },
    {
      id: 'copy',
      icon: '📋',
      tooltip: '复制 (Ctrl+C)',
      onClick: clipboard.handleCopy,
      disabled: !hasSelection
    },
    {
      id: 'cut',
      icon: '✂️',
      tooltip: '剪切 (Ctrl+X)',
      onClick: clipboard.handleCut,
      disabled: !hasSelection
    },
    {
      id: 'paste',
      icon: '📌',
      tooltip: '粘贴 (Ctrl+V)',
      onClick: () => pasteClipboardService(),
      disabled: false
    },
    {
      id: 'delete',
      icon: '🗑️',
      tooltip: '删除 (Delete)',
      onClick: handleDelete,
      disabled: !hasSelection
    }
  ];
  
  // 添加自由连线按钮到工具栏
  const connectionButton: ToolbarButton = {
    id: 'free-connection',
    icon: '🔗',
    tooltip: '自由连线模式 (绘制连接线)',
    onClick: () => freeConnection.toggleFreeConnectionMode(),
    disabled: false,
    isActive: freeConnection.freeConnectionMode
  };

  // 在适当位置添加到工具栏按钮数组中
  const insertIndex = toolbarItems.findIndex(item => item.id === 'divider-2');
  if (insertIndex !== -1) {
    toolbarItems.splice(insertIndex + 1, 0, connectionButton);
  }
  // 导出/导入按钮
  const exportImportItems: ToolbarItem[] = [
    // 导出PNG图像
    {
      id: 'export-png',
      icon: '🖼️',
      tooltip: '导出为PNG图像',
      onClick: exportImport.handleExportPNG,
      disabled: false
    },
    // Mermaid导出按钮
    {
      id: 'export-mermaid',
      icon: '📊',
      tooltip: '导出为Mermaid代码',
      onClick: exportImport.handleExportMermaid,
      disabled: false
    },
    // Mermaid导入按钮
    {
      id: 'import-mermaid',
      icon: '📥',
      tooltip: '导入Mermaid代码',
      onClick: exportImport.handleOpenMermaidImport,
      disabled: false
    },
    // Markdown导出按钮
    {
      id: 'export-markdown',
      icon: '📄',
      tooltip: '导出为Markdown',
      onClick: exportImport.handleExportMarkdown,
      disabled: false
    },
    // Markdown导入按钮
    {
      id: 'import-markdown',
      icon: '📝',
      tooltip: '导入Markdown',
      onClick: exportImport.handleOpenMarkdownImport,
      disabled: false
    },
  ];
  
  // 插入分隔符
  if (exportImportItems.length > 0) {
    toolbarItems.push({ id: 'divider-export', isDivider: true });
    toolbarItems.push(...exportImportItems);
  }
  
  // 设置按钮
  toolbarItems.push(
    {
      id: 'settings',
      icon: '⚙️',
      tooltip: `快捷键设置 (${keyBindings.showKeyBindings ? `Ctrl+${keyBindings.showKeyBindings.toUpperCase()}` : '未设置'})`,
      onClick: () => ui.setShowKeyBindings(true),
      disabled: false
    }
  );

  return (
    <div className="mind-map-header">
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
        
        {/* 布局选择器 */}
        <div className="layout-selector">
          <button 
            className="layout-button"
            onClick={() => setIsLayoutOpen(!isLayoutOpen)}
          >
            布局: {layouts.find(l => l.id === cards.getLayoutSettings().algorithm)?.name || '随机布局'}
          </button>
          
          {isLayoutOpen && (
            <div className="layout-dropdown">
              <div className="layout-options">
                <h3>选择布局方式</h3>
                
                <div className="layout-list">
                  {layouts.map(layout => (
                    <div 
                      key={layout.id}
                      className={`layout-item ${cards.getLayoutSettings().algorithm === layout.id ? 'active' : ''}`}
                      onClick={() => handleLayoutSelect(layout.id)}
                    >
                      <div className="layout-preview">{layout.preview}</div>
                      <div>
                        <div className="layout-name">{layout.name}</div>
                        <div className="layout-description">{layout.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="layout-settings">
                  <h4>布局设置</h4>
                  
                  <div className="setting-item">
                    <label>间距:</label>
                    <input 
                      type="range" 
                      min="120" 
                      max="300" 
                      value={spacing}
                      onChange={(e) => setSpacing(parseInt(e.target.value))}
                    />
                    <span>{spacing}px</span>
                  </div>
                  
                  <div className="setting-item">
                    <label>随机性:</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="30" 
                      value={jitter}
                      onChange={(e) => setJitter(parseInt(e.target.value))}
                    />
                    <span>{jitter}px</span>
                  </div>
                  
                  <div className="layout-actions">
                    <button onClick={() => setIsLayoutOpen(false)}>关闭</button>
                    <button 
                      onClick={() => cards.changeLayoutAlgorithm(cards.getLayoutSettings().algorithm, { spacing, jitter })}
                      className="apply-button"
                    >
                      应用设置
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MindMapHeader;