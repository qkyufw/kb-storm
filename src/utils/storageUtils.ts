import { ICard, IConnection, IKeyBindings } from '../types/CoreTypes';
import { ExportImportUtils } from './exportImport';
import { LayoutAlgorithm, LayoutOptions } from '../utils/layoutUtils';

// 保存的数据类型
export interface MindMapData {
  cards: ICard[];
  connections: IConnection[];
}

// 本地存储键名
const STORAGE_KEY = 'mindmap-data';
const KEY_BINDINGS_STORAGE_KEY = 'mindmap-key-bindings';

/**
 * 将思维导图保存到本地存储
 */
export const saveMindMapToStorage = (data: MindMapData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存失败:', error);
    alert('保存失败，可能是本地存储空间不足');
  }
};

/**
 * 从本地存储加载思维导图
 */
export const loadMindMapFromStorage = (): MindMapData | null => {
  try {
    const dataStr = localStorage.getItem(STORAGE_KEY);
    if (!dataStr) return null;
    return JSON.parse(dataStr);
  } catch (error) {
    console.error('加载失败:', error);
    alert('加载失败，存储的数据可能已损坏');
    return null;
  }
};

/**
 * 保存快捷键绑定到本地存储
 */
export const saveKeyBindings = (keyBindings: IKeyBindings): void => {
  try {
    localStorage.setItem(KEY_BINDINGS_STORAGE_KEY, JSON.stringify(keyBindings));
  } catch (error) {
    console.error('保存快捷键失败:', error);
  }
};

/**
 * 从本地存储加载快捷键绑定
 */
export const loadKeyBindings = (): IKeyBindings | null => {
  try {
    const keyBindingsStr = localStorage.getItem(KEY_BINDINGS_STORAGE_KEY);
    if (!keyBindingsStr) return null;
    return JSON.parse(keyBindingsStr);
  } catch (error) {
    console.error('加载快捷键失败:', error);
    return null;
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
