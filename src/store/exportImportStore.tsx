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
import { MindMapData } from '../types/CoreTypes';
import { LayoutAlgorithm, LayoutOptions } from '../utils/layoutUtils';
import { generateUniqueCardId, generateUniqueConnectionId } from '../utils/idGenerator';
import { RefObject } from 'react';
import { MessageService } from '../utils/messageService';

interface ExportImportState {
  // 状态
  showMermaidImportModal: boolean;
  showMermaidExportModal: boolean;
  showMarkdownImportModal: boolean;
  showMarkdownExportModal: boolean;
  mermaidCode: string;
  markdownContent: string;
  
  // 添加Canvas引用设置方法
  setCanvasRef: (ref: HTMLDivElement | null) => void;
  
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
  
  // 添加新方法，存储Canvas引用
  setCanvasRef: (ref) => {
    useUIStore.getState().setMapRef(ref);
  },
  
  // 修复导出PNG函数
  handleExportPNG: async () => {
    const cards = useCardStore.getState().cards;
    const connections = useConnectionStore.getState().connections;
    const uiStore = useUIStore.getState();
    
    if (!uiStore.mapRef || !uiStore.mapRef.current) {
      MessageService.logError('messages.export.pngFailed');
      MessageService.showAlert('messages.export.pngFailed');
      return;
    }
    
    try {
      // 创建一个符合 RefObject<HTMLDivElement> 类型的新引用
      const mapRef: RefObject<HTMLDivElement> = { 
        current: uiStore.mapRef.current
      };
      
      // 调用导出函数，但不进行额外的下载操作
      await exportToPNG(
        { cards, connections }, 
        mapRef
      );
      
      // 导出成功完成
      MessageService.showSuccess('messages.export.pngSuccess');
      // 成功情况下不显示任何弹窗，因为文件已经自动下载了
    } catch (error) {
      MessageService.logError('messages.export.exportFailed', error);
      MessageService.showAlert('messages.export.exportFailed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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

        history.addToHistory(true); // 操作前保存

        // 获取导入结果
        let importResult = importFromMermaid(code);
        
        // 如果结果是undefined或null，提前返回
        if (!importResult) {
          MessageService.logError('messages.import.mermaidFailed');
          return;
        }

        // 使用类型保护函数检查是否是Promise
        let result: MindMapData;
        if (isPromise<MindMapData | null>(importResult)) {
          const awaitedResult = await importResult;
          if (!awaitedResult) {
            MessageService.logError('messages.import.mermaidFailed');
            return;
          }
          result = awaitedResult;
        } else {
          result = importResult as MindMapData;
        }

        // 修改：合并导入的数据，而不是替换
        // 1. 生成ID映射表以避免冲突
        const idMap = new Map<string, string>();
        
        // 2. 为新卡片生成新ID
        const newCards = result.cards.map(card => {
          const newId = `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          idMap.set(card.id, newId);
          return {
            ...card,
            id: newId
          };
        });
        
        // 3. 更新连接线中的卡片引用
        const newConnections = result.connections.map(conn => {
          const startCardId = idMap.get(conn.startCardId) || conn.startCardId;
          const endCardId = idMap.get(conn.endCardId) || conn.endCardId;
          return {
            ...conn,
            id: generateUniqueConnectionId(),
            startCardId,
            endCardId
          };
        });
        
        // 4. 合并现有数据和新数据
        cards.setCardsData([...cards.cards, ...newCards]);
        connections.setConnectionsData([...connections.connections, ...newConnections]);
        
        // 5. 选中新导入的卡片
        cards.selectCards(newCards.map(card => card.id));
        
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

      history.addToHistory(true); // 操作前保存

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
        MessageService.logError('messages.import.markdownFailed');
        return;
      }
      
      // 使用类型保护函数检查是否是Promise
      let result: MindMapData;
      if (isPromise<MindMapData>(importResult)) {
        result = await importResult;
      } else {
        result = importResult as MindMapData;
      }
      
      // 修改：合并导入的数据，而不是替换
      // 1. 生成ID映射表以避免冲突
      const idMap = new Map<string, string>();
      
      // 2. 为新卡片生成新ID
      const newCards = result.cards.map(card => {
        const newId = generateUniqueCardId();
        idMap.set(card.id, newId);
        return {
          ...card,
          id: newId
        };
      });
      
      // 3. 更新连接线中的卡片引用
      const newConnections = result.connections.map(conn => {
        const startCardId = idMap.get(conn.startCardId) || conn.startCardId;
        const endCardId = idMap.get(conn.endCardId) || conn.endCardId;
        return {
          ...conn,
          id: generateUniqueConnectionId(),
          startCardId,
          endCardId
        };
      });
      
      // 4. 合并现有数据和新数据
      cards.setCardsData([...cards.cards, ...newCards]);
      connections.setConnectionsData([...connections.connections, ...newConnections]);
      
      // 5. 选中新导入的卡片
      cards.selectCards(newCards.map(card => card.id));
      
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