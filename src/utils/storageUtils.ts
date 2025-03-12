import { ICard, IConnection, IKeyBindings } from '../types';
import { ExportImportUtils } from './exportImportUtils';
import { LayoutAlgorithm, LayoutOptions, calculateNewCardPosition } from '../utils/layoutUtils';

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
 * 导出为Mermaid格式
 */
export const exportAsMermaid = (
  data: MindMapData
): string => {
  return ExportImportUtils.exportToMermaid(data);
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
      scale: 2 // 高分辨率
    });
    
    if (!dataUrl) {
      alert('导出PNG失败');
      return;
    }
    
    // 下载图像
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `mindmap-${timestamp}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('导出PNG失败:', error);
    alert('导出PNG失败');
  }
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
 * 导出为Excalidraw格式（示例）
 */
export const exportAsExcalidraw = (data: MindMapData): void => {
  try {
    // 转换为Excalidraw格式（这里只是一个简单示例）
    const excalidrawData: any = {
      type: "excalidraw",
      version: 2,
      source: "whiteboard",
      elements: []
    };
    
    // 添加卡片作为矩形
    const rectangles = data.cards.map(card => ({
      type: "rectangle" as const,
      id: card.id,
      x: card.x,
      y: card.y,
      width: card.width,
      height: card.height,
      text: card.content,
      backgroundColor: card.color
    }));
    
    // 添加连接线作为箭头
    const arrows = data.connections
      .map(conn => {
        const startCard = data.cards.find(c => c.id === conn.startCardId);
        const endCard = data.cards.find(c => c.id === conn.endCardId);
        if (!startCard || !endCard) return null;
        
        return {
          type: "arrow" as const,
          id: conn.id,
          x: startCard.x + startCard.width/2,
          y: startCard.y + startCard.height/2,
          width: 0,
          height: 0,
          startBinding: {
            elementId: conn.startCardId,
            focus: 0
          },
          endBinding: {
            elementId: conn.endCardId,
            focus: 0
          },
          text: conn.label || ""
        };
      })
      .filter(arrow => arrow !== null);
    
    // 合并所有元素
    excalidrawData.elements = [...rectangles, ...arrows];
    
    // 下载文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dataStr = JSON.stringify(excalidrawData, null, 2);
    const link = document.createElement('a');
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = `mindmap-${timestamp}.excalidraw`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('导出为Excalidraw失败:', error);
    alert('导出为Excalidraw失败');
  }
};

/**
 * 从Excalidraw文件导入（示例）
 */
export const importFromExcalidrawFile = async (file: File): Promise<MindMapData | null> => {
  try {
    const text = await file.text();
    const excalidrawData = JSON.parse(text);
    
    // 简单的转换逻辑（示例）
    const cards: ICard[] = [];
    const connections: IConnection[] = [];
    
    excalidrawData.elements.forEach((element: any) => {
      if (element.type === "rectangle") {
        cards.push({
          id: element.id,
          content: element.text || "",
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          color: element.backgroundColor || "#ffffff"
        });
      } else if (element.type === "arrow") {
        connections.push({
          id: element.id,
          startCardId: element.startBinding?.elementId,
          endCardId: element.endBinding?.elementId,
          label: element.text || ""
        });
      }
    });
    
    return { cards, connections };
  } catch (error) {
    console.error('导入Excalidraw失败:', error);
    alert('导入Excalidraw失败');
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
