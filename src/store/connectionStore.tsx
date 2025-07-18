import { create } from 'zustand';
import { IConnection, ICard, ArrowType } from '../types/CoreTypes';
import { generateConnectionId } from '../utils/idGenerator';
import { findExistingConnection, validateConnectionParams } from '../utils/connectionUtils';
import { Logger } from '../utils/log';
import { loadMindMapData, saveMindMapData } from '../utils/storageUtils';

// 定义连接状态类型
interface ConnectionState {
  // 状态
  connections: IConnection[];
  selectedConnectionIds: string[];
  connectionMode: boolean;
  connectionStart: string | null;
  editingConnectionId: string | null;
  connectionTargetCardId: string | null;
  originalSelectedCardId: string | null; // 添加记忆原始选中卡片ID的字段
  lastArrowType: ArrowType; // 新增：记录上次tab选定的箭头类型
  
  // 方法
  setConnectionsData: (connections: IConnection[]) => void;
  selectConnection: (connectionId: string, isMultiSelect: boolean) => void;
  selectConnections: (connectionIds: string[], clearPrevious?: boolean) => void;
  clearConnectionSelection: () => void;
  startConnectionMode: (startCardId: string) => void;
  cancelConnectionMode: () => void;
  completeConnection: (endCardId: string) => string | null;
  createConnection: (startCardId: string, endCardId: string) => IConnection | null;
  updateConnectionLabel: (connectionId: string, label: string) => void;
  handleConnectionsDelete: (options?: { connectionIds?: string[], cardId?: string, selected?: boolean }) => void;
  copySelectedConnections: () => IConnection[];
  selectNextConnection: (reverse: boolean) => void;
  setEditingConnectionId: (id: string | null) => void;
  setConnectionTargetCardId: (id: string | null) => void;
  setOriginalSelectedCardId: (id: string | null) => void;
  saveState: () => void;
  cycleArrowType: (connectionId: string) => void; // 新增循环切换箭头类型的方法
}

// 创建连接线状态的zustand存储
export const useConnectionStore = create<ConnectionState>((set, get) => ({
  // 状态
  connections: [],
  selectedConnectionIds: [],
  editingConnectionId: null,
  connectionMode: false,
  connectionStart: null,
  connectionTargetCardId: null,
  originalSelectedCardId: null, // 新增字段，用于保存原始选中的卡片ID
  lastArrowType: ArrowType.END, // 默认初始为END
  
  // 批量设置连线
  setConnectionsData: (connections) => {
    // 获取当前的卡片数据来验证连接线
    const cardStore = require('./cardStore').useCardStore.getState();
    const existingCardIds = new Set(cardStore.cards.map((card: ICard) => card.id));

    // 过滤掉引用不存在卡片的连接线
    const validConnections = connections.filter(conn => {
      const isValid = existingCardIds.has(conn.startCardId) && existingCardIds.has(conn.endCardId);
      if (!isValid) {
        console.warn(`移除无效连接线: ${conn.id} (${conn.startCardId} → ${conn.endCardId})，因为引用的卡片不存在`);
      }
      return isValid;
    });

    set({ connections: validConnections });
    // 在设置新数据后保存状态
    setTimeout(() => get().saveState(), 0);
  },
  
  // 选择连接线
  selectConnection: (connectionId, isMultiSelect) => {
    const { connections, selectedConnectionIds } = get();
    const connection = connections.find(conn => conn.id === connectionId);
    const connectionInfo = connection ? 
      `${connectionId} (${connection.startCardId} → ${connection.endCardId})` : 
      connectionId;
    
    if (isMultiSelect) {
      set((state) => {
        if (state.selectedConnectionIds.includes(connectionId)) {
          Logger.selection('取消选择', '连接线', connectionInfo);
          return { 
            selectedConnectionIds: state.selectedConnectionIds.filter(id => id !== connectionId) 
          };
        } else {
          Logger.selection('添加选择', '连接线', connectionInfo);
          return { 
            selectedConnectionIds: [...state.selectedConnectionIds, connectionId] 
          };
        }
      });
    } else {
      // 单选模式：如果当前已有选中项，执行取消再选中的逻辑
      const currentSelected = selectedConnectionIds.filter(id => id !== connectionId);
      if (currentSelected.length > 0) {
        // 当有其他连接线被取消选中时，记录日志
        const deselectedInfo = currentSelected.map(id => {
          const conn = connections.find(c => c.id === id);
          return conn ? `${id} (${conn.startCardId} → ${conn.endCardId})` : id;
        });
        Logger.selection('取消选择', '连接线', deselectedInfo);
      }
      Logger.selection('选择', '连接线', connectionInfo);
      set({ selectedConnectionIds: [connectionId] });
    }
  },
  
  // 批量选择连接线
  selectConnections: (connectionIds, clearPrevious = true) => {
    if (connectionIds.length === 0) return;
    
    const { connections } = get();
    // 记录选择的连接线信息
    const connectionInfos = connectionIds.map(id => {
      const conn = connections.find(c => c.id === id);
      return conn ? `${id} (${conn.startCardId} → ${conn.endCardId})` : id;
    });
    
    Logger.selection('批量选择', '连接线', connectionInfos);
    
    if (clearPrevious) {
      set({ selectedConnectionIds: connectionIds });
    } else {
      set((state) => ({ 
        selectedConnectionIds: [...new Set([...state.selectedConnectionIds, ...connectionIds])] 
      }));
    }
  },
  
  // 清除连接线选择
  clearConnectionSelection: () => {
    const { selectedConnectionIds } = get();
    if (selectedConnectionIds.length > 0) {
      Logger.selection('清除选择', '连接线', selectedConnectionIds);
      set({ selectedConnectionIds: [] });
    }
  },
  
  // 开始连线模式
  startConnectionMode: (startCardId) => {
    Logger.selection('开始', '连线模式', startCardId);
    
    // 保存原始选中的卡片ID
    set({ 
      connectionMode: true,
      connectionStart: startCardId,
      originalSelectedCardId: startCardId // 记录原始选中的卡片
    });
    
    // 添加调试日志
    console.log('已启用连线模式，起始卡片:', startCardId);
  },
  
  // 完成连线
  completeConnection: (endCardId) => {
    const { connectionStart } = get();
    
    if (!connectionStart || connectionStart === endCardId) {
      Logger.selection('取消', '连线模式', `起点: ${connectionStart}, 终点: ${endCardId}`);
      set({ 
        connectionMode: false,
        connectionStart: null,
        connectionTargetCardId: null
        // 不清除originalSelectedCardId，以便恢复选中
      });
      return null;
    }
    
    // 创建新连接线
    const newConnection = get().createConnection(connectionStart, endCardId);
    
    if (newConnection) {
      Logger.selection('完成', '连线', `${newConnection.id} (${connectionStart} → ${endCardId})`);
      
      // 重置连线模式状态，但保留原始选中卡片ID以便外部使用
      set({ 
        connectionMode: false, 
        connectionStart: null,
        connectionTargetCardId: null
      });
      
      return newConnection.id;
    }
    
    return null;
  },
  
  // 取消连线模式
  cancelConnectionMode: () => {
    const state = get();
    Logger.selection('取消', '连线模式', state.connectionStart);
    
    set({ 
      connectionMode: false, 
      connectionStart: null,
      connectionTargetCardId: null
      // 不清除originalSelectedCardId，以便恢复选中
    });
    
    // 添加调试日志
    console.log('已取消连线模式');
  },
  
  // 创建连线
  createConnection: (startCardId, endCardId) => {
    // 验证连线参数
    if (!validateConnectionParams(startCardId, endCardId)) {
      return null;
    }

    const { connections, lastArrowType } = get();

    // 检查是否已存在相同的连线（使用统一的工具函数）
    const existingConnection = findExistingConnection(connections, startCardId!, endCardId!);

    if (existingConnection) {
      console.log('连线已存在，无法创建重复连线:', {
        existing: `${existingConnection.startCardId} → ${existingConnection.endCardId}`,
        attempted: `${startCardId} → ${endCardId}`
      });

      // 提供用户友好的提示
      const existingConnectionInfo = `${existingConnection.startCardId} ↔ ${existingConnection.endCardId}`;
      Logger.selection('跳过创建', '重复连线', existingConnectionInfo);

      return null;
    }

    const newConnection: IConnection = {
      id: generateConnectionId(),
      startCardId,
      endCardId,
      label: '',
      arrowType: lastArrowType // 新增：使用上次tab选定的箭头类型
    };

    set((state) => ({
      connections: [...state.connections, newConnection]
    }));

    // 创建连接后保存状态
    setTimeout(() => get().saveState(), 0);

    return newConnection;
  },
  
  // 更新连线标签
  updateConnectionLabel: (connectionId, label) => {
    Logger.selection('更新标签', '连接线', connectionId);
    set((state) => ({
      connections: state.connections.map(conn => {
        if (conn.id === connectionId) {
          return { ...conn, label };
        }
        return conn;
      })
    }));
    
    // 更新标签后保存状态
    setTimeout(() => get().saveState(), 0);
  },
  
  // 循环切换箭头类型
  cycleArrowType: (connectionId) => {
    const { connections } = get();
    const connection = connections.find(conn => conn.id === connectionId);

    if (!connection) return;

    // 定义箭头类型循环顺序
    const arrowTypeOrder = [
      ArrowType.NONE,
      ArrowType.END,
      ArrowType.START,
      ArrowType.BOTH
    ];
    // 获取当前箭头类型的索引
    const currentType = connection.arrowType || ArrowType.NONE;
    const currentIndex = arrowTypeOrder.indexOf(currentType);
    // 计算下一个类型的索引
    const nextIndex = (currentIndex + 1) % arrowTypeOrder.length;
    const nextType = arrowTypeOrder[nextIndex];

    set((state) => ({
      connections: state.connections.map(conn => {
        if (conn.id === connectionId) {
          Logger.selection('更新', '连接线箭头类型', `${conn.id} (${currentType} → ${nextType})`);
          return { ...conn, arrowType: nextType };
        }
        return conn;
      }),
      lastArrowType: nextType // 记录最新的箭头类型
    }));

    setTimeout(() => get().saveState(), 0);
  },
  
  // 选择下一条连接线
  selectNextConnection: (reverse = false) => {
    const { connections, selectedConnectionIds } = get();
    
    if (connections.length === 0) return;
    
    // 如果没有选中的连接线，则选中第一条
    if (selectedConnectionIds.length === 0) {
      const connectionToSelect = reverse ? connections[connections.length - 1] : connections[0];
      Logger.selection('选择', '连接线', connectionToSelect.id);
      get().selectConnection(connectionToSelect.id, false);
      return;
    }
    
    // 以最后一个选中的连接线作为参考
    const lastSelectedId = selectedConnectionIds[selectedConnectionIds.length - 1];
    const currentIndex = connections.findIndex(c => c.id === lastSelectedId);
    
    if (currentIndex === -1) {
      // 如果找不到当前选中的连接线（可能已被删除），则选择第一条
      get().selectConnection(connections[0].id, false);
      return;
    }
    
    // 计算下一个选择的索引
    let nextIndex;
    if (reverse) {
      nextIndex = (currentIndex - 1 + connections.length) % connections.length;
    } else {
      nextIndex = (currentIndex + 1) % connections.length;
    }
    
    // 选择下一条连接线
    get().selectConnection(connections[nextIndex].id, false);
  },
  
  // 设置正在编辑的连接线ID
  setEditingConnectionId: (id) => set({ editingConnectionId: id }),
  
  // 设置连接目标卡片ID
  setConnectionTargetCardId: (id) => set({ connectionTargetCardId: id }),
  
  // 设置原始选中卡片ID
  setOriginalSelectedCardId: (cardId) => set({ originalSelectedCardId: cardId }),

  // 复制选中的连接线
  copySelectedConnections: () => {
    const { connections, selectedConnectionIds } = get();
    return connections.filter(conn => selectedConnectionIds.includes(conn.id));
  },
  
  // 删除连接线
  handleConnectionsDelete: (options = { selected: true }) => {
    try {
      const { connections, selectedConnectionIds } = get();
      let idsToDelete: string[] = [];
  
      if (options.connectionIds) {
        idsToDelete = options.connectionIds;
      } else if (options.cardId) {
        idsToDelete = connections
          .filter(conn => conn.startCardId === options.cardId || conn.endCardId === options.cardId)
          .map(conn => conn.id);
      } else if (options.selected) {
        idsToDelete = selectedConnectionIds;
      }
  
      if (!idsToDelete.length) return;
  
      // 日志记录
      const deleteInfo = idsToDelete.map(id => {
        const conn = connections.find(c => c.id === id);
        return conn ? `${id} (${conn.startCardId} → ${conn.endCardId})` : id;
      }).join(', ');
      
      Logger.selection('批量删除', '连接线', deleteInfo);
      
      // 更新状态，移除选中的连接线
      set((state) => ({
        connections: state.connections.filter(conn => !idsToDelete.includes(conn.id)),
        selectedConnectionIds: state.selectedConnectionIds.filter(id => !idsToDelete.includes(id)),
        editingConnectionId: state.editingConnectionId && idsToDelete.includes(state.editingConnectionId) ? 
          null : state.editingConnectionId
      }));
      
      // 删除后保存状态
      setTimeout(() => get().saveState(), 0);
  
    } catch (error) {
      console.error('删除连接线失败:', error);
    }
  },
  
  // 保存当前状态到本地存储
  saveState: () => {
    const { connections } = get();
    const cardStore = require('./cardStore').useCardStore.getState();
    
    // 确保卡片已经加载
    if (cardStore) {
      saveMindMapData({
        cards: cardStore.cards,
        connections
      });
    }
  }
}));

// 初始化函数：从本地存储加载数据
export const initializeConnectionStore = () => {
  const storedData = loadMindMapData();
  if (storedData && storedData.connections && storedData.connections.length > 0) {
    useConnectionStore.getState().setConnectionsData(storedData.connections);
  }
};