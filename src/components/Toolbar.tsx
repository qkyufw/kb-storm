import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

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

  // 添加拖拽相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 20 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [toolbarSize, setToolbarSize] = useState({ width: 0, height: 0 });
  const dragAnimationRef = React.useRef<number | null>(null);

  // 添加状态来控制下拉菜单的弹出方向
  const [dropdownDirection, setDropdownDirection] = useState<'up' | 'down'>('down');

  // 更新下拉菜单方向的函数
  const updateDropdownDirection = React.useCallback((currentY: number, toolbarHeight: number) => {
    const dropdownHeight = 200; // 估算的下拉菜单高度
    const spaceBelow = window.innerHeight - currentY - toolbarHeight;
    const spaceAbove = currentY;
    
    // 如果下方空间不足且上方有足够空间，则向上弹出
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownDirection('up');
    } else {
      setDropdownDirection('down');
    }
  }, []);

  // 初始化工具栏位置和尺寸
  React.useEffect(() => {
    const updatePositionAndSize = () => {
      const toolbarElement = document.querySelector('.mind-map-header');
      if (toolbarElement) {
        const rect = toolbarElement.getBoundingClientRect();
        const newSize = { width: rect.width, height: rect.height };
        setToolbarSize(newSize);

        // 计算居中位置
        const centerX = (window.innerWidth - rect.width) / 2;
        const margin = 20;
        const clampedX = Math.max(margin, Math.min(centerX, window.innerWidth - rect.width - margin));

        setToolbarPosition(prev => ({
          ...prev,
          x: clampedX
        }));
        
        // 初始化下拉菜单方向
        updateDropdownDirection(20, newSize.height);
      }
    };

    // 使用多次尝试确保DOM完全渲染
    const attempts = [50, 150, 300, 500];
    const timers = attempts.map(delay =>
      setTimeout(updatePositionAndSize, delay)
    );

    // 监听窗口大小变化
    window.addEventListener('resize', updatePositionAndSize);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
      window.removeEventListener('resize', updatePositionAndSize);
    };
  }, [updateDropdownDirection]); // 添加依赖项

  // 处理删除操作
  const handleDelete = () => {
    deleteSelectedElementsService();
  };

  // 拖拽处理函数
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      const rect = e.currentTarget.getBoundingClientRect();

      // 更新当前尺寸缓存
      setToolbarSize({ width: rect.width, height: rect.height });

      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDragging) {
      // 取消之前的动画帧请求，避免堆积
      if (dragAnimationRef.current) {
        cancelAnimationFrame(dragAnimationRef.current);
      }

      // 使用 requestAnimationFrame 确保流畅的拖拽
      dragAnimationRef.current = requestAnimationFrame(() => {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // 使用缓存的尺寸信息，避免频繁DOM查询
        const toolbarWidth = toolbarSize.width || 700;
        const toolbarHeight = toolbarSize.height || 60;

        const margin = 20;
        const maxX = window.innerWidth - toolbarWidth - margin;
        const maxY = window.innerHeight - toolbarHeight - margin;

        setToolbarPosition({
          x: Math.max(margin, Math.min(newX, maxX)),
          y: Math.max(margin, Math.min(newY, maxY))
        });

        // 更新下拉菜单方向
        updateDropdownDirection(Math.max(margin, Math.min(newY, maxY)), toolbarHeight);

        dragAnimationRef.current = null;
      });
    }
  }, [isDragging, dragOffset, toolbarSize]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
    // 清理可能存在的动画帧请求
    if (dragAnimationRef.current) {
      cancelAnimationFrame(dragAnimationRef.current);
      dragAnimationRef.current = null;
    }
  }, []);

  // 添加全局鼠标事件监听
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

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

  // 处理AI导出草稿
  const handleAIDraftExport = async () => {
    if (!ai.isConfigured) {
      ai.setShowConfigModal(true);
      return;
    }

    try {
      // 直接打开导出草稿模态框
      ai.setShowDraftModal(true);
      setShowAIMenu(false);
    } catch (error) {
      console.error('AI导出草稿失败:', error);
    }
  };

  const handleAIConfig = () => {
    ai.setShowConfigModal(true);
    setShowAIMenu(false);
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
      id: 'ai-draft',
      label: t('toolbar.aiDraft'),
      icon: '📝',
      onClick: handleAIDraftExport,
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
    onClick: () => {
      // 在打开菜单前更新下拉方向
      updateDropdownDirection(toolbarPosition.y, toolbarSize.height);
      setShowExportImportMenu(!showExportImportMenu);
    },
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
    onClick: () => {
      // 在打开菜单前更新下拉方向
      updateDropdownDirection(toolbarPosition.y, toolbarSize.height);
      setShowAIMenu(!showAIMenu);
    },
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
  const handleClickOutside = React.useCallback((e: MouseEvent) => {
    // 如果正在拖拽，不处理点击事件
    if (isDragging) {
      return;
    }

    const target = e.target as Element;
    const toolbarElement = document.querySelector('.mind-map-header');

    // 检查点击是否在工具栏外部
    if (toolbarElement && !toolbarElement.contains(target)) {
      if (showExportImportMenu) {
        setShowExportImportMenu(false);
      }
      if (showAIMenu) {
        setShowAIMenu(false);
      }
    }
  }, [showExportImportMenu, showAIMenu, isDragging]);

  // 处理Escape键关闭下拉菜单
  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showExportImportMenu) {
        setShowExportImportMenu(false);
      }
      if (showAIMenu) {
        setShowAIMenu(false);
      }
    }
  }, [showExportImportMenu, showAIMenu]);

  // 添加全局事件监听器
  React.useEffect(() => {
    if (showExportImportMenu || showAIMenu) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showExportImportMenu, showAIMenu, handleClickOutside, handleKeyDown]);

  return (
    <div
      className={`mind-map-header ${isDragging ? 'dragging' : ''}`}
      onMouseDown={handleMouseDown}
      style={{
        left: `${toolbarPosition.x}px`,
        top: `${toolbarPosition.y}px`,
        transform: 'none',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
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
                <div 
                  className={`toolbar-dropdown-menu ${dropdownDirection === 'up' ? 'dropdown-up' : 'dropdown-down'}`} 
                  onClick={(e) => e.stopPropagation()}
                >
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

      </div>

    </div>
  );
};

export default MindMapHeader;