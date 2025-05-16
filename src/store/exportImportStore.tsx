import { create } from 'zustand';
import { useCardStore } from './cardStore';
import { useConnectionStore } from './connectionStore';
import { useHistoryStore } from './historyStore';
import { useUIStore } from './UIStore';
import { 
  exportAsMermaid, 
  exportToPNG, 
  exportToMarkdown,
  importFromMermaid,
  importFromMarkdown
} from '../utils/storageUtils';
import { ICard, IConnection } from '../types/CoreTypes';
import { LayoutAlgorithm, LayoutOptions } from '../utils/layoutUtils';
import { RefObject } from 'react';

// 明确定义 MindMapData 接口
interface MindMapData {
  cards: ICard[];
  connections: IConnection[];
}

interface ExportImportState {
  // 状态
  showMermaidImportModal: boolean;
  showMermaidExportModal: boolean;
  showMarkdownImportModal: boolean;
  showMarkdownExportModal: boolean;
  mermaidCode: string;
  markdownContent: string;
  
  // 导出方法
  handleExportPNG: () => void;
  handleExportMermaid: () => void;
  handleExportMarkdown: () => void;
  
  // 导入方法
  handleImportMermaid: (code: string) => void;
  handleImportMarkdown: (content: string) => void;
  
  // 打开/关闭模态框
  handleOpenMermaidImport: () => void;
  closeMermaidImportModal: () => void;
  closeMermaidExportModal: () => void;
  handleOpenMarkdownImport: () => void;
  closeMarkdownImportModal: () => void;
  closeMarkdownExportModal: () => void;
}

// 类型保护函数，检查对象是否是Promise
function isPromise<T>(obj: any): obj is Promise<T> {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

export const useExportImportStore = create<ExportImportState>((set, get) => ({
  // 初始状态
  showMermaidImportModal: false,
  showMermaidExportModal: false,
  showMarkdownImportModal: false,
  showMarkdownExportModal: false,
  mermaidCode: '',
  markdownContent: '',
  
  // 导出方法
  handleExportPNG: async () => {
    const cards = useCardStore.getState().cards;
    const connections = useConnectionStore.getState().connections;
    const uiStore = useUIStore.getState();
    
    if (!uiStore.mapRef?.current) {
      console.error("画布引用不存在，无法导出图片");
      return;
    }
    
    try {
      // 创建一个正确类型的 RefObject
      const mapRef: RefObject<HTMLDivElement> = {
        current: uiStore.mapRef.current
      };
      
      // 调用导出函数，不指定返回类型
      const dataUrl = await exportToPNG(
        { cards, connections }, 
        mapRef
      );
      
      // 检查dataUrl是否存在
      if (typeof dataUrl === 'string') {
        const link = document.createElement('a');
        link.download = `mindmap-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error('导出PNG失败:', error);
    }
  },
  
  handleExportMermaid: () => {
    const cards = useCardStore.getState().cards;
    const connections = useConnectionStore.getState().connections;
    
    const code = exportAsMermaid({ cards, connections });
    set({ mermaidCode: code, showMermaidExportModal: true });
  },
  
  handleExportMarkdown: () => {
    const cards = useCardStore.getState().cards;
    const connections = useConnectionStore.getState().connections;
    
    const md = exportToMarkdown({ cards, connections });
    set({ markdownContent: md, showMarkdownExportModal: true });
  },
  
  // 导入方法
  handleImportMermaid: async (code: string) => {
    try {
        const history = useHistoryStore.getState();
        const cards = useCardStore.getState();
        const connections = useConnectionStore.getState();
        
        history.addToHistory();
        
        // 获取导入结果
        let importResult = importFromMermaid(code);
        
        // 如果结果是undefined或null，提前返回
        if (!importResult) {
        console.error("导入失败：未能解析Mermaid代码");
        return;
        }
        
        // 使用类型保护函数检查是否是Promise
        let result: MindMapData;
        if (isPromise<MindMapData | null>(importResult)) {
        const awaitedResult = await importResult;
        if (!awaitedResult) {
            console.error("导入失败：Promise返回null");
            return;
        }
          result = awaitedResult;
        } else {
          result = importResult as MindMapData;
        }
        
        // 设置卡片和连接线数据
        cards.setCardsData(result.cards);
        connections.setConnectionsData(result.connections);
        cards.setSelectedCardId(null);
        
        // 关闭模态框
        set({ showMermaidImportModal: false });
    } catch (error) {
        console.error('导入Mermaid失败:', error);
    }
    },
  
  handleImportMarkdown: async (content: string) => {
    try {
      const history = useHistoryStore.getState();
      const cards = useCardStore.getState();
      const connections = useConnectionStore.getState();
      const ui = useUIStore.getState();
      
      history.addToHistory();
      
      // 添加布局信息
      const layoutInfo = {
        algorithm: cards.layoutAlgorithm as LayoutAlgorithm,
        options: cards.layoutOptions as LayoutOptions,
        viewportInfo: ui.viewportInfo
      };
      
      // 获取导入结果
      let importResult = importFromMarkdown(content, layoutInfo);
      
      // 如果结果是undefined或null，提前返回
      if (!importResult) {
        console.error("导入失败：未能解析Markdown内容");
        return;
      }
      
      // 使用类型保护函数检查是否是Promise
      let result: MindMapData;
      if (isPromise<MindMapData>(importResult)) {
        result = await importResult;
      } else {
        result = importResult as MindMapData;
      }
      
      // 设置卡片和连接线数据
      cards.setCardsData(result.cards);
      connections.setConnectionsData(result.connections);
      cards.setSelectedCardId(null);
      
      // 关闭模态框
      set({ showMarkdownImportModal: false });
    } catch (error) {
      console.error('导入Markdown失败:', error);
    }
  },
  
  // 模态框控制
  handleOpenMermaidImport: () => set({ showMermaidImportModal: true }),
  closeMermaidImportModal: () => set({ showMermaidImportModal: false }),
  closeMermaidExportModal: () => set({ showMermaidExportModal: false }),
  handleOpenMarkdownImport: () => set({ showMarkdownImportModal: true }),
  closeMarkdownImportModal: () => set({ showMarkdownImportModal: false }),
  closeMarkdownExportModal: () => set({ showMarkdownExportModal: false }),
}));