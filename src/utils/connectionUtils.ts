/**
 * 连线相关的工具函数
 * 统一连线检查和处理逻辑
 */

import { IConnection } from '../types/CoreTypes';

/**
 * 检查是否存在重复连线（双向检查）
 * @param connections 现有连线数组
 * @param startCardId 起始卡片ID
 * @param endCardId 结束卡片ID
 * @returns 是否存在重复连线
 */
export const checkDuplicateConnection = (
  connections: IConnection[],
  startCardId: string,
  endCardId: string
): boolean => {
  return connections.some(conn => 
    (conn.startCardId === startCardId && conn.endCardId === endCardId) ||
    (conn.startCardId === endCardId && conn.endCardId === startCardId)
  );
};

/**
 * 查找现有的连线（双向查找）
 * @param connections 现有连线数组
 * @param startCardId 起始卡片ID
 * @param endCardId 结束卡片ID
 * @returns 找到的连线或null
 */
export const findExistingConnection = (
  connections: IConnection[],
  startCardId: string,
  endCardId: string
): IConnection | null => {
  return connections.find(conn => 
    (conn.startCardId === startCardId && conn.endCardId === endCardId) ||
    (conn.startCardId === endCardId && conn.endCardId === startCardId)
  ) || null;
};

/**
 * 验证连线参数
 * @param startCardId 起始卡片ID
 * @param endCardId 结束卡片ID
 * @returns 是否有效
 */
export const validateConnectionParams = (
  startCardId: string | null,
  endCardId: string | null
): boolean => {
  return !!(startCardId && endCardId && startCardId !== endCardId);
};

/**
 * 获取连线的相关卡片ID数组
 * @param connections 连线数组
 * @param cardId 卡片ID
 * @returns 相关的卡片ID数组
 */
export const getConnectedCardIds = (
  connections: IConnection[],
  cardId: string
): string[] => {
  const connectedIds: string[] = [];
  
  connections.forEach(conn => {
    if (conn.startCardId === cardId) {
      connectedIds.push(conn.endCardId);
    } else if (conn.endCardId === cardId) {
      connectedIds.push(conn.startCardId);
    }
  });
  
  return connectedIds;
};

/**
 * 过滤与指定卡片相关的连线
 * @param connections 连线数组
 * @param cardIds 卡片ID数组
 * @returns 相关的连线数组
 */
export const filterConnectionsByCards = (
  connections: IConnection[],
  cardIds: string[]
): IConnection[] => {
  return connections.filter(conn => 
    cardIds.includes(conn.startCardId) || cardIds.includes(conn.endCardId)
  );
};
