import { create } from 'zustand';
import { ICard, IConnection } from '../types/CoreTypes';
import { useCardStore } from './cardStore';
import { useConnectionStore } from './connectionStore';
import { useUIStore } from './UIStore';
import { Logger } from '../utils/log';

// 历史状态类型
interface HistoryState {
  cards: ICard[];
  connections: IConnection[];
  selectedCardId: string | null;
}

// 历史管理 Store 类型
interface HistoryStoreState {
  // 状态
  past: HistoryState[];
  future: HistoryState[];
  canUndo: boolean;
  canRedo: boolean;
  
  // 方法
  addToHistory: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryStoreState>((set, get) => ({
  // 初始状态
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,
  
  // 添加当前状态到历史记录
  addToHistory: () => {
    const cardStore = useCardStore.getState();
    const connectionStore = useConnectionStore.getState();
    
    // 创建当前状态的副本
    const currentState: HistoryState = {
      cards: JSON.parse(JSON.stringify(cardStore.cards)),
      connections: JSON.parse(JSON.stringify(connectionStore.connections)),
      selectedCardId: cardStore.selectedCardId
    };
    
    Logger.debug('添加新状态到历史记录', {
      cardsCount: currentState.cards.length,
      connectionsCount: currentState.connections.length
    });
    
    set(state => {
      // 如果在历史中间进行了操作，则截断未来记录
      const newPast = [...state.past, currentState];
      
      // 只保留最新的50条记录
      const trimmedPast = newPast.length > 50 ? newPast.slice(-50) : newPast;
      
      return {
        past: trimmedPast,
        future: [], // 清空未来记录
        canUndo: trimmedPast.length > 1,
        canRedo: false
      };
    });
  },
  
  // 撤销到上一个状态
  undo: () => {
    const { past } = get();
    
    if (past.length <= 1) {
      Logger.debug('无法撤销：已经是最早的状态');
      return; // 没有可撤销的历史
    }
    
    const cardStore = useCardStore.getState();
    const connectionStore = useConnectionStore.getState();
    const uiStore = useUIStore.getState();
    
    // 获取当前状态和上一个状态
    const currentState: HistoryState = {
      cards: JSON.parse(JSON.stringify(cardStore.cards)),
      connections: JSON.parse(JSON.stringify(connectionStore.connections)),
      selectedCardId: cardStore.selectedCardId
    };
    
    // 获取上一个状态
    const previousState = past[past.length - 2];
    
    // 恢复到上一个状态
    cardStore.setCardsData(previousState.cards);
    connectionStore.setConnectionsData(previousState.connections);
    cardStore.setSelectedCardId(previousState.selectedCardId);
    
    // 显示撤销消息
    uiStore.setShowUndoMessage(true);
    setTimeout(() => uiStore.setShowUndoMessage(false), 800);
    
    // 更新历史记录
    set(state => ({
      past: state.past.slice(0, -1), // 移除最后一个状态（当前状态）
      future: [currentState, ...state.future], // 将当前状态添加到未来记录的开头
      canUndo: state.past.length > 2, // 更新是否可以继续撤销
      canRedo: true // 现在可以重做
    }));
    
    Logger.selection('执行', '撤销', null);
  },
  
  // 重做到下一个状态
  redo: () => {
    const { future } = get();
    
    if (future.length === 0) {
      Logger.debug('无法重做：没有可重做的操作');
      return; // 没有可重做的操作
    }
    
    const cardStore = useCardStore.getState();
    const connectionStore = useConnectionStore.getState();
    const uiStore = useUIStore.getState();
    
    // 获取当前状态
    const currentState: HistoryState = {
      cards: JSON.parse(JSON.stringify(cardStore.cards)),
      connections: JSON.parse(JSON.stringify(connectionStore.connections)),
      selectedCardId: cardStore.selectedCardId
    };
    
    // 获取下一个状态
    const nextState = future[0];
    
    // 恢复到下一个状态
    cardStore.setCardsData(nextState.cards);
    connectionStore.setConnectionsData(nextState.connections);
    cardStore.setSelectedCardId(nextState.selectedCardId);
    
    // 显示重做消息
    uiStore.setShowRedoMessage(true);
    setTimeout(() => uiStore.setShowRedoMessage(false), 800);
    
    // 更新历史记录
    set(state => ({
      past: [...state.past, currentState], // 将当前状态添加到历史记录
      future: state.future.slice(1), // 移除第一个未来状态（已重做）
      canUndo: true, // 现在可以撤销
      canRedo: state.future.length > 1 // 更新是否可以继续重做
    }));
    
    Logger.selection('执行', '重做', null);
  },
  
  // 清空历史记录
  clearHistory: () => {
    const cardStore = useCardStore.getState();
    const connectionStore = useConnectionStore.getState();
    
    // 创建当前状态的副本作为初始状态
    const initialState: HistoryState = {
      cards: JSON.parse(JSON.stringify(cardStore.cards)),
      connections: JSON.parse(JSON.stringify(connectionStore.connections)),
      selectedCardId: cardStore.selectedCardId
    };
    
    set({
      past: [initialState], // 仅保留当前状态
      future: [],
      canUndo: false,
      canRedo: false
    });
    
    Logger.debug('历史记录已清空');
  }
}));