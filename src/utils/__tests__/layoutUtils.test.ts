/**
 * 布局工具函数测试
 * 测试卡片边界计算和智能定位功能
 */

import { calculateCardsBounds, calculatePanToFitCards } from '../layoutUtils';
import { ICard } from '../../types/CoreTypes';

describe('布局工具函数测试', () => {
  const mockCards: ICard[] = [
    {
      id: 'card1',
      content: 'Card 1',
      x: 100,
      y: 50,
      width: 160,
      height: 80,
      color: '#ffffff'
    },
    {
      id: 'card2', 
      content: 'Card 2',
      x: 300,
      y: 200,
      width: 160,
      height: 80,
      color: '#ffffff'
    },
    {
      id: 'card3',
      content: 'Card 3', 
      x: 50,
      y: 100,
      width: 160,
      height: 80,
      color: '#ffffff'
    }
  ];

  describe('calculateCardsBounds', () => {
    test('应该正确计算卡片边界', () => {
      const bounds = calculateCardsBounds(mockCards);
      
      expect(bounds).not.toBeNull();
      expect(bounds!.minX).toBe(50); // card3的x坐标
      expect(bounds!.minY).toBe(50); // card1的y坐标
      expect(bounds!.maxX).toBe(460); // card2的x + width
      expect(bounds!.maxY).toBe(280); // card2的y + height
    });

    test('空卡片数组应该返回null', () => {
      const bounds = calculateCardsBounds([]);
      expect(bounds).toBeNull();
    });

    test('单个卡片应该返回正确边界', () => {
      const singleCard = [mockCards[0]];
      const bounds = calculateCardsBounds(singleCard);
      
      expect(bounds).not.toBeNull();
      expect(bounds!.minX).toBe(100);
      expect(bounds!.minY).toBe(50);
      expect(bounds!.maxX).toBe(260);
      expect(bounds!.maxY).toBe(130);
    });
  });

  describe('calculatePanToFitCards', () => {
    const mockViewportInfo = {
      viewportWidth: 800,
      viewportHeight: 600,
      zoom: 1
    };

    test('应该计算正确的平移量将卡片定位到左上角', () => {
      const pan = calculatePanToFitCards(mockCards, mockViewportInfo);
      
      expect(pan).not.toBeNull();
      // 最左上角卡片的坐标是(50, 50)，目标位置是(20, 20)
      // 所以平移量应该是 (20 - 50) * 1 = -30
      expect(pan!.x).toBe(-30);
      expect(pan!.y).toBe(-30);
    });

    test('空卡片数组应该返回null', () => {
      const pan = calculatePanToFitCards([], mockViewportInfo);
      expect(pan).toBeNull();
    });

    test('应该考虑缩放比例', () => {
      const zoomedViewportInfo = {
        ...mockViewportInfo,
        zoom: 2
      };
      
      const pan = calculatePanToFitCards(mockCards, zoomedViewportInfo);
      
      expect(pan).not.toBeNull();
      // 缩放比例为2时，平移量应该乘以2
      expect(pan!.x).toBe(-60);
      expect(pan!.y).toBe(-60);
    });

    test('应该考虑自定义边距', () => {
      const pan = calculatePanToFitCards(mockCards, mockViewportInfo, 50);
      
      expect(pan).not.toBeNull();
      // 边距为50时，目标位置是(50, 50)，所以平移量为0
      expect(pan!.x).toBe(0);
      expect(pan!.y).toBe(0);
    });
  });
});
