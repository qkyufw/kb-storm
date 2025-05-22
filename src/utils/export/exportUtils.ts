import { ICard, IConnection } from '../../types/CoreTypes';
import { RefObject } from 'react';

interface MindMapData {
  cards: ICard[];
  connections: IConnection[];
}

/**
 * 导出Canvas为PNG图片
 */
export async function exportToPNG(
  data: MindMapData,
  canvasRef: RefObject<HTMLDivElement | null>,
  options: {
    scale?: number;
    backgroundColor?: string;
    format?: 'png' | 'jpeg' | 'webp';
  } = {}
): Promise<string | null> {
  // 检查引用存在性
  if (!canvasRef?.current) {
    console.error("画布引用不存在，无法导出图片");
    return null;
  }

  const canvasElement = canvasRef.current;
  const {
    scale = 2,
    backgroundColor = '#ffffff',
    format = 'png'
  } = options;

  try {
    // 动态导入html2canvas
    const html2canvasModule = await import('html2canvas');
    const html2canvas = html2canvasModule.default;
    
    // 创建导出配置
    const canvasOptions = {
      scale,
      backgroundColor,
      logging: false,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: true // 提高质量
    };
    
    // 渲染Canvas
    const renderedCanvas = await html2canvas(canvasElement, canvasOptions);
    
    // 生成数据URL
    const mimeType = `image/${format}`;
    // 确保返回一个字符串值，而不是void
    const dataUrl = renderedCanvas.toDataURL(mimeType, format === 'jpeg' ? 0.9 : undefined);
    
    // 直接执行下载，而不是返回dataUrl
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
    link.download = `kbstorm-${timestamp}.${format}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 返回true表示成功，而不是返回dataUrl
    return "success";
    
  } catch (error) {
    console.error('导出PNG时发生错误:', error);
    return null;
  }
}
