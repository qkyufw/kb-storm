import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutAlgorithm } from '../utils/layoutUtils';
import '../styles/toolbar/Toolbar.css';
import ModeIndicator from './ModeIndicator'; // 引入 ModeIndicator
import LanguageSwitcher from './LanguageSwitcher'; // 引入语言切换器

// 导入 Stores
import { useCardStore } from '../store/cardStore';
import { useConnectionStore } from '../store/connectionStore';
import { useUIStore } from '../store/UIStore';
import { useHistoryStore } from '../store/historyStore';
import { useClipboardStore } from '../store/clipboardStore';
import { useFreeConnectionStore } from '../store/freeConnectionStore';
import { useExportImportStore } from '../store/exportImportStore';
import { useAIStore } from '../store/aiStore';
import { useKeyBindings } from '../hooks/interaction/useKeyboardShortcuts';

// 导入i18n工具函数
import { getTooltipText } from '../i18n/utils';

// 导入服务
import {
  createCardService, 
  pasteClipboardService, 
  deleteSelectedElementsService
} from '../utils/interactions';

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
  isDropdown?: boolean;
  dropdownItems?: ToolbarDropdownItem[];
}

interface ToolbarDropdownItem {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  disabled: boolean;
}

type ToolbarItem = ToolbarDivider | ToolbarButton;

const MindMapHeader: React.FC = () => {
  // 使用翻译hook
  const { t } = useTranslation();

  // 使用 stores
  const cards = useCardStore();
  const connections = useConnectionStore();
  const ui = useUIStore();
  const history = useHistoryStore();
  const clipboard = useClipboardStore();
  const freeConnection = useFreeConnectionStore();
  const exportImport = useExportImportStore();
  const ai = useAIStore();
  const { keyBindings } = useKeyBindings();

  // 添加状态来控制导入导出下拉菜单
  const [showExportImportMenu, setShowExportImportMenu] = useState(false);

  // 添加状态来控制AI功能下拉菜单
  const [showAIMenu, setShowAIMenu] = useState(false);

  // 处理删除操作
  const handleDelete = () => {
    deleteSelectedElementsService();
  };

  // 处理AI功能
  const handleAIExpand = async () => {
    if (!ai.isConfigured) {
      ai.setShowConfigModal(true);
      return;
    }

    // 检查是否需要在执行前打开配置
    const functionConfig = ai.config?.functionConfig?.expansion;
    if (functionConfig?.openConfigBeforeExecution) {
      // 打开AI配置模态框，并切换到扩展思路标签页
      ai.setShowConfigModal(true, 'expansion');
      setShowAIMenu(false);
      return;
    }

    try {
      const customDescription = functionConfig?.defaultDescription;
      const temperature = functionConfig?.temperature;

      const newCards = await ai.expandCards(
        cards.cards,
        ui.viewportInfo,
        undefined, // context
        customDescription,
        temperature
      );
      // 添加新卡片到画布
      cards.addCards(newCards);
      // 添加到历史记录
      history.addToHistory();
      setShowAIMenu(false);
    } catch (error) {
      console.error('AI扩展失败:', error);
      // 错误信息会通过AI store的状态显示给用户
    }
  };



  const handleAIOrganize = async () => {
    if (!ai.isConfigured) {
      ai.setShowConfigModal(true);
      return;
    }

    // 检查是否需要在执行前打开配置
    const functionConfig = ai.config?.functionConfig?.organization;
    if (functionConfig?.openConfigBeforeExecution) {
      // 打开AI配置模态框，并切换到整理精简标签页
      ai.setShowConfigModal(true, 'organization');
      setShowAIMenu(false);
      return;
    }

    try {
      const customDescription = functionConfig?.defaultDescription;
      const temperature = functionConfig?.temperature;

      const result = await ai.organizeCards(
        cards.cards,
        ui.viewportInfo,
        'summarize', // type
        customDescription,
        temperature
      );
      // 删除原有卡片
      cards.deleteCards(result.cardsToDelete);
      // 添加新卡片
      cards.addCards(result.newCards);
      // 添加到历史记录
      history.addToHistory();
      setShowAIMenu(false);
    } catch (error) {
      console.error('AI整理失败:', error);
      // 错误信息会通过AI store的状态显示给用户
    }
  };

  const handleAIConfig = () => {
    ai.setShowConfigModal(true);
    setShowAIMenu(false);
  };



  // 布局选择器状态
  const [isLayoutOpen, setIsLayoutOpen] = useState(false);
  const [spacing, setSpacing] = useState(cards.getLayoutSettings().options.spacing || 180);
  const [jitter, setJitter] = useState(cards.getLayoutSettings().options.jitter || 10);
  
  // 布局算法定义与预览图示
  const layouts: { id: LayoutAlgorithm, name: string, description: string, preview: string }[] = [
    {
      id: 'random',
      name: t('layout.algorithms.random'),
      description: t('layout.algorithms.randomDesc'),
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

  // 导入导出下拉菜单项
  const exportImportDropdownItems: ToolbarDropdownItem[] = [
    // 导出PNG图像
    {
      id: 'export-png',
      label: t('exportImport.exportPNG'),
      icon: '🖼️',
      onClick: exportImport.handleExportPNG,
      disabled: false
    },
    // Mermaid导出按钮
    {
      id: 'export-mermaid',
      label: t('exportImport.exportMermaid'),
      icon: '📊',
      onClick: exportImport.handleExportMermaid,
      disabled: false
    },
    // Mermaid导入按钮
    {
      id: 'import-mermaid',
      label: t('exportImport.importMermaid'),
      icon: '📥',
      onClick: exportImport.handleOpenMermaidImport,
      disabled: false
    },
    // Markdown导出按钮
    {
      id: 'export-markdown',
      label: t('exportImport.exportMarkdown'),
      icon: '📄',
      onClick: exportImport.handleExportMarkdown,
      disabled: false
    },
    // Markdown导入按钮
    {
      id: 'import-markdown',
      label: t('exportImport.importMarkdown'),
      icon: '📝',
      onClick: exportImport.handleOpenMarkdownImport,
      disabled: false
    },
  ];

  // AI功能下拉菜单项
  const aiDropdownItems: ToolbarDropdownItem[] = [
    {
      id: 'ai-expand',
      label: t('toolbar.aiExpand'),
      icon: '🚀',
      onClick: handleAIExpand,
      disabled: ai.status.isLoading
    },
    {
      id: 'ai-organize',
      label: t('toolbar.aiOrganize'),
      icon: '📋',
      onClick: handleAIOrganize,
      disabled: ai.status.isLoading
    },
    {
      id: 'ai-config',
      label: t('toolbar.aiConfig'),
      icon: '⚙️',
      onClick: handleAIConfig,
      disabled: false
    }
  ];

  // 工具栏项定义
  const toolbarItems: ToolbarItem[] = [
    {
      id: 'new-card',
      icon: '📝',
      tooltip: getTooltipText(t, 'toolbar.newCard', keyBindings.newCard),
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
      tooltip: getTooltipText(t, 'toolbar.undo', 'Ctrl+Z'),
      onClick: history.undo,
      disabled: !history.canUndo
    },
    {
      id: 'redo',
      icon: '↪️',
      tooltip: getTooltipText(t, 'toolbar.redo', 'Ctrl+Shift+Z'),
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
      tooltip: getTooltipText(t, 'toolbar.copy', 'Ctrl+C'),
      onClick: clipboard.handleCopy,
      disabled: !hasSelection
    },
    {
      id: 'cut',
      icon: '✂️',
      tooltip: getTooltipText(t, 'toolbar.cut', 'Ctrl+X'),
      onClick: clipboard.handleCut,
      disabled: !hasSelection
    },
    {
      id: 'paste',
      icon: '📌',
      tooltip: getTooltipText(t, 'toolbar.paste', 'Ctrl+V'),
      onClick: () => pasteClipboardService(),
      disabled: false
    },
    {
      id: 'delete',
      icon: '🗑️',
      tooltip: getTooltipText(t, 'toolbar.delete', 'Delete'),
      onClick: handleDelete,
      disabled: !hasSelection
    }
  ];
  
  // 添加自由连线按钮到工具栏
  const connectionButton: ToolbarButton = {
    id: 'free-connection',
    icon: '🔗',
    tooltip: `${t('toolbar.freeConnection')} (${t('toolbar.freeConnectionDesc')})`,
    onClick: () => freeConnection.toggleFreeConnectionMode(),
    disabled: false,
    isActive: freeConnection.freeConnectionMode
  };

  // 添加导入导出下拉菜单按钮
  const exportImportButton: ToolbarButton = {
    id: 'export-import',
    icon: '📤',
    tooltip: t('toolbar.importExport'),
    onClick: () => setShowExportImportMenu(!showExportImportMenu),
    disabled: false,
    isActive: showExportImportMenu,
    isDropdown: true,
    dropdownItems: exportImportDropdownItems
  };

  // 添加AI功能下拉菜单按钮
  const aiButton: ToolbarButton = {
    id: 'ai-functions',
    icon: ai.status.isLoading ? '⏳' : '🤖',
    tooltip: ai.status.isLoading ? t('ai.status.loading') : t('toolbar.aiFunctions'),
    onClick: () => setShowAIMenu(!showAIMenu),
    disabled: false,
    isActive: showAIMenu,
    isDropdown: true,
    dropdownItems: aiDropdownItems
  };

  // 在适当位置添加到工具栏按钮数组中
  const insertIndex = toolbarItems.findIndex(item => item.id === 'divider-2');
  if (insertIndex !== -1) {
    toolbarItems.splice(insertIndex + 1, 0, connectionButton);
  }
  
  // 插入AI功能按钮
  toolbarItems.push({ id: 'divider-ai', isDivider: true });
  toolbarItems.push(aiButton);

  // 插入导入导出按钮
  toolbarItems.push({ id: 'divider-export', isDivider: true });
  toolbarItems.push(exportImportButton);
  
  // 设置按钮
  toolbarItems.push(
    {
      id: 'settings',
      icon: '⚙️',
      tooltip: getTooltipText(t, 'toolbar.keyboardSettings', keyBindings.showKeyBindings),
      onClick: () => ui.setShowKeyBindings(true),
      disabled: false
    }
  );

  // 点击其他位置关闭菜单
  const handleClickOutside = () => {
    if (showExportImportMenu) {
      setShowExportImportMenu(false);
    }
    if (showAIMenu) {
      setShowAIMenu(false);
    }
  };

  return (
    <div className="mind-map-header" onClick={handleClickOutside}>
      <div className="toolbar">
        {/* 在工具栏最左侧添加模式指示器 */}
        <ModeIndicator />

        {/* 添加语言切换器 */}
        <LanguageSwitcher className="toolbar-language-switcher" />
        
        {toolbarItems.map(item => (
          'isDivider' in item && item.isDivider ? (
            <div key={item.id} className="toolbar-divider" />
          ) : (
            <div key={item.id} className={`toolbar-item-container ${('isDropdown' in item && item.isDropdown) ? 'dropdown-container' : ''}`}>
              <button
                className={`toolbar-button ${item.disabled ? 'disabled' : ''} ${('isActive' in item && item.isActive) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.onClick) item.onClick();
                }}
                disabled={item.disabled}
                title={item.tooltip}
              >
                <span className="icon">{item.icon}</span>
              </button>
              
              {/* 渲染下拉菜单 */}
              {'isDropdown' in item && item.isDropdown && item.dropdownItems && (
                (showExportImportMenu && item.id === 'export-import') ||
                (showAIMenu && item.id === 'ai-functions')
              ) && (
                <div className="toolbar-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  {item.dropdownItems.map(dropdownItem => (
                    <button
                      key={dropdownItem.id}
                      className={`dropdown-item ${dropdownItem.disabled ? 'disabled' : ''}`}
                      onClick={() => {
                        dropdownItem.onClick();
                        if (item.id === 'export-import') {
                          setShowExportImportMenu(false);
                        } else if (item.id === 'ai-functions') {
                          setShowAIMenu(false);
                        }
                      }}
                      disabled={dropdownItem.disabled}
                    >
                      <span className="dropdown-icon">{dropdownItem.icon}</span>
                      <span className="dropdown-label">{dropdownItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        ))}
        
        {/* 布局选择器 */}
        <div className="layout-selector">
          <button 
            className="layout-button"
            onClick={() => setIsLayoutOpen(!isLayoutOpen)}
          >
            {t('layout.label')}: {layouts.find(l => l.id === cards.getLayoutSettings().algorithm)?.name || t('layout.algorithms.random')}
          </button>
          
          {isLayoutOpen && (
            <div className="layout-dropdown">
              <div className="layout-options">
                <h3>{t('layout.selectTitle')}</h3>
                
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
                  <h4>{t('layout.title')}</h4>

                  <div className="setting-item">
                    <label>{t('layout.spacing')}:</label>
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
                    <label>{t('layout.randomness')}:</label>
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
                    <button onClick={() => setIsLayoutOpen(false)}>{t('common.close')}</button>
                    <button
                      onClick={() => cards.changeLayoutAlgorithm(cards.getLayoutSettings().algorithm, { spacing, jitter })}
                      className="apply-button"
                    >
                      {t('layout.apply')}
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