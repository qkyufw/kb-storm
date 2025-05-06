import React, { createContext, useContext, ReactNode } from 'react';
import { ICard, IConnection, IKeyBindings, ISize, IPosition } from '../types/CoreTypes';
import { LayoutAlgorithm, LayoutOptions } from '../utils/layoutUtils';
import { useMindMapCore } from '../hooks/core/useMindMapCore';
import { useCentralState } from '../hooks/core/useCentralState';

// 定义上下文类型
export interface MindMapContextType {
  // 核心状态
  cards: ICard[];
  connections: IConnection[];
  selectedCardId: string | null;
  selectedCardIds: string[];
  selectedConnectionIds: string[];
  editingCardId: string | null;
  editingConnectionId: string | null;
  zoomLevel: number;
  pan: { x: number, y: number };
  connectionMode: boolean;
  connectionStart: string | null;
  connectionTargetCardId: string | null;
  keyBindings: IKeyBindings;
  showKeyBindings: boolean;
  showUndoMessage: boolean;
  showRedoMessage: boolean;
  freeConnectionMode: boolean;
  spacePressed: boolean;
  tabPressed: boolean;
  
  // 引用 - 修复 mapRef 类型
  mapRef: React.RefObject<HTMLDivElement | null>;
  
  // 历史状态
  canUndo: boolean;
  canRedo: boolean;
  
  // 函数 - 卡片操作
  createCard: (size: ISize) => void;
  createCardAtPosition: (position: IPosition, content?: string) => ICard;
  updateCardContent: (cardId: string, content: string) => void;
  moveCard: (cardId: string, deltaX: number, deltaY: number) => void;
  updateCardPosition: (cardId: string, position: IPosition) => void;
  updateCardSize: (cardId: string, size: ISize) => void;
  setSelectedCardId: (cardId: string | null) => void;
  setEditingCardId: (cardId: string | null) => void;
  setCardsData: (cards: ICard[]) => void;
  selectCard: (cardId: string, isMultiSelect: boolean) => void;
  selectCards: (cardIds: string[]) => void;
  clearSelection: () => void;
  moveMultipleCards: (cardIds: string[], deltaX: number, deltaY: number) => void;
  deleteCards: (cardIds: string | string[]) => void;
  selectNextCard: (reverse: boolean) => void;
  selectNearestCard: (direction: 'up' | 'down' | 'left' | 'right') => void;
  createConnectedCard: (direction: 'up' | 'down' | 'left' | 'right') => void;
  
  // 函数 - 连接操作
  startConnectionMode: (cardId: string) => void;
  cancelConnectionMode: () => void;
  completeConnection: (endCardId: string) => void;
  setConnectionsData: (connections: IConnection[]) => void;
  selectConnection: (connectionId: string, isMultiSelect: boolean) => void;
  clearConnectionSelection: () => void;
  setConnectionTargetCardId: (cardId: string | null) => void;
  updateConnectionLabel: (connectionId: string, label: string) => void;
  setEditingConnectionId: (connectionId: string | null) => void;
  handleConnectionsDelete: (options?: {
    connectionIds?: string[];
    cardId?: string;
    selected?: boolean;
  }) => void;
  selectNextConnection: (reverse: boolean) => void;
  
  // 函数 - 布局
  changeLayoutAlgorithm: (algorithm: LayoutAlgorithm, options?: LayoutOptions) => void;
  getLayoutSettings: () => { algorithm: LayoutAlgorithm; options: LayoutOptions };
  
  // 函数 - 视图
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  setPan: (newPan: { x: number; y: number }) => void;
  
  // 函数 - 历史记录
  undo: () => void;
  redo: () => void;
  addHistory: () => void;
  
  // 函数 - UI状态
  setShowKeyBindings: (show: boolean | ((prevShow: boolean) => boolean)) => void;
  setTabPressed: (pressed: boolean) => void;
  setSpacePressed: (pressed: boolean) => void;
  updateKeyBindings: (newBindings: IKeyBindings) => void;
  
  // 函数 - 其他
  handlePaste: (position?: IPosition) => void;
  handleDelete: () => void;
  handleUndo: () => void;
  handleRedo: () => void;
  getMapSize: () => ISize;
  
  // 函数 - 连续移动
  startContinuousMove: (deltaX: number, deltaY: number, isLargeStep: boolean) => void;
  stopContinuousMove: () => void;
  
  // 函数 - 自由连线
  setFreeConnectionMode: (mode: boolean) => void;
}

// 创建上下文
export const MindMapContext = createContext<MindMapContextType | null>(null);

// Provider 组件
export const MindMapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const centralState = useCentralState();
  
  // 创建一个修复类型的包装函数来适配 deleteCards
  const deleteCardsWrapper = (cardIds: string | string[]): void => {
    // 如果传入单个字符串，转换为数组
    const idsArray = Array.isArray(cardIds) ? cardIds : [cardIds];
    centralState.cards.deleteCards(idsArray);
  };
  
  // 组合所有状态和函数
  const value: MindMapContextType = {
    // 核心状态
    cards: centralState.cards.cards,
    connections: centralState.connections.connections,
    selectedCardId: centralState.cards.selectedCardId,
    selectedCardIds: centralState.cards.selectedCardIds,
    selectedConnectionIds: centralState.connections.selectedConnectionIds,
    editingCardId: centralState.cards.editingCardId,
    editingConnectionId: centralState.connections.editingConnectionId,
    zoomLevel: centralState.zoomLevel,
    pan: centralState.pan,
    connectionMode: centralState.connections.connectionMode,
    connectionStart: centralState.connections.connectionStart,
    connectionTargetCardId: centralState.connections.connectionTargetCardId,
    keyBindings: centralState.keyBindings,
    showKeyBindings: centralState.showKeyBindings,
    showUndoMessage: centralState.showUndoMessage,
    showRedoMessage: centralState.showRedoMessage,
    freeConnectionMode: centralState.freeConnectionMode,
    spacePressed: centralState.spacePressed,
    tabPressed: centralState.tabPressed,
    
    // 引用
    mapRef: centralState.mapRef as React.RefObject<HTMLDivElement | null>,
    
    // 历史状态
    canUndo: centralState.history.canUndo,
    canRedo: centralState.history.canRedo,
    
    // 所有函数
    createCard: centralState.cards.createCard,
    createCardAtPosition: centralState.cards.createCardAtPosition,
    updateCardContent: centralState.cards.updateCardContent,
    moveCard: centralState.cards.moveCard,
    updateCardPosition: centralState.cards.updateCardPosition,
    updateCardSize: centralState.cards.updateCardSize,
    setSelectedCardId: centralState.cards.setSelectedCardId,
    setEditingCardId: centralState.cards.setEditingCardId,
    setCardsData: centralState.cards.setCardsData,
    selectCard: centralState.cards.selectCard,
    selectCards: centralState.cards.selectCards,
    clearSelection: centralState.cards.clearSelection,
    moveMultipleCards: centralState.cards.moveMultipleCards,
    deleteCards: deleteCardsWrapper,
    selectNextCard: centralState.cards.selectNextCard,
    selectNearestCard: centralState.selectNearestCard,
    createConnectedCard: centralState.createConnectedCard,
    
    // 连接操作
    startConnectionMode: centralState.connections.startConnectionMode,
    cancelConnectionMode: centralState.connections.cancelConnectionMode,
    completeConnection: centralState.connections.completeConnection,
    setConnectionsData: centralState.connections.setConnectionsData,
    selectConnection: centralState.connections.selectConnection,
    clearConnectionSelection: centralState.connections.clearConnectionSelection,
    setConnectionTargetCardId: centralState.connections.setConnectionTargetCardId,
    updateConnectionLabel: centralState.connections.updateConnectionLabel,
    setEditingConnectionId: centralState.connections.setEditingConnectionId,
    handleConnectionsDelete: centralState.connections.handleConnectionsDelete,
    selectNextConnection: centralState.connections.selectNextConnection,
    
    // 布局
    changeLayoutAlgorithm: centralState.cards.changeLayoutAlgorithm,
    getLayoutSettings: centralState.cards.getLayoutSettings,
    
    // 视图控制 - 添加确实的属性
    setZoomLevel: centralState.setZoomLevel,
    setPan: centralState.setPan,
    
    // 历史记录
    undo: centralState.history.undo,
    redo: centralState.history.redo,
    addHistory: centralState.history.addToHistory,
    
    // UI状态 - 添加缺失的属性
    setShowKeyBindings: centralState.setShowKeyBindings,
    setTabPressed: centralState.setTabPressed,
    setSpacePressed: centralState.setSpacePressed,
    updateKeyBindings: centralState.updateKeyBindings,
    
    // 其他核心函数
    handlePaste: centralState.handlePaste,
    handleDelete: centralState.handleDelete,
    handleUndo: centralState.handleUndo,
    handleRedo: centralState.handleRedo,
    getMapSize: centralState.getMapSize,
    
    // 卡片移动和自由连线 - 添加缺失的函数
    startContinuousMove: centralState.startContinuousMove,
    stopContinuousMove: centralState.stopContinuousMove,
    setFreeConnectionMode: centralState.setFreeConnectionMode,
  };
  
  return (
    <MindMapContext.Provider value={value}>
      {children}
    </MindMapContext.Provider>
  );
};

// 自定义钩子
export const useMindMap = (): MindMapContextType => {
  const context = useContext(MindMapContext);
  if (!context) {
    throw new Error('useMindMap must be used within a MindMapProvider');
  }
  return context;
};
