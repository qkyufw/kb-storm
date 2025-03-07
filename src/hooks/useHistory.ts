// 历史记录Hook(用于撤销/重做)
import { useState, useCallback, useEffect } from 'react';
import { ICard, IConnection } from '../types';

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
  
  // 监听状态变化并记录历史
  useEffect(() => {
    if (shouldRecord && (cards.length > 0 || connections.length > 0)) {
      // 创建当前状态的副本
      const currentState: IHistoryState = {
        cards: JSON.parse(JSON.stringify(cards)),
        connections: JSON.parse(JSON.stringify(connections)),
        selectedCardId
      };
      
      // 如果当前不在历史记录的最新位置，则删除后面的记录
      if (historyIndex < history.length - 1) {
        setHistory(prev => prev.slice(0, historyIndex + 1));
      }
      
      // 添加新的历史记录
      setHistory(prev => [...prev, currentState]);
      setHistoryIndex(prev => prev + 1);
    }
  }, [cards, connections, selectedCardId, shouldRecord, historyIndex, history.length]);
  
  // 撤销操作
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    
    setShouldRecord(false); // 暂停记录历史
    
    const newIndex = historyIndex - 1;
    const prevState = history[newIndex];
    
    onRestore(prevState);
    setHistoryIndex(newIndex);
    
    setTimeout(() => setShouldRecord(true), 100);
  }, [historyIndex, history, onRestore]);
  
  // 重做操作
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    
    setShouldRecord(false); // 暂停记录历史
    
    const newIndex = historyIndex + 1;
    const nextState = history[newIndex];
    
    onRestore(nextState);
    setHistoryIndex(newIndex);
    
    setTimeout(() => setShouldRecord(true), 100);
  }, [historyIndex, history, onRestore]);
  
  return {
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo
  };
};
