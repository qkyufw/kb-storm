import { IPosition, ICard, IConnection } from '../../types/CoreTypes';
import { calculateConnectedCardPosition } from '../../utils/cardPositioning';

// 处理用户动作
// 提取所有MindMap组件中的辅助函数和操作方法到此文件
export const createCardMovementHandlers = (
  selectedCardId: string | null,
  moveCard: (cardId: string, deltaX: number, deltaY: number) => void,
  setMoveInterval: (interval: NodeJS.Timeout | null) => void,
) => {
  // 移动选中的卡片
  const moveSelectedCard = (deltaX: number, deltaY: number, isLargeStep: boolean) => {
    if (!selectedCardId) return;
    const step = isLargeStep ? 30 : 10;
    moveCard(selectedCardId, deltaX * step, deltaY * step);
  };
  
  // 开始持续移动
  const startContinuousMove = (deltaX: number, deltaY: number, isLargeStep: boolean) => {
    // 首先执行一次移动，避免延迟感
    moveSelectedCard(deltaX, deltaY, isLargeStep);
    
    // 设置连续移动
    const interval = setInterval(() => {
      moveSelectedCard(deltaX, deltaY, isLargeStep);
    }, 100); // 每100ms移动一次
    
    setMoveInterval(interval);
  };
  
  // 停止持续移动
  const stopContinuousMove = () => {
    setMoveInterval(null);
  };
  
  return {
    moveSelectedCard,
    startContinuousMove,
    stopContinuousMove
  };
};

// 创建连接卡片的函数
export const createConnectedCardFunction = (
  cards: ICard[],
  connections: IConnection[],
  selectedCardId: string | null,
  createCardAtPosition: (position: IPosition) => ICard,
  createConnection: (startCardId: string, endCardId: string) => IConnection | null
) => {
  return (direction: 'up' | 'down' | 'left' | 'right') => {
    const selectedCard = cards.find(card => card.id === selectedCardId);
    if (!selectedCard) return;

    const position = calculateConnectedCardPosition(selectedCard, direction);
    const newCard = createCardAtPosition(position);

    // 使用 store 的 createConnection 方法，它包含重复检查逻辑
    const newConnection = createConnection(selectedCardId!, newCard.id);

    if (!newConnection) {
      console.log('连接创建失败：可能是重复连线');
    }
  };
};
