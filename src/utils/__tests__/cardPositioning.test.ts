/**
 * 卡片位置生成测试
 * 测试卡片是否完全在可视区域内生成
 */

import { randomLayout } from '../layoutUtils';
import { ICard, IPosition, ISize } from '../../types/CoreTypes';

describe('卡片位置生成测试', () => {
  const mockViewportInfo = {
    viewportWidth: 800,
    viewportHeight: 600,
    zoom: 1,
    pan: { x: 0, y: 0 }
  };

  const mockMapSize: ISize = {
    width: 1000,
    height: 800
  };

  const cardSize: ISize = {
    width: 160,
    height: 80
  };

  test('应该在可视区域内生成卡片位置', () => {
    const position = randomLayout(
      { x: 0, y: 0 },
      mockMapSize,
      [],
      {},
      mockViewportInfo,
      cardSize
    );

    // 计算视口边界
    const viewportLeft = -mockViewportInfo.pan.x / mockViewportInfo.zoom;
    const viewportTop = -mockViewportInfo.pan.y / mockViewportInfo.zoom;
    const viewportRight = viewportLeft + mockViewportInfo.viewportWidth / mockViewportInfo.zoom;
    const viewportBottom = viewportTop + mockViewportInfo.viewportHeight / mockViewportInfo.zoom;

    // 检查卡片是否完全在可视区域内
    expect(position.x).toBeGreaterThanOrEqual(viewportLeft);
    expect(position.y).toBeGreaterThanOrEqual(viewportTop);
    expect(position.x + cardSize.width).toBeLessThanOrEqual(viewportRight);
    expect(position.y + cardSize.height).toBeLessThanOrEqual(viewportBottom);
  });

  test('应该在缩放视口中正确生成卡片位置', () => {
    const zoomedViewportInfo = {
      viewportWidth: 800,
      viewportHeight: 600,
      zoom: 2, // 2倍缩放
      pan: { x: -200, y: -150 } // 平移
    };

    const position = randomLayout(
      { x: 0, y: 0 },
      mockMapSize,
      [],
      {},
      zoomedViewportInfo,
      cardSize
    );

    // 计算缩放后的视口边界
    const viewportLeft = -zoomedViewportInfo.pan.x / zoomedViewportInfo.zoom;
    const viewportTop = -zoomedViewportInfo.pan.y / zoomedViewportInfo.zoom;
    const viewportRight = viewportLeft + zoomedViewportInfo.viewportWidth / zoomedViewportInfo.zoom;
    const viewportBottom = viewportTop + zoomedViewportInfo.viewportHeight / zoomedViewportInfo.zoom;

    // 检查卡片是否完全在缩放后的可视区域内
    expect(position.x).toBeGreaterThanOrEqual(viewportLeft);
    expect(position.y).toBeGreaterThanOrEqual(viewportTop);
    expect(position.x + cardSize.width).toBeLessThanOrEqual(viewportRight);
    expect(position.y + cardSize.height).toBeLessThanOrEqual(viewportBottom);
  });

  test('应该避免与现有卡片重叠', () => {
    const existingCards: ICard[] = [
      {
        id: 'card-1',
        content: '现有卡片',
        x: 100,
        y: 100,
        width: 160,
        height: 80,
        color: '#ffffff'
      }
    ];

    const position = randomLayout(
      { x: 0, y: 0 },
      mockMapSize,
      existingCards,
      {},
      mockViewportInfo,
      cardSize
    );

    // 计算新卡片中心点
    const newCardCenterX = position.x + cardSize.width / 2;
    const newCardCenterY = position.y + cardSize.height / 2;

    // 计算现有卡片中心点
    const existingCardCenterX = existingCards[0].x + existingCards[0].width / 2;
    const existingCardCenterY = existingCards[0].y + existingCards[0].height / 2;

    // 计算距离
    const distance = Math.sqrt(
      Math.pow(newCardCenterX - existingCardCenterX, 2) + 
      Math.pow(newCardCenterY - existingCardCenterY, 2)
    );

    // 应该保持最小距离
    expect(distance).toBeGreaterThanOrEqual(150);
  });

  test('在小视口中应该返回安全位置', () => {
    const smallViewportInfo = {
      viewportWidth: 100, // 很小的视口
      viewportHeight: 50,
      zoom: 1,
      pan: { x: 0, y: 0 }
    };

    const position = randomLayout(
      { x: 0, y: 0 },
      mockMapSize,
      [],
      {},
      smallViewportInfo,
      cardSize
    );

    // 应该返回一个有效的位置（即使视口很小）
    expect(typeof position.x).toBe('number');
    expect(typeof position.y).toBe('number');
    expect(position.x).toBeGreaterThanOrEqual(0);
    expect(position.y).toBeGreaterThanOrEqual(0);
  });

  test('应该严格验证卡片边界（多次测试）', () => {
    // 进行多次测试以捕获边界问题
    for (let i = 0; i < 100; i++) {
      const position = randomLayout(
        { x: 0, y: 0 },
        mockMapSize,
        [],
        {},
        mockViewportInfo,
        cardSize
      );

      // 计算视口边界
      const viewportLeft = -mockViewportInfo.pan.x / mockViewportInfo.zoom;
      const viewportTop = -mockViewportInfo.pan.y / mockViewportInfo.zoom;
      const viewportRight = viewportLeft + mockViewportInfo.viewportWidth / mockViewportInfo.zoom;
      const viewportBottom = viewportTop + mockViewportInfo.viewportHeight / mockViewportInfo.zoom;

      // 计算边距
      const margin = 20;
      const effectiveLeft = viewportLeft + margin;
      const effectiveTop = viewportTop + margin;
      const effectiveRight = viewportRight - margin;
      const effectiveBottom = viewportBottom - margin;

      // 严格检查卡片的所有边界（考虑边距）
      const cardLeft = position.x;
      const cardTop = position.y;
      const cardRight = position.x + cardSize.width;
      const cardBottom = position.y + cardSize.height;

      expect(cardLeft).toBeGreaterThanOrEqual(effectiveLeft);
      expect(cardTop).toBeGreaterThanOrEqual(effectiveTop);
      expect(cardRight).toBeLessThanOrEqual(effectiveRight);
      expect(cardBottom).toBeLessThanOrEqual(effectiveBottom);

      // 如果测试失败，输出详细信息
      if (cardLeft < effectiveLeft ||
          cardTop < effectiveTop ||
          cardRight > effectiveRight ||
          cardBottom > effectiveBottom) {
        console.error('边界检查失败:', {
          iteration: i,
          position,
          cardBounds: { cardLeft, cardTop, cardRight, cardBottom },
          effectiveBounds: { effectiveLeft, effectiveTop, effectiveRight, effectiveBottom },
          violations: {
            leftViolation: cardLeft < effectiveLeft,
            topViolation: cardTop < effectiveTop,
            rightViolation: cardRight > effectiveRight,
            bottomViolation: cardBottom > effectiveBottom
          }
        });
      }
    }
  });
});
