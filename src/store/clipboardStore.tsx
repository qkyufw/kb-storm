import { create } from 'zustand';
import { ICard, IConnection, IPosition } from '../types/CoreTypes';
import { useCardStore } from './cardStore';
import { useConnectionStore } from './connectionStore';
import { useHistoryStore } from './historyStore';

interface ClipboardState {
  clipboard: {
    cards: ICard[];
    connections: IConnection[];
  };
  
  handleCopy: () => void;
  handleCut: () => void;
  handlePaste: (mousePosition: IPosition) => void;
}

export const useClipboardStore = create<ClipboardState>((set, get) => ({
  clipboard: {
    cards: [],
    connections: []
  },
  
  handleCopy: () => {
    const cardStore = useCardStore.getState();
    const connectionStore = useConnectionStore.getState();
    
    // 复制选中的卡片
    const cardsToCopy = cardStore.cards.filter(card => 
      cardStore.selectedCardIds.includes(card.id)
    );
    
    // 复制选中的连接线和相关的连接线
    const connectionsToCopy = connectionStore.connections.filter(conn => 
      connectionStore.selectedConnectionIds.includes(conn.id) || 
      (cardStore.selectedCardIds.includes(conn.startCardId) && 
       cardStore.selectedCardIds.includes(conn.endCardId))
    );
    
    set({
      clipboard: {
        cards: JSON.parse(JSON.stringify(cardsToCopy)),
        connections: JSON.parse(JSON.stringify(connectionsToCopy))
      }
    });
  },
  
  handleCut: () => {
    const historyStore = useHistoryStore.getState();
    historyStore.addToHistory();
    
    get().handleCopy();
    
    const cardStore = useCardStore.getState();
    const connectionStore = useConnectionStore.getState();
    
    if (connectionStore.selectedConnectionIds.length > 0) {
      connectionStore.handleConnectionsDelete();
    }
    
    if (cardStore.selectedCardIds.length > 0) {
      cardStore.handleCardsDelete((cardId) => {
        connectionStore.handleConnectionsDelete({ cardId });
      });
    }
  },
  
  handlePaste: (mousePosition) => {
    const { clipboard } = get();
    const cardStore = useCardStore.getState();
    const connectionStore = useConnectionStore.getState();
    const historyStore = useHistoryStore.getState();
    
    if (clipboard.cards.length === 0) return;
    
    historyStore.addToHistory();
    
    // 创建 ID 映射
    const idMap: Record<string, string> = {};
    
    // 计算卡片组的中心位置
    const centerX = clipboard.cards.reduce((sum, card) => 
      sum + card.x + card.width/2, 0) / Math.max(1, clipboard.cards.length);
    const centerY = clipboard.cards.reduce((sum, card) => 
      sum + card.y + card.height/2, 0) / Math.max(1, clipboard.cards.length);
    
    // 计算偏移量使卡片组中心对准鼠标位置
    const offsetX = mousePosition.x - centerX;
    const offsetY = mousePosition.y - centerY;
    
    // 创建新卡片
    const newCards = clipboard.cards.map(card => {
      const newId = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      idMap[card.id] = newId;
      
      return {
        ...card,
        id: newId,
        x: card.x + offsetX,
        y: card.y + offsetY
      };
    });
    
    // 创建新连接线
    const newConnections = clipboard.connections
      .map(conn => {
        if (idMap[conn.startCardId] && idMap[conn.endCardId]) {
          return {
            ...conn,
            id: `conn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            startCardId: idMap[conn.startCardId],
            endCardId: idMap[conn.endCardId]
          };
        }
        return null;
      })
      .filter(conn => conn !== null) as IConnection[];
    
    // 更新状态
    cardStore.setCardsData([...cardStore.cards, ...newCards]);
    connectionStore.setConnectionsData([...connectionStore.connections, ...newConnections]);
    
    // 选择新粘贴的卡片
    cardStore.selectCards(newCards.map(card => card.id));
  }
}));