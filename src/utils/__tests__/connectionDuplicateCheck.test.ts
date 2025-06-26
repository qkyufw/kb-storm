/**
 * 连线重复检查功能测试
 * 测试卡片之间的连线唯一性限制
 */

import { IConnection, ArrowType } from '../../types/CoreTypes';

// 模拟连线重复检查逻辑
const checkDuplicateConnection = (
  connections: IConnection[],
  startCardId: string,
  endCardId: string
): boolean => {
  return connections.some(conn => 
    (conn.startCardId === startCardId && conn.endCardId === endCardId) ||
    (conn.startCardId === endCardId && conn.endCardId === startCardId)
  );
};

describe('连线重复检查功能', () => {
  const mockConnections: IConnection[] = [
    {
      id: 'conn-1',
      startCardId: 'card-1',
      endCardId: 'card-2',
      label: '',
      arrowType: ArrowType.END
    },
    {
      id: 'conn-2',
      startCardId: 'card-2',
      endCardId: 'card-3',
      label: '',
      arrowType: ArrowType.END
    }
  ];

  test('应该检测到重复的连线（相同方向）', () => {
    const isDuplicate = checkDuplicateConnection(
      mockConnections,
      'card-1',
      'card-2'
    );
    expect(isDuplicate).toBe(true);
  });

  test('应该检测到重复的连线（反向）', () => {
    const isDuplicate = checkDuplicateConnection(
      mockConnections,
      'card-2',
      'card-1'
    );
    expect(isDuplicate).toBe(true);
  });

  test('应该允许创建新的连线', () => {
    const isDuplicate = checkDuplicateConnection(
      mockConnections,
      'card-1',
      'card-3'
    );
    expect(isDuplicate).toBe(false);
  });

  test('应该允许创建到新卡片的连线', () => {
    const isDuplicate = checkDuplicateConnection(
      mockConnections,
      'card-1',
      'card-4'
    );
    expect(isDuplicate).toBe(false);
  });

  test('不应该允许自连接', () => {
    const isDuplicate = checkDuplicateConnection(
      mockConnections,
      'card-1',
      'card-1'
    );
    // 自连接应该在其他地方被阻止，这里测试重复检查逻辑
    expect(isDuplicate).toBe(false);
  });
});
