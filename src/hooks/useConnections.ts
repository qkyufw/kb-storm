// 连线管理Hook
import { useState, useCallback } from 'react';
import { IConnection } from '../types';

export const useConnections = () => {
  const [connections, setConnections] = useState<IConnection[]>([]);
  const [connectionMode, setConnectionMode] = useState<boolean>(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  
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
  
  return {
    connections,
    connectionMode,
    connectionStart,
    createConnection,
    deleteCardConnections,
    deleteConnection,
    updateConnectionLabel,
    startConnectionMode,
    completeConnection,
    cancelConnectionMode,
    setConnectionsData
  };
};
