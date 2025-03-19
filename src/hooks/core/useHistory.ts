import { useState, useCallback, useEffect } from 'react';
import { ICard, IConnection } from '../types/CoreTypes';

interface IHistoryState {
  cards: ICard[];
  connections: IConnection[];
  selectedCardId: string | null;
}

export const useHistory = (
  cards: ICard[],
  connections: IConnection[],
  selectedCardId: string | null,
  onRestore: (state: IHistoryState) => void
) => {
  const [history, setHistory] = useState<IHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [shouldRecord, setShouldRecord] = useState<boolean>(true);
  
  // 初始化历史记录
  useEffect(() => {
    // 如果历史为空且有卡片或连接，记录初始状态
    if (history.length === 0) {
      const initialState: IHistoryState = {
        cards: JSON.parse(JSON.stringify(cards)),
        connections: JSON.parse(JSON.stringify(connections)),
        selectedCardId
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []); // 仅初始化时执行一次
  
  // 监听状态变化并记录历史
  useEffect(() => {
    if (!shouldRecord) return;
    
    // 为避免不必要的历史记录，检查状态是否实际发生了变化
    if (historyIndex >= 0 && history.length > 0) {
      const currentState = history[historyIndex];
      
      // 简单的深度比较检查 (可以使用更高效的方法)
      const cardsEqual = JSON.stringify(currentState.cards) === JSON.stringify(cards);
      const connectionsEqual = JSON.stringify(currentState.connections) === JSON.stringify(connections);
      
      // 如果状态没有变化，不添加新历史
      if (cardsEqual && connectionsEqual && currentState.selectedCardId === selectedCardId) {
        return;
      }
    }
    
    // 创建当前状态的副本
    const newState: IHistoryState = {
      cards: JSON.parse(JSON.stringify(cards)),
      connections: JSON.parse(JSON.stringify(connections)),
      selectedCardId
    };
    
    // 如果当前不在历史记录的最新位置，则删除后面的记录
    if (historyIndex < history.length - 1) {
      setHistory(prev => prev.slice(0, historyIndex + 1));
    }
    
    // 添加新的历史记录
    setHistory(prev => [...prev, newState]);
    setHistoryIndex(prev => prev + 1);
  }, [cards, connections, selectedCardId, shouldRecord, historyIndex, history.length]);
  
  // 撤销操作
  const undo = useCallback(() => {
    if (historyIndex <= 0) {
      console.log('无法撤销：已经是最早的状态');
      return;
    }
    
    console.log(`执行撤销：从索引 ${historyIndex} 到 ${historyIndex - 1}`);
    setShouldRecord(false); // 暂停记录历史
    
    const newIndex = historyIndex - 1;
    const prevState = history[newIndex];
    
    onRestore(prevState);
    setHistoryIndex(newIndex);
    
    setTimeout(() => setShouldRecord(true), 100);
  }, [historyIndex, history, onRestore]);
  
  // 重做操作
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) {
      console.log('无法重做：已经是最新的状态');
      return;
    }
    
    console.log(`执行重做：从索引 ${historyIndex} 到 ${historyIndex + 1}`);
    setShouldRecord(false); // 暂停记录历史
    
    const newIndex = historyIndex + 1;
    const nextState = history[newIndex];
    
    onRestore(nextState);
    setHistoryIndex(newIndex);
    
    setTimeout(() => setShouldRecord(true), 100);
  }, [historyIndex, history, onRestore]);
  
  // 添加新的历史记录
  const addToHistory = useCallback(() => {
    const newState = {
      cards: [...cards],
      connections: [...connections],
      selectedCardId
    };
    
    // 如果在历史记录中间进行了操作，则截断后面的历史记录
    if (historyIndex < history.length - 1) {
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, newState]);
    } else {
      // 正常添加到历史记录
      const newHistory = [...history, newState];
      
      // 如果历史记录过长，则移除最老的记录
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      
      setHistory(newHistory);
    }
    
    setHistoryIndex(Math.min(historyIndex + 1, 49));
  }, [cards, connections, selectedCardId, history, historyIndex]);
  
  return {
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo,
    addToHistory, // 确保暴露了这个方法
  };
};
