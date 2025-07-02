/**
 * 视口范围检测工具函数
 * 用于获取当前屏幕可视范围内的卡片
 */

import { ICard } from '../../types/CoreTypes';

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
 * 获取完全在视口范围内的卡片
 * @param cards 所有卡片数组
 * @param viewportInfo 视口信息
 * @returns 完全在视口范围内的卡片数组
 */
export function getCardsFullyInViewport(cards: ICard[], viewportInfo: ViewportInfo): ICard[] {
  if (!viewportInfo) {
    return cards;
  }

  const { viewportWidth, viewportHeight, zoom, pan } = viewportInfo;

  // 计算视口在画布中的实际边界
  const viewportLeft = -pan.x / zoom;
  const viewportTop = -pan.y / zoom;
  const viewportRight = viewportLeft + viewportWidth / zoom;
  const viewportBottom = viewportTop + viewportHeight / zoom;

  // 过滤出完全在视口范围内的卡片
  return cards.filter(card => {
    const cardLeft = card.x;
    const cardRight = card.x + card.width;
    const cardTop = card.y;
    const cardBottom = card.y + card.height;

    // 检查卡片是否完全在视口内
    return (
      cardLeft >= viewportLeft &&
      cardRight <= viewportRight &&
      cardTop >= viewportTop &&
      cardBottom <= viewportBottom
    );
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

/**
 * 计算卡片在视口中的可见比例
 * @param card 卡片对象
 * @param viewportInfo 视口信息
 * @returns 可见比例 (0-1)
 */
export function getCardVisibilityRatio(card: ICard, viewportInfo: ViewportInfo): number {
  const { viewportWidth, viewportHeight, zoom, pan } = viewportInfo;

  const viewportLeft = -pan.x / zoom;
  const viewportTop = -pan.y / zoom;
  const viewportRight = viewportLeft + viewportWidth / zoom;
  const viewportBottom = viewportTop + viewportHeight / zoom;

  const cardLeft = card.x;
  const cardRight = card.x + card.width;
  const cardTop = card.y;
  const cardBottom = card.y + card.height;

  // 计算交集区域
  const intersectionLeft = Math.max(cardLeft, viewportLeft);
  const intersectionRight = Math.min(cardRight, viewportRight);
  const intersectionTop = Math.max(cardTop, viewportTop);
  const intersectionBottom = Math.min(cardBottom, viewportBottom);

  // 如果没有交集，返回0
  if (intersectionLeft >= intersectionRight || intersectionTop >= intersectionBottom) {
    return 0;
  }

  // 计算交集面积和卡片总面积
  const intersectionArea = (intersectionRight - intersectionLeft) * (intersectionBottom - intersectionTop);
  const cardArea = card.width * card.height;

  return intersectionArea / cardArea;
}

/**
 * 获取视口范围内卡片的统计信息
 * @param cards 所有卡片数组
 * @param viewportInfo 视口信息
 * @returns 统计信息
 */
export function getViewportCardStats(cards: ICard[], viewportInfo: ViewportInfo) {
  const cardsInViewport = getCardsInViewport(cards, viewportInfo);
  const cardsFullyInViewport = getCardsFullyInViewport(cards, viewportInfo);

  const totalCharacters = cardsInViewport.reduce((sum, card) => sum + card.content.length, 0);
  const averageVisibility = cardsInViewport.reduce((sum, card) => {
    return sum + getCardVisibilityRatio(card, viewportInfo);
  }, 0) / cardsInViewport.length;

  return {
    totalCards: cards.length,
    cardsInViewport: cardsInViewport.length,
    cardsFullyInViewport: cardsFullyInViewport.length,
    totalCharacters,
    averageVisibility: isNaN(averageVisibility) ? 0 : averageVisibility
  };
}
