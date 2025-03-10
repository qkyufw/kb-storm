// 连线管理Hook
import { useState, useCallback } from 'react';
import { IConnection } from '../types';

export const useConnections = () => {
  const [connections, setConnections] = useState<IConnection[]>([]);
  const [connectionMode, setConnectionMode] = useState<boolean>(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>([]); // 添加选中连接线ID数组
  
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
    setConnectionMode(true);
    setConnectionStart(startCardId);
  }, []);
  
  // 完成连线
  const completeConnection = useCallback((endCardId: string) => {
    if (!connectionStart || connectionStart === endCardId) {
      setConnectionMode(false);
      setConnectionStart(null);
      return null;
    }
    
    const connection = createConnection(connectionStart, endCardId);
    setConnectionMode(false);
    setConnectionStart(null);
    return connection;
  }, [connectionStart, createConnection]);
  
  // 取消连线模式
  const cancelConnectionMode = useCallback(() => {
    setConnectionMode(false);
    setConnectionStart(null);
  }, []);
  
  // 批量设置连线
  const setConnectionsData = useCallback((newConnections: IConnection[]) => {
    setConnections(newConnections);
  }, []);
  
  // 选择连接线
  const selectConnection = useCallback((connectionId: string, isMultiSelect: boolean = false) => {
    if (isMultiSelect) {
      setSelectedConnectionIds(prev => {
        if (prev.includes(connectionId)) {
          return prev.filter(id => id !== connectionId);
        } else {
          return [...prev, connectionId];
        }
      });
    } else {
      setSelectedConnectionIds([connectionId]);
    }
  }, []);
  
  // 批量选择连接线
  const selectConnections = useCallback((connectionIds: string[]) => {
    setSelectedConnectionIds(connectionIds);
  }, []);
  
  // 清除连接线选择
  const clearConnectionSelection = useCallback(() => {
    setSelectedConnectionIds([]);
  }, []);
  
  // 删除选中的连接线
  const deleteSelectedConnections = useCallback(() => {
    if (selectedConnectionIds.length === 0) return;
    
    setConnections(prev => prev.filter(conn => !selectedConnectionIds.includes(conn.id)));
    setSelectedConnectionIds([]);
  }, [selectedConnectionIds]);
  
  // 复制选中的连接线
  const copySelectedConnections = useCallback(() => {
    return connections.filter(conn => selectedConnectionIds.includes(conn.id));
  }, [connections, selectedConnectionIds]);
  
  return {
    connections,
    connectionMode,
    connectionStart,
    selectedConnectionIds, // 返回选中的连接线ID数组
    createConnection,
    deleteCardConnections,
    deleteConnection, // 确保导出这个方法
    updateConnectionLabel,
    startConnectionMode,
    completeConnection,
    cancelConnectionMode,
    setConnectionsData,
    selectConnection, // 添加选择连接线方法
    selectConnections, // 添加批量选择连接线方法
    clearConnectionSelection, // 添加清除连接线选择方法
    deleteSelectedConnections, // 添加删除选中连接线方法
    copySelectedConnections // 添加复制选中连接线方法
  };
};
