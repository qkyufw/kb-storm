import { useCardStore } from '../store/cardStore';
import { useConnectionStore } from '../store/connectionStore';
import { useHistoryStore } from '../store/historyStore';
import { useClipboardStore } from '../store/clipboardStore';
import { useUIStore } from '../store/UIStore';
import { IPosition, ISize, IConnection } from '../types/CoreTypes';
import { findNearestCardInDirection } from '../utils/cardPositioning';

/**
 * 卡片选择服务
 */
export const selectCardWithContextService = (cardId: string, isMultiSelect: boolean = false): void => {
  const connections = useConnectionStore.getState();
  const cards = useCardStore.getState();
  
  if (connections.connectionMode) {
    connections.completeConnection(cardId);
  } else {
    if (connections.selectedConnectionIds.length > 0) {
      connections.clearConnectionSelection();
    }
    cards.selectCard(cardId, isMultiSelect);
  }
};

/**
 * 删除选中元素服务
 */
export const deleteSelectedElementsService = (): void => {
  const history = useHistoryStore.getState();
  const connections = useConnectionStore.getState();
  const cards = useCardStore.getState();
  
  history.addToHistory();
  
  if (connections.selectedConnectionIds.length > 0) {
    connections.handleConnectionsDelete();
  }
  
  if (cards.selectedCardIds.length > 0) {
    cards.handleCardsDelete((cardId) => {
      connections.handleConnectionsDelete({ cardId });
    });
  }
};

/**
 * 粘贴服务
 */
export const pasteClipboardService = (): void => {
  const clipboard = useClipboardStore.getState();
  const ui = useUIStore.getState();
  
  // 计算鼠标位置
  let mousePosition: IPosition;
  
  if (ui.mapRef.current) {
    // 尝试从全局事件获取鼠标位置
    const lastEvent = window.event as MouseEvent;
    if (lastEvent && lastEvent.clientX) {
      const rect = ui.mapRef.current.getBoundingClientRect();
      mousePosition = {
        x: (lastEvent.clientX - rect.left - ui.pan.x) / ui.zoomLevel,
        y: (lastEvent.clientY - rect.top - ui.pan.y) / ui.zoomLevel
      };
    } else {
      // 回退到视口中心
      mousePosition = {
        x: (ui.viewportInfo.viewportWidth / 2 - ui.pan.x) / ui.zoomLevel,
        y: (ui.viewportInfo.viewportHeight / 2 - ui.pan.y) / ui.zoomLevel
      };
    }
  } else {
    // 如果没有参考点，使用默认坐标
    mousePosition = { x: 100, y: 100 };
  }
  
  clipboard.handlePaste(mousePosition);
};

/**
 * 创建新卡片服务
 */
export const createCardService = (): void => {
  const history = useHistoryStore.getState();
  const cards = useCardStore.getState();
  const ui = useUIStore.getState();
  
  history.addToHistory();
  
  const currentViewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  
  cards.createCard(currentViewport, ui.viewportInfo);
};

/**
 * 键盘导航 - 选择最近卡片服务
 */
export const selectNearestCardService = (direction: 'up' | 'down' | 'left' | 'right'): void => {
  const cards = useCardStore.getState();
  
  const selectedCard = cards.cards.find(card => card.id === cards.selectedCardId);
  if (!selectedCard) return;
  
  const nearestCard = findNearestCardInDirection(selectedCard, cards.cards, direction);
  if (nearestCard) {
    cards.setSelectedCardId(nearestCard.id);
  }
};

/**
 * 键盘导航 - 选择下一个卡片服务
 */
export const selectNextCardService = (reverse: boolean = false): void => {
  const cards = useCardStore.getState();
  
  if (cards.cards.length === 0) return;
  
  const currentIndex = cards.selectedCardId 
    ? cards.cards.findIndex(card => card.id === cards.selectedCardId) 
    : -1;
  
  let nextIndex;
  if (reverse) {
    nextIndex = currentIndex <= 0 ? cards.cards.length - 1 : currentIndex - 1;
  } else {
    nextIndex = (currentIndex + 1) % cards.cards.length;
  }
  
  cards.setSelectedCardId(cards.cards[nextIndex].id);
};


/**
 * 创建连接线服务
 */
export const createConnectionService = (
  startCardId: string | null, 
  endCardId: string | null,
  points: { x: number; y: number; }[] = []
): void => {
  if (!startCardId || !endCardId || startCardId === endCardId) return;
  
  const history = useHistoryStore.getState();
  const connections = useConnectionStore.getState();
  
  // 创建新的连接 - 修改为使用lastArrowType
  const newConnection: IConnection = {
    id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    startCardId,
    endCardId,
    label: '',
    arrowType: connections.lastArrowType  // 使用最后选择的箭头类型
  };
  
  connections.setConnectionsData([...connections.connections, newConnection]);
  history.addToHistory();
};

/**
 * 查找指定方向上的最近卡片服务
 */
export const findNearestCardService = (
  currentCardId: string, 
  direction: 'up' | 'down' | 'left' | 'right'
): string | null => {
  const cards = useCardStore.getState();
  const connections = useConnectionStore.getState();
  
  const currentCard = cards.cards.find(card => card.id === currentCardId);
  if (!currentCard) return null;
  
  const possibleTargets = cards.cards.filter(card => 
    card.id !== currentCardId && 
    card.id !== connections.connectionStart
  );
  
  const nearestCard = findNearestCardInDirection(
    currentCard,
    possibleTargets,
    direction
  );
  
  return nearestCard?.id || null;
};