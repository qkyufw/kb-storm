import { useState, useRef, RefObject } from 'react';
import { ICard, IConnection } from '../../types/CoreTypes';
import { 
  exportAsMermaid, 
  exportToPNG, 
  exportToMarkdown,
  importFromMermaid,
  importFromMarkdown
} from '../../utils/storageUtils';
import { LayoutAlgorithm, LayoutOptions } from '../../utils/layoutUtils';

interface UseMindMapExportParams {
  cards: ICard[];
  connections: IConnection[];
  mapRef: RefObject<HTMLDivElement | null>; // 修改为接受 null
  addHistory: () => void;
  setCardsData: (cards: ICard[]) => void;
  setConnectionsData: (connections: IConnection[]) => void;
  setSelectedCardId: (id: string | null) => void;
  currentLayout: {
    algorithm: LayoutAlgorithm;
    options: LayoutOptions;
  };
}

/**
 * 处理思维导图的导入导出功能
 */
export const useMindMapExport = ({
  cards,
  connections,
  mapRef,
  addHistory,
  setCardsData,
  setConnectionsData,
  setSelectedCardId,
  currentLayout
}: UseMindMapExportParams) => {
  // 模态框状态管理
  const [showMermaidImportModal, setShowMermaidImportModal] = useState(false);
  const [showMermaidExportModal, setShowMermaidExportModal] = useState(false);
  const [mermaidCode, setMermaidCode] = useState('');
  const [showMarkdownExportModal, setShowMarkdownExportModal] = useState(false);
  const [markdownContent, setMarkdownContent] = useState('');
  const [showMarkdownImportModal, setShowMarkdownImportModal] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  
  // 设置 Canvas 引用
  const setCanvasRef = (ref: HTMLDivElement | null) => {
    canvasRef.current = ref;
  };
  
  // 导出为 Mermaid 格式
  const handleExportMermaid = () => {
    const code = exportAsMermaid({
      cards,
      connections
    });
    setMermaidCode(code);
    setShowMermaidExportModal(true);
  };
  
  // 导入 Mermaid 格式
  const handleImportMermaid = async (mermaidCode: string) => {
    const data = await importFromMermaid(mermaidCode);
    if (data) {
      setCardsData(data.cards);
      setConnectionsData(data.connections);
      setSelectedCardId(null);
      addHistory();
    }
  };
  
  // 导出为 Markdown 格式
  const handleExportMarkdown = () => {
    const content = exportToMarkdown({
      cards,
      connections
    });
    setMarkdownContent(content);
    setShowMarkdownExportModal(true);
  };
  
  // 导入 Markdown 格式
  const handleImportMarkdown = async (mdContent: string) => {
    // 获取当前布局信息
    const layoutInfo = {
      algorithm: currentLayout.algorithm,
      options: currentLayout.options,
      viewportInfo: {
        viewportWidth: canvasRef.current?.clientWidth || mapRef.current?.clientWidth || window.innerWidth,
        viewportHeight: canvasRef.current?.clientHeight || mapRef.current?.clientHeight || window.innerHeight,
        zoom: 1, // 默认缩放级别
        pan: { x: 0, y: 0 } // 默认视图位置
      }
    };
    
    // 将布局信息传递给导入函数
    const data = importFromMarkdown(mdContent, layoutInfo);
    
    if (data) {
      setCardsData(data.cards);
      setConnectionsData(data.connections);
      addHistory();
    }
  };

  // 导出为 PNG 图像
  const handleExportPNG = async () => {
    await exportToPNG({
      cards,
      connections
    }, mapRef as RefObject<HTMLDivElement>);
  };


  // 打开导入 Mermaid 对话框
  const handleOpenMermaidImport = () => {
    setShowMermaidImportModal(true);
  };

  // 打开导入 Markdown 对话框
  const handleOpenMarkdownImport = () => {
    setShowMarkdownImportModal(true);
  };
  
  return {
    // 模态框状态
    showMermaidImportModal,
    showMermaidExportModal,
    mermaidCode,
    showMarkdownExportModal,
    markdownContent,
    showMarkdownImportModal,
    
    // 关闭模态框方法
    closeMermaidImportModal: () => setShowMermaidImportModal(false),
    closeMermaidExportModal: () => setShowMermaidExportModal(false),
    closeMarkdownExportModal: () => setShowMarkdownExportModal(false),
    closeMarkdownImportModal: () => setShowMarkdownImportModal(false),
    
    // 导出方法
    handleExportMermaid,
    handleExportMarkdown,
    handleExportPNG,
    
    // 导入方法
    handleImportMermaid,
    handleImportMarkdown,
    
    // 打开导入对话框
    handleOpenMermaidImport,
    handleOpenMarkdownImport,
    
    // 设置 Canvas 引用
    setCanvasRef
  };
};

export default useMindMapExport;
