import { ICard, IConnection, IKeyBindings, MindMapData } from '../types/CoreTypes';
import { ExportImportUtils } from './exportImport';
import { LayoutAlgorithm, LayoutOptions } from '../utils/layoutUtils';

// 本地存储键名
const KEY_BINDINGS_STORAGE_KEY = 'mindmap-key-bindings';
const KEY_BINDINGS_VERSION_KEY = 'mindmap-key-bindings-version';
const MIND_MAP_DATA_KEY = 'mindmap-data';

// 当前快捷键配置版本
const CURRENT_KEY_BINDINGS_VERSION = '2.0';

// 添加缓存变量
let cachedKeyBindings: IKeyBindings | null = null;
let hasLogged = false;
let cachedMindMapData: MindMapData | null = null;

/**
 * 解析快捷键字符串，支持组合键格式
 * @param keyString 快捷键字符串，如 'Alt+Enter', 'Ctrl+d', 'd'
 * @returns 解析后的快捷键信息
 */
export interface ParsedKeyBinding {
  key: string;
  requiresCtrl: boolean;
  requiresAlt: boolean;
  requiresShift: boolean;
  requiresMeta: boolean;
}

export const parseKeyBinding = (keyString: string): ParsedKeyBinding => {
  const parts = keyString.split('+').map(part => part.trim());
  const result: ParsedKeyBinding = {
    key: '',
    requiresCtrl: false,
    requiresAlt: false,
    requiresShift: false,
    requiresMeta: false
  };

  // 最后一个部分是实际的键
  result.key = parts[parts.length - 1].toLowerCase();

  // 检查修饰键
  for (let i = 0; i < parts.length - 1; i++) {
    const modifier = parts[i].toLowerCase();
    switch (modifier) {
      case 'ctrl':
      case 'control':
        result.requiresCtrl = true;
        break;
      case 'alt':
        result.requiresAlt = true;
        break;
      case 'shift':
        result.requiresShift = true;
        break;
      case 'meta':
      case 'cmd':
      case 'command':
        result.requiresMeta = true;
        break;
    }
  }

  return result;
};

/**
 * 检查键盘事件是否匹配指定的快捷键
 * @param event 键盘事件
 * @param keyBinding 快捷键字符串
 * @returns 是否匹配
 */
export const matchesKeyBinding = (event: KeyboardEvent, keyBinding: string): boolean => {
  const parsed = parseKeyBinding(keyBinding);
  const eventKey = event.key?.toLowerCase() || '';

  // 检查主键是否匹配
  if (eventKey !== parsed.key) {
    return false;
  }

  // 检查修饰键是否匹配
  if (parsed.requiresCtrl && !event.ctrlKey) return false;
  if (parsed.requiresAlt && !event.altKey) return false;
  if (parsed.requiresShift && !event.shiftKey) return false;
  if (parsed.requiresMeta && !event.metaKey) return false;

  // 检查是否有多余的修饰键
  if (!parsed.requiresCtrl && event.ctrlKey) return false;
  if (!parsed.requiresAlt && event.altKey) return false;
  if (!parsed.requiresShift && event.shiftKey) return false;
  if (!parsed.requiresMeta && event.metaKey) return false;

  return true;
};

/**
 * 格式化快捷键字符串用于显示
 * @param keyBinding 快捷键字符串
 * @returns 格式化后的显示字符串
 */
export const formatKeyBindingForDisplay = (keyBinding: string): string => {
  const parsed = parseKeyBinding(keyBinding);
  const modifiers: string[] = [];

  if (parsed.requiresCtrl) modifiers.push('Ctrl');
  if (parsed.requiresAlt) modifiers.push('Alt');
  if (parsed.requiresShift) modifiers.push('Shift');
  if (parsed.requiresMeta) modifiers.push('Cmd');

  const keyName = parsed.key === 'enter' ? 'Enter' :
                  parsed.key === 'escape' ? 'Esc' :
                  parsed.key === 'arrowup' ? '↑' :
                  parsed.key === 'arrowdown' ? '↓' :
                  parsed.key === 'arrowleft' ? '←' :
                  parsed.key === 'arrowright' ? '→' :
                  parsed.key === '+' ? '+' :
                  parsed.key === '-' ? '-' :
                  parsed.key === '=' ? '=' :
                  parsed.key === '0' ? '0' :
                  parsed.key.toUpperCase();

  return modifiers.length > 0 ? `${modifiers.join('+')}+${keyName}` : keyName;
};

/**
 * 保存快捷键绑定到本地存储
 */
export const saveKeyBindings = (keyBindings: IKeyBindings): void => {
  try {
    localStorage.setItem(KEY_BINDINGS_STORAGE_KEY, JSON.stringify(keyBindings));
    localStorage.setItem(KEY_BINDINGS_VERSION_KEY, CURRENT_KEY_BINDINGS_VERSION);
    console.log('快捷键设置已成功保存:', keyBindings);
    // 更新缓存
    cachedKeyBindings = keyBindings;
    window.dispatchEvent(new Event('keybindingsUpdated'));
  } catch (error) {
    console.error('保存快捷键失败:', error);
  }
};

/**
 * 从本地存储加载快捷键绑定
 */
export const loadKeyBindings = (): IKeyBindings | null => {
  // 使用缓存，避免重复读取本地存储
  if (cachedKeyBindings) {
    return cachedKeyBindings;
  }

  try {
    // 检查版本
    const storedVersion = localStorage.getItem(KEY_BINDINGS_VERSION_KEY);
    const storedData = localStorage.getItem(KEY_BINDINGS_STORAGE_KEY);

    // 如果版本不匹配或没有数据，返回 null 以使用默认值
    if (!storedData || storedVersion !== CURRENT_KEY_BINDINGS_VERSION) {
      if (storedData && storedVersion !== CURRENT_KEY_BINDINGS_VERSION) {
        console.log('快捷键配置版本已更新，将使用新的默认值');
        // 清除旧的配置
        localStorage.removeItem(KEY_BINDINGS_STORAGE_KEY);
        localStorage.removeItem(KEY_BINDINGS_VERSION_KEY);
      }
      return null;
    }

    const keyBindings = JSON.parse(storedData) as IKeyBindings;

    // 更新缓存
    cachedKeyBindings = keyBindings;

    if (!hasLogged) {
      console.log('成功从本地存储加载快捷键设置:', keyBindings);
      hasLogged = true;
    }

    return keyBindings;
  } catch (error) {
    console.error('加载快捷键设置失败:', error);
    return null;
  }
};

/**
 * 保存思维导图数据到本地存储
 */
export const saveMindMapData = (data: MindMapData): void => {
  try {
    localStorage.setItem(MIND_MAP_DATA_KEY, JSON.stringify(data));
    cachedMindMapData = data;
    console.log('思维导图数据已保存，共', data.cards.length, '张卡片,', data.connections.length, '条连接线');
  } catch (error) {
    console.error('保存思维导图数据失败:', error);
  }
};

/**
 * 从本地存储加载思维导图数据
 */
export const loadMindMapData = (): MindMapData | null => {
  // 使用缓存，避免重复读取本地存储
  if (cachedMindMapData) {
    return cachedMindMapData;
  }
  
  try {
    const storedData = localStorage.getItem(MIND_MAP_DATA_KEY);
    if (!storedData) return null;
    
    const mindMapData = JSON.parse(storedData) as MindMapData;
    
    // 更新缓存
    cachedMindMapData = mindMapData;
    
    console.log('成功从本地存储加载思维导图数据:', mindMapData);
    return mindMapData;
  } catch (error) {
    console.error('加载思维导图数据失败:', error);
    return null;
  }
};

/**
 * 清除所有本地存储的思维导图数据
 */
export const clearMindMapData = (): void => {
  try {
    localStorage.removeItem(MIND_MAP_DATA_KEY);
    cachedMindMapData = null;
    console.log('思维导图数据已清除');
  } catch (error) {
    console.error('清除思维导图数据失败:', error);
  }
};

/**
 * 导出为PNG图像
 */
export const exportToPNG = async (
  data: MindMapData,
  canvasRef: React.RefObject<HTMLDivElement>
): Promise<void> => {
  try {
    const dataUrl = await ExportImportUtils.exportToPNG(data, canvasRef, { 
      format: 'png', 
      scale: 2 
    });
    
    if (dataUrl) {
      // 仅处理下载逻辑
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `mindmap-${timestamp}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('导出PNG失败');
    }
  } catch (error) {
    console.error('导出PNG失败:', error);
    alert('导出PNG失败');
  }
};

/**
 * 导出为Mermaid格式
 */
export const exportAsMermaid = (
  data: MindMapData
): string => {
  return ExportImportUtils.exportToMermaid(data);
};

/**
 * 从Mermaid格式导入
 */
export const importFromMermaid = async (mermaidCode: string): Promise<MindMapData | null> => {
  try {
    return ExportImportUtils.importFromMermaid(mermaidCode);
  } catch (error) {
    console.error('导入Mermaid失败:', error);
    alert('导入Mermaid失败');
    return null;
  }
};

/**
 * 导出为Markdown格式
 */
export const exportToMarkdown = (data: { cards: ICard[], connections: IConnection[] }): string => {
  return ExportImportUtils.exportToMarkdown(data);
};

/**
 * 从Markdown导入
 */
export const importFromMarkdown = (
  mdContent: string,
  layoutInfo?: {
    algorithm: LayoutAlgorithm,
    options: LayoutOptions,
    viewportInfo?: {
      viewportWidth: number,
      viewportHeight: number,
      zoom: number,
      pan: { x: number, y: number }
    }
  }
) => {
  return ExportImportUtils.importFromMarkdown(mdContent, layoutInfo);
};
