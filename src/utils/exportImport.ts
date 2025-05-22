import { ICard, IConnection } from '../types/CoreTypes';
import { LayoutAlgorithm, LayoutOptions, calculateNewCardPosition } from './layoutUtils';

// 引入箭头类型枚举（如果不存在，需要从其他文件导入）
import { ArrowType } from '../types/CoreTypes';

interface MindMapData {
  cards: ICard[];
  connections: IConnection[];
}

// 简化内容，避免复杂字符串和特殊字符
function simplifyContent(content: string): string {
  return content
    // 将多行内容简化为单行
    .replace(/\n/g, ' ')
    // 移除引号，避免格式问题
    .replace(/["']/g, '')
    // 限制长度，太长的内容会导致图形难以显示
    .substring(0, 30)
    // 如果内容被截断，添加省略号
    .concat(content.length > 30 ? '...' : '');
}

/**
 * 导出与导入工具集
 */
export const ExportImportUtils = {
  /**
   * 将思维导图导出为Mermaid格式
   */
  exportToMermaid: (data: MindMapData): string => {
    let mermaidCode = 'graph LR\n';
    
    // 记录已处理的连接，避免重复
    const processedConnections = new Set<string>();
    
    // 生成简单的节点ID，避免复杂字符串
    const cardIds = new Map<string, string>();
    data.cards.forEach((card, index) => {
      // 使用简单的字母或数字作为ID
      const simpleId = `node${index + 1}`;
      cardIds.set(card.id, simpleId);
    });
    
    // 首先处理有连接关系的卡片
    data.connections.forEach(conn => {
      const startCardId = cardIds.get(conn.startCardId);
      const endCardId = cardIds.get(conn.endCardId);
      
      if (startCardId && endCardId) {
        const startCard = data.cards.find(c => c.id === conn.startCardId);
        const endCard = data.cards.find(c => c.id === conn.endCardId);
        
        if (startCard && endCard) {
          // 简化内容，避免特殊字符
          const startContent = simplifyContent(startCard.content);
          const endContent = simplifyContent(endCard.content);
          
          // 获取箭头类型并映射到Mermaid连接符
          let connectionSymbol = '-->';
          if (conn.arrowType) {
            switch (conn.arrowType) {
              case ArrowType.NONE:
                connectionSymbol = '---';
                break;
              case ArrowType.START:
                connectionSymbol = '<--';
                break;
              case ArrowType.END:
                connectionSymbol = '-->';
                break;
              case ArrowType.BOTH:
                connectionSymbol = '<-->';
                break;
            }
          }
          
          // 生成连接线
          let connectionText = `  ${startCardId}[${startContent}] ${connectionSymbol} `;
          
          // 如果连接线有标签，则添加标签
          if (conn.label && conn.label.trim()) {
            // 简化标签
            const simpleLabel = simplifyContent(conn.label);
            connectionText += `|${simpleLabel}| `;
          }
          
          connectionText += `${endCardId}[${endContent}]`;
          
          mermaidCode += `${connectionText}\n`;
          
          // 标记这些卡片已被处理
          processedConnections.add(conn.startCardId);
          processedConnections.add(conn.endCardId);
        }
      }
    });
    
    // 处理剩余没有连接的卡片
    data.cards.forEach(card => {
      if (!processedConnections.has(card.id)) {
        const cardId = cardIds.get(card.id);
        if (cardId) {
          const content = simplifyContent(card.content);
          mermaidCode += `  ${cardId}[${content}]\n`;
        }
      }
    });
    
    return mermaidCode;
  },
  
  /**
   * 从Mermaid格式导入思维导图
   */
  importFromMermaid: (mermaidCode: string): MindMapData => {
    try {
      const lines = mermaidCode.split('\n');
      const cards: ICard[] = [];
      const connections: IConnection[] = [];
      
      // 用于记录节点ID到卡片ID的映射
      const nodeToCardId = new Map<string, string>();
      
      // 提取所有有效的行（删除空行和图表定义行）
      for (let line of lines) {
        const trimmedLine = line.trim();
        
        // 跳过空行和图表定义行
        if (!trimmedLine || trimmedLine.startsWith('graph') || trimmedLine.startsWith('flowchart')) {
          continue;
        }
        
        // 检查行是否包含连接
        const connectionMatch = trimmedLine.match(/(\w+)\[(.*?)\](.*?)(\w+)\[(.*?)\]/);
        
        if (connectionMatch) {
          // 提取连接信息
          const startId = connectionMatch[1];
          const startContent = connectionMatch[2];
          const connectionSymbol = connectionMatch[3].trim(); // 获取连接符号
          const endId = connectionMatch[4];
          const endContent = connectionMatch[5];
          
          // 获取或创建卡片
          const startCardId = getOrCreateCard({ id: startId, content: startContent }, nodeToCardId, cards);
          const endCardId = getOrCreateCard({ id: endId, content: endContent }, nodeToCardId, cards);
          
          // 确定箭头类型
          let arrowType = ArrowType.END; // 默认箭头类型
          
          // 根据连接符号确定箭头类型
          if (connectionSymbol === '<-->') {
            arrowType = ArrowType.BOTH;
          } else if (connectionSymbol === '<--') {
            arrowType = ArrowType.START;
          } else if (connectionSymbol === '-->') {
            arrowType = ArrowType.END;
          } else if (connectionSymbol === '---') {
            arrowType = ArrowType.NONE;
          }
          
          // 创建连接
          const label = extractConnectionLabel(trimmedLine) || '';
          connections.push({
            id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            startCardId,
            endCardId,
            label,
            arrowType
          });
        } 
        else {
          // 处理单独的节点定义 
          const nodeInfo = extractNodeInfo(trimmedLine);
          if (nodeInfo) {
            getOrCreateCard(nodeInfo, nodeToCardId, cards);
          }
        }
      }
      
      // 如果解析失败（没有节点），返回一个默认节点
      if (cards.length === 0) {
        cards.push({
          id: `card-${Date.now()}`,
          content: '导入失败，请检查Mermaid代码格式',
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          color: '#ffcccc'
        });
      }
      
      // 摆放卡片位置
      arrangeCards(cards);
      
      return { cards, connections };
    } catch (error) {
      console.error('Mermaid导入失败:', error);
      
      // 返回单个错误提示卡片
      return {
        cards: [{
          id: `card-${Date.now()}`,
          content: `导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
          x: 100,
          y: 100,
          width: 200,
          height: 100,
          color: '#ffcccc'
        }],
        connections: []
      };
    }
  },

  /**
   * 导出为高质量PNG图像（增强版）
   */
  exportToPNG: async (
    data: MindMapData, 
    canvasRef: React.RefObject<HTMLDivElement>,
    options?: { scale?: number, backgroundColor?: string, format?: 'png' | 'jpeg' | 'webp' }
  ): Promise<string | null> => {
    if (!canvasRef.current) {
      console.error("找不到画布元素");
      return null;
    }
    
    const scale = options?.scale || 2;
    const format = options?.format || 'png';
    const backgroundColor = options?.backgroundColor || '#ffffff';
    const mimeType = `image/${format}`;
    
    try {
      // 使用html2canvas库进行截图
      const html2canvas = await import('html2canvas');
      const canvas = await html2canvas.default(canvasRef.current, {
        backgroundColor: backgroundColor,
        scale: scale, // 提高分辨率
        useCORS: true, // 允许加载跨域图片
        logging: false, // 关闭日志
        allowTaint: true, // 允许渲染跨域元素
        foreignObjectRendering: true // 使用ForeignObject进行渲染以提高质量
      });
      
      // 返回数据URI
      return canvas.toDataURL(mimeType, format === 'jpeg' ? 0.9 : undefined);
    } catch (error) {
      console.error(`导出${format.toUpperCase()}失败:`, error);
      return null;
    }
  },

  /**
   * 将思维导图导出为Markdown格式
   * 卡片内容使用"---"分隔，元数据保存在文件末尾
   */
  exportToMarkdown: (data: MindMapData): string => {
    // 生成卡片内容部分
    let mdContent = '';
    
    // 添加标题 - 改为"kbstorm"，级别为一级
    mdContent += '# kbstorm\n\n';
    
    // 为了更好地组织内容，先找出所有"根节点"（入度为0的节点）
    const inDegrees = new Map<string, number>();
    data.cards.forEach(card => inDegrees.set(card.id, 0));
    
    // 计算每个节点的入度
    data.connections.forEach(conn => {
      const endCard = conn.endCardId;
      inDegrees.set(endCard, (inDegrees.get(endCard) || 0) + 1);
    });
    
    // 找出入度为0的节点作为根节点
    const rootCardIds = Array.from(inDegrees.entries())
      .filter(([_, degree]) => degree === 0)
      .map(([id, _]) => id);
    
    // 如果没有根节点，就使用所有卡片
    const startCards = rootCardIds.length > 0 
      ? data.cards.filter(card => rootCardIds.includes(card.id)) 
      : data.cards;
    
    // 处理过的卡片ID
    const processedCardIds = new Set<string>();
    
    // 递归处理卡片及其连接的卡片
    const processCard = (card: ICard, isFirst: boolean = true): void => {
      if (processedCardIds.has(card.id)) return;
      
      processedCardIds.add(card.id);
      
      // 添加分隔符，第一个卡片不需要分隔符
      if (!isFirst) {
        mdContent += '---\n\n';
      }
      
      // 添加卡片内容为普通文本，不使用标题
      mdContent += `${card.content.trim()}\n\n`;
      
      // 查找连接到此卡片的卡片
      const connectedCards = data.connections
        .filter(conn => conn.startCardId === card.id)
        .map(conn => data.cards.find(c => c.id === conn.endCardId))
        .filter((c): c is ICard => c !== undefined);
      
      // 递归处理连接的卡片
      connectedCards.forEach((connCard, index) => {
        processCard(connCard, false);
      });
    };
    
    // 处理每个起始卡片
    let isFirst = true;
    startCards.forEach(card => {
      processCard(card, isFirst);
      isFirst = false;
    });
    
    // 处理任何剩余未处理的卡片
    data.cards
      .filter(card => !processedCardIds.has(card.id))
      .forEach(card => {
        // 添加分隔符
        if (!isFirst) {
          mdContent += '---\n\n';
        }
        mdContent += `${card.content.trim()}\n\n`;
        isFirst = false;
      });
    
    // 简化卡片数据，只保留必要的字段
    const minimalCardData = data.cards.map(card => ({
      id: card.id,
      x: Math.round(card.x),
      y: Math.round(card.y),
      width: card.width,
      height: card.height,
      color: card.color
    }));
    
    // 简化连接线数据，确保包含箭头类型
    const minimalConnectionData = data.connections.map(conn => ({
      id: conn.id,
      from: conn.startCardId,
      to: conn.endCardId,
      ...(conn.label ? { label: conn.label } : {}),
      ...(conn.arrowType !== undefined ? { arrowType: conn.arrowType } : {}) // 添加箭头类型
    }));
    
    // 压缩数据表示
    const metadata = {
      version: "1.0",
      cards: minimalCardData,
      connections: minimalConnectionData
    };

    // 将元数据添加到Markdown文档末尾，使用span标签结合CSS使其在渲染时隐藏
    mdContent += `\n\n<span style="display:none"><!-- mindmap-metadata
${JSON.stringify(metadata, null, 0)}
mindmap-metadata --></span>`;
    
    return mdContent;
  },
  
  /**
   * 从Markdown格式导入思维导图
   * 支持两种模式：
   * 1. 导入带元数据的Markdown - 完全恢复原始思维导图
   * 2. 导入普通Markdown - 按照当前布局算法创建卡片
   */
  importFromMarkdown: (
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
  ): MindMapData | null => {
    try {
      // 设置默认值
      const defaults = {
        color: cardDefaults?.defaultColor || '#ffffff',  // 默认白色
        width: cardDefaults?.defaultWidth || 200,        // 默认宽度
        height: cardDefaults?.defaultHeight || 100,      // 默认高度
        padding: cardDefaults?.defaultPadding || 10      // 默认内边距
      };

      // 检查是否需要使用随机颜色
      const useRandomColors = cardDefaults?.defaultColor === "random";

      // 首先移除所有HTML标签，包括span标签和注释
      let cleanContent = mdContent.replace(/<span[^>]*>[\s\S]*?<\/span>/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim();
      
      // 尝试匹配元数据部分
      const metadataMatch = mdContent.match(/<!-- mindmap-metadata\n([\s\S]*?)\nmindmap-metadata -->/);
      
      // 如果找到元数据，使用完整导入模式
      if (metadataMatch && metadataMatch[1]) {
        // 解析元数据JSON - 完整导入
        const metadata = JSON.parse(metadataMatch[1]);
        
        if (!metadata.cards || !metadata.connections) {
          console.error('元数据格式无效');
          return null;
        }
        
        // 重构卡片数据
        const cards: ICard[] = metadata.cards.map((card: any) => ({
          id: card.id,
          content: '', // 内容将从Markdown部分提取
          x: card.x,
          y: card.y,
          width: card.width || defaults.width,
          height: card.height || defaults.height,
          color: card.color || defaults.color
        }));
        
        // 移除元数据部分
        cleanContent = cleanContent.replace(/<span[^>]*>[\s\S]*?<\/span>/g, '')
          .replace(/<!--[\s\S]*?-->/g, '')
          .trim();
        
        // 移除开头的标题行 - 更改为更通用的方式，不再依赖于特定标题
        cleanContent = cleanContent.replace(/^# [^\n]*\n+/, '');
        
        // 按分隔符分割内容
        let contentBlocks = cleanContent
          // 统一换行符
          .replace(/\r\n/g, '\n')
          // 处理可能存在的多余空行
          .replace(/\n\s*\n/g, '\n')
          // 使用更宽松的分隔符匹配
          .split(/\n\s*---\s*\n/)
          .map(block => block.trim())
          .filter(block => block.length > 0);
        
        // 为每个卡片分配内容
        let index = 0;
        while (index < contentBlocks.length && index < cards.length) {
          cards[index].content = contentBlocks[index];
          index++;
        }
        
        // 重构连接线数据，确保包含箭头类型
        const connections: IConnection[] = metadata.connections.map((conn: any) => ({
          id: conn.id,
          startCardId: conn.from,
          endCardId: conn.to,
          label: conn.label || '',
          arrowType: conn.arrowType !== undefined ? conn.arrowType : ArrowType.END // 添加默认为END的箭头类型
        }));
        
        return { cards, connections };
      } 
      else {
        // 无元数据的情况 - 创建新的思维导图
        console.log('未找到元数据，使用普通导入模式');
        
        // 移除开头的标题行
        cleanContent = cleanContent.replace(/^# [^\n]*\n+/, '');
        
        // 按分隔符"---"分割内容块
        let contentBlocks = cleanContent
          // 统一换行符
          .replace(/\r\n/g, '\n')
          // 处理可能存在的多余空行
          .replace(/\n\s*\n/g, '\n')
          // 使用更宽松的分隔符匹配
          .split(/\n\s*---\s*\n/)
          .map(block => block.trim())
          .filter(block => block.length > 0);
        
        // 如果没有分隔符，则尝试按段落分割
        if (contentBlocks.length <= 1) {
          const paragraphs = cleanContent.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 0);
          if (paragraphs.length > 0) {
            contentBlocks = paragraphs;
          }
        }
        
        // 如果连段落都没有，则使用整个文本作为一个内容块
        if (contentBlocks.length === 0 && cleanContent.trim()) {
          contentBlocks.push(cleanContent);
        }
        
        // 创建新的卡片，不创建连接
        const cards: ICard[] = [];
        const connections: IConnection[] = []; // 空数组，不创建连接线
        
        // 获取布局信息
        const currentLayout = layoutInfo || { 
          algorithm: 'grid' as LayoutAlgorithm, 
          options: { spacing: 180, jitter: 10 } 
        };
        
        // 使用第一个内容块的位置作为起点
        let lastPosition = { x: 100, y: 100 };
        
        // 根据当前布局算法创建卡片
        contentBlocks.forEach((content, index) => {
          // 为内容块创建卡片
          const cardId = `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          
          // 使用选择的布局算法计算位置
          const position = calculateNewCardPosition(
            lastPosition,
            { width: defaults.width, height: defaults.height },
            cards,
            currentLayout.algorithm,
            currentLayout.options,
            currentLayout.viewportInfo
          );
          
          // 更新最后位置以便下一个卡片使用
          lastPosition = position;
          
          // 创建卡片，如果指定了使用随机颜色，则为每张卡片单独生成颜色
          cards.push({
            id: cardId,
            content: content,
            x: position.x,
            y: position.y,
            width: defaults.width,
            height: defaults.height,
            color: useRandomColors ? getRandomColor() : defaults.color
          });
        });
        
        return { cards, connections };
      }
    } catch (error) {
      console.error('导入Markdown失败:', error);
      return null;
    }
  },

};

// 从节点字符串中提取节点ID和内容
function extractNodeInfo(nodeStr: string): { id: string, content: string } | null {
  // 匹配形如 A["内容"] 或 A["内容"] 或 A[内容] 或 简单的 A 的格式
  const match = nodeStr.match(/^([A-Za-z0-9_]+)(?:\["([^"]*)"?\]|\("([^"]*)"?\)|\[([^\]]*)\]|\(([^)]*)\)|)$/);
  if (!match) return null;
  
  const id = match[1];
  // 获取内容，优先使用引号内的内容
  const content = match[2] || match[3] || match[4] || match[5] || id;
  
  return { id, content: content.replace(/<br\s*\/?>/g, '\n') };
}

// 获取或创建卡片
function getOrCreateCard(
  nodeInfo: { id: string, content: string },
  nodeToCardId: Map<string, string>,
  cards: ICard[]
): string {
  // 检查节点是否已经有对应的卡片
  if (nodeToCardId.has(nodeInfo.id)) {
    return nodeToCardId.get(nodeInfo.id)!;
  }
  
  // 创建新卡片
  const cardId = `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  nodeToCardId.set(nodeInfo.id, cardId);
  
  cards.push({
    id: cardId,
    content: nodeInfo.content,
    x: 0,  // 位置稍后会重新计算
    y: 0,
    width: 160,
    height: 80,
    color: `hsl(${Math.random() * 360}, 70%, 85%)`
  });
  
  return cardId;
}

// 提取连接标签
function extractConnectionLabel(connectionStr: string): string | null {
  const match = connectionStr.match(/\|([^|]*)\|/);
  return match ? match[1].replace(/<br\s*\/?>/g, '\n') : null;
}

// 简单排列卡片位置
function arrangeCards(cards: ICard[]): void {
  const columns = Math.ceil(Math.sqrt(cards.length));
  const spacing = 200;
  
  cards.forEach((card, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    card.x = 100 + col * spacing;
    card.y = 100 + row * spacing;
  });
}

// 生成随机颜色
function getRandomColor(): string {
  const randomColor = `hsl(${Math.random() * 360}, 70%, 85%)`;
  return randomColor;
}