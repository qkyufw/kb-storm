import { ICard, IConnection, IKeyBindings } from '../types/CoreTypes';
import { ExportImportUtils } from './exportImport';
import { LayoutAlgorithm, LayoutOptions } from '../utils/layoutUtils';

// 保存的数据类型
export interface MindMapData {
  cards: ICard[];
  connections: IConnection[];
}

// 本地存储键名
const KEY_BINDINGS_STORAGE_KEY = 'mindmap-key-bindings';
const MIND_MAP_DATA_KEY = 'mindmap-data';

// 添加缓存变量
let cachedKeyBindings: IKeyBindings | null = null;
let hasLogged = false;
let cachedMindMapData: MindMapData | null = null;

/**
 * 保存快捷键绑定到本地存储
 */
export const saveKeyBindings = (keyBindings: IKeyBindings): void => {
  try {
    localStorage.setItem(KEY_BINDINGS_STORAGE_KEY, JSON.stringify(keyBindings));
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
    const storedData = localStorage.getItem(KEY_BINDINGS_STORAGE_KEY);
    if (!storedData) return null;
    
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
      // 使用 kbstorm+时间 作为文件名
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `kbstorm-${timestamp}.png`;
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
  },
  cardDefaults?: {
    defaultColor?: string,
    defaultWidth?: number,
    defaultHeight?: number,
    defaultPadding?: number
  }
) => {
  return ExportImportUtils.importFromMarkdown(mdContent, layoutInfo, cardDefaults);
};
