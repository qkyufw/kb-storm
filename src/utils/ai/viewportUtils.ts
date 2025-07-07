/**
 * 视口范围检测工具函数
 * 用于获取当前屏幕可视范围内的卡片
 */

import { ICard, IConnection } from '../../types/CoreTypes';

/**
 * 视口信息接口
 */
export interface ViewportInfo {
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  pan: { x: number; y: number };
}

/**
 * 获取视口范围内的卡片
 * @param cards 所有卡片数组
 * @param viewportInfo 视口信息
 * @returns 视口范围内的卡片数组
 */
export function getCardsInViewport(cards: ICard[], viewportInfo: ViewportInfo): ICard[] {
  if (!viewportInfo) {
    return cards; // 如果没有视口信息，返回所有卡片
  }

  const { viewportWidth, viewportHeight, zoom, pan } = viewportInfo;

  // 计算视口在画布中的实际边界（考虑缩放和平移）
  const viewportLeft = -pan.x / zoom;
  const viewportTop = -pan.y / zoom;
  const viewportRight = viewportLeft + viewportWidth / zoom;
  const viewportBottom = viewportTop + viewportHeight / zoom;

  // 过滤出在视口范围内的卡片
  return cards.filter(card => {
    const cardLeft = card.x;
    const cardRight = card.x + card.width;
    const cardTop = card.y;
    const cardBottom = card.y + card.height;

    // 检查卡片是否与视口有交集
    return !(
      cardRight < viewportLeft ||
      cardLeft > viewportRight ||
      cardBottom < viewportTop ||
      cardTop > viewportBottom
    );
  });
}

/**
 * 获取视口范围内的连接线
 * @param connections 所有连接线数组
 * @param cards 所有卡片数组
 * @param viewportInfo 视口信息
 * @returns 视口范围内的连接线数组
 */
export function getConnectionsInViewport(
  connections: IConnection[],
  cards: ICard[],
  viewportInfo: ViewportInfo
): IConnection[] {
  if (!viewportInfo) {
    return connections; // 如果没有视口信息，返回所有连接线
  }

  const { viewportWidth, viewportHeight, zoom, pan } = viewportInfo;

  // 计算视口在画布中的实际边界（考虑缩放和平移）
  const viewportLeft = -pan.x / zoom;
  const viewportTop = -pan.y / zoom;
  const viewportRight = viewportLeft + viewportWidth / zoom;
  const viewportBottom = viewportTop + viewportHeight / zoom;

  // 过滤出在视口范围内的连接线
  return connections.filter(connection => {
    const startCard = cards.find(card => card.id === connection.startCardId);
    const endCard = cards.find(card => card.id === connection.endCardId);

    if (!startCard || !endCard) return false;

    // 计算连接线中点
    const midX = (startCard.x + startCard.width/2 + endCard.x + endCard.width/2) / 2;
    const midY = (startCard.y + startCard.height/2 + endCard.y + endCard.height/2) / 2;

    // 检查连接线中点是否在视口范围内
    return midX >= viewportLeft && midX <= viewportRight &&
           midY >= viewportTop && midY <= viewportBottom;
  });
}

/**
 * 导出视口内容为Mermaid格式
 * @param cards 所有卡片数组
 * @param connections 所有连接线数组
 * @param viewportInfo 视口信息
 * @returns Mermaid格式的字符串
 */
export function exportViewportToMermaid(
  cards: ICard[],
  connections: IConnection[],
  viewportInfo: ViewportInfo
): string {
  // 获取视口内的卡片和连接线
  const cardsInViewport = getCardsInViewport(cards, viewportInfo);
  const connectionsInViewport = getConnectionsInViewport(connections, cards, viewportInfo);

  // 过滤连接线，只保留两端都在视口内的连接线
  const validConnections = connectionsInViewport.filter(conn => {
    const startCardInViewport = cardsInViewport.some(card => card.id === conn.startCardId);
    const endCardInViewport = cardsInViewport.some(card => card.id === conn.endCardId);
    return startCardInViewport && endCardInViewport;
  });

  // 使用现有的导出工具
  const { ExportImportUtils } = require('../exportImport');
  return ExportImportUtils.exportToMermaid({
    cards: cardsInViewport,
    connections: validConnections
  });
}



/**
 * 获取视口中心点在画布中的坐标
 * @param viewportInfo 视口信息
 * @returns 视口中心点坐标
 */
export function getViewportCenter(viewportInfo: ViewportInfo): { x: number; y: number } {
  const { viewportWidth, viewportHeight, zoom, pan } = viewportInfo;

  const centerX = (-pan.x + viewportWidth / 2) / zoom;
  const centerY = (-pan.y + viewportHeight / 2) / zoom;

  return { x: centerX, y: centerY };
}

/**
 * 检查点是否在视口范围内
 * @param x 点的x坐标
 * @param y 点的y坐标
 * @param viewportInfo 视口信息
 * @returns 是否在视口范围内
 */
export function isPointInViewport(x: number, y: number, viewportInfo: ViewportInfo): boolean {
  const { viewportWidth, viewportHeight, zoom, pan } = viewportInfo;

  const viewportLeft = -pan.x / zoom;
  const viewportTop = -pan.y / zoom;
  const viewportRight = viewportLeft + viewportWidth / zoom;
  const viewportBottom = viewportTop + viewportHeight / zoom;

  return x >= viewportLeft && x <= viewportRight && y >= viewportTop && y <= viewportBottom;
}


