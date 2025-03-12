import { ICard, IConnection } from '../types';

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
          
          // 生成连接线
          let connectionText = `  ${startCardId}[${startContent}] --> `;
          
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
      
      // 检查第一行是否包含graph关键字
      let startLineIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes('graph')) {
          startLineIndex = i;
          break;
        }
      }
      
      // 如果没找到graph声明，尝试添加一个
      if (startLineIndex >= lines.length) {
        console.warn('没有找到图表类型声明，默认使用 graph LR');
        lines.unshift('graph LR');
        startLineIndex = 0;
      }
      
      // 跳过图表类型声明行
      const contentLines = lines.slice(startLineIndex + 1);
      
      const cards: ICard[] = [];
      const connections: IConnection[] = [];
      const nodeToCardId = new Map<string, string>();
      
      // 先分析所有的行，获取节点信息
      for (const line of contentLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        // 处理节点定义行或连接行
        const isConnectionLine = trimmedLine.includes('-->') || 
                                 trimmedLine.includes('==>') || 
                                 trimmedLine.includes('-.->')||
                                 trimmedLine.includes('--x') ||
                                 trimmedLine.includes('--o');
        
        if (isConnectionLine) {
          // 简化：按连接符分割，获取两端
          const parts = trimmedLine.split(/-->|==>|-\.->|--x|--o/);
          if (parts.length < 2) continue;
          
          // 分别处理起始节点和目标节点
          const rawStartNode = parts[0].trim();
          const rawEndNode = parts[1].trim();
          
          // 提取节点ID和内容
          const startNodeInfo = extractNodeInfo(rawStartNode);
          const endNodeInfo = extractNodeInfo(rawEndNode);
          
          if (!startNodeInfo || !endNodeInfo) continue;
          
          // 创建或获取节点对应的卡片
          const startCardId = getOrCreateCard(startNodeInfo, nodeToCardId, cards);
          const endCardId = getOrCreateCard(endNodeInfo, nodeToCardId, cards);
          
          // 创建连接
          const label = extractConnectionLabel(trimmedLine) || '';
          connections.push({
            id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            startCardId,
            endCardId,
            label
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
    
    // 添加标题 - 改为"key-mindmap"，级别为一级
    mdContent += '# key-mindmap\n\n';
    
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
    
    // 简化连接线数据
    const minimalConnectionData = data.connections.map(conn => ({
      id: conn.id,
      from: conn.startCardId,
      to: conn.endCardId,
      ...(conn.label ? { label: conn.label } : {})
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
   */
  importFromMarkdown: (mdContent: string): MindMapData | null => {
    try {
      // 修改正则表达式匹配方式，同时兼容新旧两种元数据格式
      const metadataMatch = mdContent.match(/<!-- mindmap-metadata\n([\s\S]*?)\nmindmap-metadata -->/);
      
      if (!metadataMatch || !metadataMatch[1]) {
        console.error('未找到有效的思维导图元数据');
        return null;
      }
      
      // 解析元数据JSON
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
        width: card.width || 160,
        height: card.height || 80,
        color: card.color || '#ffffff'
      }));
      
      // 使用分隔符"---"分割Markdown内容来提取卡片内容
      // 首先移除元数据部分
      let contentPart = mdContent.replace(/<!--[\s=]*mindmap-metadata[\s\S]*?mindmap-metadata[\s=]*-->/g, '').trim();
      
      // 移除开头的标题和描述（如果有）
      contentPart = contentPart.replace(/^# .+?\n\n> .+?\n\n/s, '');
      
      // 按分隔符分割内容
      const contentBlocks = contentPart.split(/\n---\n/).map(block => block.trim());
      
      // 为每个卡片分配内容
      let index = 0;
      while (index < contentBlocks.length && index < cards.length) {
        cards[index].content = contentBlocks[index];
        index++;
      }
      
      // 重构连接线数据
      const connections: IConnection[] = metadata.connections.map((conn: any) => ({
        id: conn.id,
        startCardId: conn.from,
        endCardId: conn.to,
        label: conn.label || ''
      }));
      
      return { cards, connections };
    } catch (error) {
      console.error('导入Markdown失败:', error);
      return null;
    }
  }
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