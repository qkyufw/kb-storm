import { useCardStore } from '../../store/cardStore';
import { useConnectionStore } from '../../store/connectionStore';
import { useHistoryStore } from '../../store/historyStore';
import { useUIStore } from '../../store/UIStore';

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


