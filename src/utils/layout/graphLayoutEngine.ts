import { ICard, IConnection, ArrowType } from '../../types/CoreTypes';

/**
 * 图节点接口
 */
export interface GraphNode {
  id: string;
  card: ICard;
  children: Set<string>;
  parents: Set<string>;
  level: number;
  visited: boolean;
}

/**
 * 布局配置接口
 */
export interface LayoutConfig {
  levelSpacing: number;    // 层级间距
  nodeSpacing: number;     // 同层节点间距
  startX: number;          // 起始X坐标
  startY: number;          // 起始Y坐标
  maxColumns: number;      // 网格布局最大列数
  gridSpacing: number;     // 网格间距
}

/**
 * 默认布局配置
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  levelSpacing: 250,
  nodeSpacing: 200,
  startX: 100,
  startY: 100,
  maxColumns: 6,
  gridSpacing: 220
};

/**
 * 图布局引擎
 * 负责根据图结构智能排列卡片位置
 */
export class GraphLayoutEngine {
  private config: LayoutConfig;

  constructor(config: Partial<LayoutConfig> = {}) {
    this.config = { ...DEFAULT_LAYOUT_CONFIG, ...config };
  }

  /**
   * 主要布局方法
   * @param cards 卡片数组
   * @param connections 连接数组
   */
  public arrangeCards(cards: ICard[], connections: IConnection[] = []): void {
    if (cards.length === 0) return;
    
    // 如果没有连接，使用改进的网格布局
    if (connections.length === 0) {
      this.arrangeCardsInGrid(cards);
      return;
    }
    
    // 基于连接关系的层次布局
    this.arrangeCardsHierarchically(cards, connections);
  }

  /**
   * 改进的网格布局 - 考虑卡片内容长度
   */
  private arrangeCardsInGrid(cards: ICard[]): void {
    const { startX, startY, gridSpacing, maxColumns } = this.config;
    
    // 根据内容长度排序，长内容的卡片优先放置
    const sortedCards = [...cards].sort((a, b) => b.content.length - a.content.length);
    
    // 计算最优列数 - 考虑卡片数量和屏幕利用率
    const columns = Math.min(Math.ceil(Math.sqrt(cards.length * 1.2)), maxColumns);
    
    sortedCards.forEach((card, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      
      card.x = startX + col * gridSpacing;
      card.y = startY + row * gridSpacing;
    });
  }

  /**
   * 基于连接关系的层次布局
   */
  private arrangeCardsHierarchically(cards: ICard[], connections: IConnection[]): void {
    // 构建图结构
    const graph = this.buildGraph(cards, connections);
    
    // 找到根节点（入度为0的节点）
    const roots = this.findRootNodes(graph);
    
    // 如果没有明确的根节点，选择连接最多的节点作为根
    if (roots.length === 0) {
      const mostConnectedNode = this.findMostConnectedNode(graph);
      if (mostConnectedNode) {
        roots.push(mostConnectedNode);
      }
    }
    
    // 如果仍然没有根节点，使用网格布局
    if (roots.length === 0) {
      this.arrangeCardsInGrid(cards);
      return;
    }
    
    // 执行层次布局
    this.performHierarchicalLayout(cards, graph, roots);
  }

  /**
   * 构建图结构
   */
  private buildGraph(cards: ICard[], connections: IConnection[]): Map<string, GraphNode> {
    const graph = new Map<string, GraphNode>();
    
    // 初始化所有节点
    cards.forEach(card => {
      graph.set(card.id, {
        id: card.id,
        card: card,
        children: new Set(),
        parents: new Set(),
        level: -1,
        visited: false
      });
    });
    
    // 添加连接关系
    connections.forEach(conn => {
      const startNode = graph.get(conn.startCardId);
      const endNode = graph.get(conn.endCardId);
      
      if (startNode && endNode) {
        // 根据箭头类型确定方向
        if (conn.arrowType === ArrowType.END || conn.arrowType === ArrowType.BOTH) {
          startNode.children.add(endNode.id);
          endNode.parents.add(startNode.id);
        }
        if (conn.arrowType === ArrowType.START || conn.arrowType === ArrowType.BOTH) {
          endNode.children.add(startNode.id);
          startNode.parents.add(endNode.id);
        }
        if (conn.arrowType === ArrowType.NONE) {
          // 无向连接，双向添加
          startNode.children.add(endNode.id);
          endNode.children.add(startNode.id);
        }
      }
    });
    
    return graph;
  }

  /**
   * 找到根节点
   */
  private findRootNodes(graph: Map<string, GraphNode>): string[] {
    const roots: string[] = [];
    
    graph.forEach((node, id) => {
      if (node.parents.size === 0 && node.children.size > 0) {
        roots.push(id);
      }
    });
    
    return roots;
  }

  /**
   * 找到连接最多的节点
   */
  private findMostConnectedNode(graph: Map<string, GraphNode>): string | null {
    let maxConnections = 0;
    let mostConnectedId: string | null = null;
    
    graph.forEach((node, id) => {
      const totalConnections = node.children.size + node.parents.size;
      if (totalConnections > maxConnections) {
        maxConnections = totalConnections;
        mostConnectedId = id;
      }
    });
    
    return mostConnectedId;
  }

  /**
   * 执行层次布局
   */
  private performHierarchicalLayout(cards: ICard[], graph: Map<string, GraphNode>, roots: string[]): void {
    const { levelSpacing, nodeSpacing, startX, startY } = this.config;
    
    // 分配层级
    this.assignLevels(graph, roots);
    
    // 按层级分组
    const levels = this.groupByLevel(graph);
    
    // 为每一层布局节点
    levels.forEach((levelNodes, level) => {
      const y = startY + level * levelSpacing;
      const totalWidth = (levelNodes.length - 1) * nodeSpacing;
      const startXForLevel = startX - totalWidth / 2;
      
      // 对同层节点进行排序，优先考虑与上层的连接关系
      const sortedNodes = this.sortNodesByConnections(levelNodes, graph, level);
      
      sortedNodes.forEach((nodeId, index) => {
        const node = graph.get(nodeId);
        if (node) {
          node.card.x = startXForLevel + index * nodeSpacing;
          node.card.y = y;
        }
      });
    });
    
    // 优化布局 - 减少连线交叉
    this.optimizeLayout(graph, levels);
  }

  /**
   * 分配层级
   */
  private assignLevels(graph: Map<string, GraphNode>, roots: string[]): void {
    const queue: Array<{nodeId: string, level: number}> = [];
    
    // 从根节点开始
    roots.forEach(rootId => {
      const rootNode = graph.get(rootId);
      if (rootNode) {
        rootNode.level = 0;
        queue.push({nodeId: rootId, level: 0});
      }
    });
    
    // BFS 分配层级
    while (queue.length > 0) {
      const {nodeId, level} = queue.shift()!;
      const node = graph.get(nodeId);
      
      if (!node || node.visited) continue;
      node.visited = true;
      
      // 处理子节点
      node.children.forEach(childId => {
        const childNode = graph.get(childId);
        if (childNode && !childNode.visited) {
          childNode.level = Math.max(childNode.level, level + 1);
          queue.push({nodeId: childId, level: childNode.level});
        }
      });
    }
    
    // 处理未访问的节点（可能是孤立的环）
    graph.forEach((node, id) => {
      if (!node.visited) {
        node.level = 0;
      }
    });
  }

  /**
   * 按层级分组
   */
  private groupByLevel(graph: Map<string, GraphNode>): Map<number, string[]> {
    const levels = new Map<number, string[]>();
    
    graph.forEach((node, id) => {
      const level = node.level;
      if (!levels.has(level)) {
        levels.set(level, []);
      }
      levels.get(level)!.push(id);
    });
    
    return levels;
  }

  /**
   * 根据连接关系排序同层节点
   */
  private sortNodesByConnections(nodeIds: string[], graph: Map<string, GraphNode>, level: number): string[] {
    return nodeIds.sort((a, b) => {
      const nodeA = graph.get(a);
      const nodeB = graph.get(b);
      
      if (!nodeA || !nodeB) return 0;
      
      // 优先考虑与上一层的连接数量
      const connectionsA = Array.from(nodeA.parents).filter(parentId => {
        const parent = graph.get(parentId);
        return parent && parent.level === level - 1;
      }).length;
      
      const connectionsB = Array.from(nodeB.parents).filter(parentId => {
        const parent = graph.get(parentId);
        return parent && parent.level === level - 1;
      }).length;
      
      return connectionsB - connectionsA;
    });
  }

  /**
   * 优化布局以减少连线交叉
   */
  private optimizeLayout(graph: Map<string, GraphNode>, levels: Map<number, string[]>): void {
    const { nodeSpacing, startX } = this.config;
    const levelArray = Array.from(levels.keys()).sort((a, b) => a - b);
    
    for (let i = 1; i < levelArray.length; i++) {
      const currentLevel = levelArray[i];
      const currentNodes = levels.get(currentLevel) || [];
      
      // 计算每个节点与上层连接的"重心"
      const nodeWeights = currentNodes.map(nodeId => {
        const node = graph.get(nodeId);
        if (!node) return {nodeId, weight: 0};
        
        let totalWeight = 0;
        let connectionCount = 0;
        
        node.parents.forEach(parentId => {
          const parent = graph.get(parentId);
          if (parent && parent.level === currentLevel - 1) {
            totalWeight += parent.card.x;
            connectionCount++;
          }
        });
        
        return {
          nodeId,
          weight: connectionCount > 0 ? totalWeight / connectionCount : node.card.x
        };
      });
      
      // 按权重排序
      nodeWeights.sort((a, b) => a.weight - b.weight);
      
      // 重新分配 x 坐标
      const totalWidth = (nodeWeights.length - 1) * nodeSpacing;
      const startXForLevel = startX - totalWidth / 2;
      
      nodeWeights.forEach((item, index) => {
        const node = graph.get(item.nodeId);
        if (node) {
          node.card.x = startXForLevel + index * nodeSpacing;
        }
      });
    }
  }

  /**
   * 更新布局配置
   */
  public updateConfig(newConfig: Partial<LayoutConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前配置
   */
  public getConfig(): LayoutConfig {
    return { ...this.config };
  }
}
