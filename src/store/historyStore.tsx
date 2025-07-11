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
  lastSaveTime: number; // 最后保存时间，用于防重复保存

  // 方法
  addToHistory: (beforeOperation?: boolean) => void; // 保存历史记录，beforeOperation=true表示操作前保存
  initializeHistory: () => void; // 初始化历史记录
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
  lastSaveTime: 0,

  // 保存历史记录的统一方法
  addToHistory: (beforeOperation = false) => {
    const now = Date.now();
    const { lastSaveTime } = get();

    // 防止短时间内重复保存（100ms内的重复调用将被忽略）
    if (now - lastSaveTime < 100) {
      Logger.debug('跳过重复的历史记录保存', { timeDiff: now - lastSaveTime });
      return;
    }

    const cardStore = useCardStore.getState();
    const connectionStore = useConnectionStore.getState();

    // 创建当前状态的副本
    const currentState: HistoryState = {
      cards: JSON.parse(JSON.stringify(cardStore.cards)),
      connections: JSON.parse(JSON.stringify(connectionStore.connections)),
      selectedCardId: cardStore.selectedCardId
    };

    const logMessage = beforeOperation ? '在操作前保存历史记录' : '添加新状态到历史记录';
    Logger.debug(logMessage, {
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
        canRedo: false,
        lastSaveTime: now
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

    // 获取当前状态
    const currentState: HistoryState = {
      cards: JSON.parse(JSON.stringify(cardStore.cards)),
      connections: JSON.parse(JSON.stringify(connectionStore.connections)),
      selectedCardId: cardStore.selectedCardId
    };

    // 获取要恢复的状态（历史记录中的最后一个状态）
    const previousState = past[past.length - 1];

    Logger.debug('撤销操作', {
      currentCardsCount: currentState.cards.length,
      previousCardsCount: previousState.cards.length,
      pastLength: past.length
    });

    // 恢复到上一个状态
    cardStore.setCardsData(previousState.cards);
    connectionStore.setConnectionsData(previousState.connections);
    cardStore.setSelectedCardId(previousState.selectedCardId);

    // 显示撤销消息
    uiStore.setShowUndoMessage(true);
    setTimeout(() => uiStore.setShowUndoMessage(false), 800);

    // 更新历史记录
    set(state => ({
      past: state.past.slice(0, -1), // 移除最后一个状态
      future: [currentState, ...state.future], // 将当前状态添加到未来记录的开头
      canUndo: state.past.length > 1, // 更新是否可以继续撤销
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
      canRedo: false,
      lastSaveTime: Date.now()
    });

    Logger.debug('历史记录已清空');
  },

  // 初始化历史记录（应用启动时调用）
  initializeHistory: () => {
    const { past } = get();

    // 如果已经有历史记录，不重复初始化
    if (past.length > 0) {
      Logger.debug('历史记录已存在，跳过初始化');
      return;
    }

    const cardStore = useCardStore.getState();
    const connectionStore = useConnectionStore.getState();

    // 创建初始状态
    const initialState: HistoryState = {
      cards: JSON.parse(JSON.stringify(cardStore.cards)),
      connections: JSON.parse(JSON.stringify(connectionStore.connections)),
      selectedCardId: cardStore.selectedCardId
    };

    Logger.debug('初始化历史记录', {
      cardsCount: initialState.cards.length,
      connectionsCount: initialState.connections.length
    });

    set({
      past: [initialState],
      future: [],
      canUndo: false, // 初始状态不能撤销
      canRedo: false,
      lastSaveTime: Date.now()
    });
  }
}));

// 初始化函数：在应用启动时调用
export const initializeHistoryStore = () => {
  // 延迟初始化，确保其他store已经加载完成
  setTimeout(() => {
    const historyStore = useHistoryStore.getState();
    historyStore.initializeHistory();
  }, 50); // 短暂延迟确保cardStore和connectionStore已经初始化
};