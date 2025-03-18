// 连线管理Hook
import { useState, useCallback } from 'react';
import { ICard, IConnection } from '../types';
import { findNearestCardInDirection as findNearestCard } from '../utils/positionUtils';
import { LogUtils } from '../utils/logUtils';

export const useConnections = () => {
  const [connections, setConnections] = useState<IConnection[]>([]);
  const [connectionMode, setConnectionMode] = useState<boolean>(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>([]); // 添加选中连接线ID数组
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [connectionTargetCardId, setConnectionTargetCardId] = useState<string | null>(null);
  
  // 创建连线
  const createConnection = useCallback((startCardId: string, endCardId: string) => {
    if (startCardId === endCardId) return null;
    
    const newConnection: IConnection = {
      id: `conn-${Date.now()}`,
      startCardId,
      endCardId,
    };
    
    setConnections(prevConnections => [...prevConnections, newConnection]);
    return newConnection;
  }, []);
  
  // 删除连接到指定卡片的所有连线
  const deleteCardConnections = useCallback((cardId: string) => {
    setConnections(prevConnections => 
      prevConnections.filter(conn => 
        conn.startCardId !== cardId && conn.endCardId !== cardId
      )
    );
  }, []);
  
  // 删除特定连线
  const deleteConnection = useCallback((connectionId: string) => {
    setConnections(prevConnections => 
      prevConnections.filter(conn => conn.id !== connectionId)
    );
    
    // 如果被删除的连接线正在被选中，清除选中状态
    setSelectedConnectionIds(prev => 
      prev.filter(id => id !== connectionId)
    );
  }, []);
  
  // 更新连线标签
  const updateConnectionLabel = useCallback((connectionId: string, label: string) => {
    LogUtils.selection('更新标签', '连接线', connectionId);
    setConnections(prevConnections => 
      prevConnections.map(conn => {
        if (conn.id === connectionId) {
          return { ...conn, label };
        }
        return conn;
      })
    );
  }, []);
  
  // 开始连线模式
  const startConnectionMode = useCallback((startCardId: string) => {
    LogUtils.selection('开始', '连线模式', startCardId);
    setConnectionMode(true);
    setConnectionStart(startCardId);
  }, []);
  
  // 完成连线
  const completeConnection = useCallback((endCardId: string) => {
    if (!connectionStart || connectionStart === endCardId) {
      LogUtils.selection('取消', '连线模式', `起点: ${connectionStart}, 终点: ${endCardId}`);
      setConnectionMode(false);
      setConnectionStart(null);
      return null;
    }
    
    LogUtils.selection('完成', '连线', `从 ${connectionStart} 到 ${endCardId}`);
    const connection = createConnection(connectionStart, endCardId);
    setConnectionMode(false);
    setConnectionStart(null);
    return connection;
  }, [connectionStart, createConnection]);
  
  // 取消连线模式
  const cancelConnectionMode = useCallback(() => {
    LogUtils.selection('取消', '连线模式', connectionStart);
    setConnectionMode(false);
    setConnectionStart(null);
  }, [connectionStart]);
  
  // 批量设置连线
  const setConnectionsData = useCallback((newConnections: IConnection[]) => {
    setConnections(newConnections);
  }, []);
  
  // 选择连接线
  const selectConnection = useCallback((connectionId: string, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      setSelectedConnectionIds(prev => {
        if (prev.includes(connectionId)) {
          LogUtils.selection('取消选择', '连接线', connectionId);
          return prev.filter(id => id !== connectionId);
        } else {
          LogUtils.selection('添加选择', '连接线', connectionId);
          return [...prev, connectionId];
        }
      });
    } else {
      LogUtils.selection('选择', '连接线', connectionId);
      setSelectedConnectionIds([connectionId]);
    }
  }, []);
  
  // 批量选择连接线
  const selectConnections = useCallback((connectionIds: string[]) => {
    LogUtils.selection('批量选择', '连接线', connectionIds);
    setSelectedConnectionIds(connectionIds);
  }, []);
  
  // 清除连接线选择
  const clearConnectionSelection = useCallback(() => {
    LogUtils.selection('清除选择', '连接线', selectedConnectionIds);
    setSelectedConnectionIds([]);
  }, [selectedConnectionIds]);
  
  // 删除选中的连接线
  const deleteSelectedConnections = useCallback(() => {
    if (selectedConnectionIds.length === 0) return;
    
    LogUtils.selection('删除', '连接线', selectedConnectionIds);
    setConnections(prev => prev.filter(conn => !selectedConnectionIds.includes(conn.id)));
    setSelectedConnectionIds([]);
  }, [selectedConnectionIds]);
  
  // 复制选中的连接线
  const copySelectedConnections = useCallback(() => {
    return connections.filter(conn => selectedConnectionIds.includes(conn.id));
  }, [connections, selectedConnectionIds]);

  // 选择下一条连接线
  const selectNextConnection = useCallback((reverse: boolean = false) => {
    if (connections.length === 0) return;
    
    // 如果没有选中的连接线，则选中第一条
    if (selectedConnectionIds.length === 0) {
      LogUtils.selection('选择第一条', '连接线', connections[0].id);
      selectConnection(connections[0].id, false);
      return;
    }
    
    // 获取当前选中的连接线（如果有多个选中，取第一个）
    const currentConnectionId = selectedConnectionIds[0];
    const currentIndex = connections.findIndex(conn => conn.id === currentConnectionId);
    
    if (currentIndex === -1) {
      // 当前选中的连接线不存在，选择第一条
      selectConnection(connections[0].id, false);
      return;
    }
    
    // 计算下一个索引
    let nextIndex;
    if (reverse) {
      nextIndex = (currentIndex - 1 + connections.length) % connections.length;
    } else {
      nextIndex = (currentIndex + 1) % connections.length;
    }
    
    // 选择下一条连接线
    LogUtils.selection(reverse ? '选择前一条' : '选择下一条', '连接线', connections[nextIndex].id);
    selectConnection(connections[nextIndex].id, false);
  }, [connections, selectedConnectionIds, selectConnection]);

  // 添加一个函数在指定方向查找最近的卡片
  const findNearestCardInDirection = useCallback((currentCardId: string, direction: 'up' | 'down' | 'left' | 'right'): string | null => {
    // 这个函数不应该在这里实现，而是应该作为参数传递进来，或者在组件中实现
    // 将返回null作为默认实现，实际使用时应该在调用处提供实现
    return null;
  }, []);
  
  return {
    connections,
    connectionMode,
    connectionStart,
    selectedConnectionIds, // 返回选中的连接线ID数组
    createConnection,
    deleteCardConnections,
    deleteConnection, // 确保导出这个方法
    updateConnectionLabel, // 添加更新连接线标签的方法
    startConnectionMode,
    completeConnection,
    cancelConnectionMode,
    setConnectionsData,
    selectConnection, // 添加选择连接线方法
    selectConnections, // 添加批量选择连接线方法
    clearConnectionSelection, // 添加清除连接线选择方法
    deleteSelectedConnections, // 添加删除选中连接线方法
    copySelectedConnections, // 添加复制选中连接线方法
    selectNextConnection, // 返回选择下一条连接线的方法
    editingConnectionId, // 添加正在编辑的连接线ID
    setEditingConnectionId, // 添加设置编辑连接线ID的方法
    connectionTargetCardId,
    setConnectionTargetCardId,
    findNearestCardInDirection, // 导出这个函数
  };
};
