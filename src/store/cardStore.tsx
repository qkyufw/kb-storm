import { create } from 'zustand';
import { ICard, IPosition, ISize } from '../types/CoreTypes';
import { calculateNewCardPosition, LayoutAlgorithm, LayoutOptions } from '../utils/layoutUtils';
import { getRandomColor } from '../utils/ui/colors';
import { Logger } from '../utils/log';

// 定义卡片状态类型
interface CardState {
  // 状态
  cards: ICard[];
  selectedCardId: string | null;
  selectedCardIds: string[];
  editingCardId: string | null;
  lastCardPosition: IPosition;
  layoutAlgorithm: LayoutAlgorithm; // 可根据需要扩展
  layoutOptions: { spacing: number; jitter: number };
  
  // 操作方法
  setCardsData: (cards: ICard[]) => void;
  setSelectedCardId: (id: string | null) => void;
  selectCard: (id: string, isMultiSelect: boolean) => void;
  selectCards: (ids: string[], clearPrevious?: boolean) => void;
  clearSelection: () => void;
  setEditingCardId: (id: string | null) => void;
  createCard: (size: ISize, viewportInfo: any) => ICard;
  createCardAtPosition: (position: IPosition) => ICard;
  updateCardContent: (cardId: string, content: string) => void;
  moveCard: (cardId: string, deltaX: number, deltaY: number) => void;
  moveMultipleCards: (cardIds: string[], deltaX: number, deltaY: number) => void;
  deleteCards: (cardIds: string[]) => void;
  getLayoutSettings: () => { algorithm: any; options: any };
  changeLayoutAlgorithm: (algorithm: any, options: any) => void;
  handleCardsDelete: (deleteCardConnections?: (cardId: string) => void) => void;
}

// 创建卡片状态 store
export const useCardStore = create<CardState>((set, get) => ({
  // 初始状态
  cards: [],
  selectedCardId: null,
  selectedCardIds: [],
  editingCardId: null,
  lastCardPosition: { x: 100, y: 100 },
  layoutAlgorithm: 'random',
  layoutOptions: { spacing: 180, jitter: 10 },
  
  // 设置卡片数据
  setCardsData: (cards) => set({ cards }),
  
  // 选择卡片
  setSelectedCardId: (id) => {
    // 记录这个卡片选择操作
    const { cards, selectedCardId } = get();
    
    if (id === null) {
      Logger.selection('取消选择', '卡片', selectedCardId);
    } else {
      // 查找卡片内容用于日志输出
      const card = cards.find(c => c.id === id);
      const cardInfo = card ? `${id} (${card.content.substring(0, 15)}${card.content.length > 15 ? '...' : ''})` : id;
      Logger.selection('选择', '卡片', cardInfo);
    }
    
    // 更新选择状态
    set({ selectedCardId: id });
    
    // 如果选择了一张卡片，则更新选中卡片数组为只包含这张卡片
    if (id !== null) {
      set({ selectedCardIds: [id] });
    } else {
      set({ selectedCardIds: [] });
    }
  },
  
  // 单个卡片选择（支持多选）
  selectCard: (cardId, isMultiSelect) => {
    const { cards, selectedCardIds } = get();
    const card = cards.find(c => c.id === cardId);
    const cardInfo = card ? `${cardId} (${card.content.substring(0, 15)}${card.content.length > 15 ? '...' : ''})` : cardId;
    
    if (isMultiSelect) {
      // 多选模式
      if (selectedCardIds.includes(cardId)) {
        Logger.selection('取消选择', '卡片', cardInfo);
        set((state) => ({ 
          selectedCardIds: state.selectedCardIds.filter(id => id !== cardId),
          // 如果移除后还有一张卡片，则更新单选状态
          selectedCardId: state.selectedCardIds.length === 2 ? 
            state.selectedCardIds.find(id => id !== cardId) || null : 
            null
        }));
      } else {
        // 添加到多选
        Logger.selection('添加选择', '卡片', cardInfo);
        set((state) => ({ 
          selectedCardIds: [...state.selectedCardIds, cardId],
          // 保持兼容性，设置单选卡片为此卡片
          selectedCardId: cardId
        }));
      }
    } else {
      // 单选模式
      Logger.selection('选择', '卡片', cardInfo);
      set({ 
        selectedCardId: cardId, 
        selectedCardIds: [cardId] 
      });
    }
  },
  
  // 批量选择卡片
  selectCards: (cardIds, clearPrevious = true) => {
    const { cards, selectedCardIds } = get();
    
    if (cardIds.length === 0) {
      Logger.selection('清空选择', '卡片', selectedCardIds);
    } else {
      // 记录所有选择的卡片
      const cardInfos = cardIds.map(id => {
        const card = cards.find(c => c.id === id);
        return card ? `${id} (${card.content.substring(0, 10)}...)` : id;
      });
      
      Logger.selection(
        cardIds.length === 1 ? '选择单张' : '批量选择',
        '卡片',
        cardIds.length > 3 
          ? `[${cardInfos.slice(0, 3).join(', ')} 和 ${cardIds.length - 3} 张其他卡片]`
          : `[${cardInfos.join(', ')}]`
      );
    }
    
    // 更新选择状态
    if (clearPrevious) {
      set({ selectedCardIds: cardIds });
    } else {
      set((state) => ({ 
        selectedCardIds: [...new Set([...state.selectedCardIds, ...cardIds])] 
      }));
    }
    
    // 更新单选状态
    set({ selectedCardId: cardIds.length === 1 ? cardIds[0] : null });
  },
  
  // 清除所有选择
  clearSelection: () => set({ selectedCardId: null, selectedCardIds: [] }),
  
  // 设置正在编辑的卡片
  setEditingCardId: (id) => set({ editingCardId: id }),
  
  // 创建新卡片
  createCard: (mapSize, viewportInfo) => {
    const { cards, lastCardPosition, layoutAlgorithm, layoutOptions } = get();
    
    console.log('!!!viewportInfo:', viewportInfo); // 调试输出视口信息
    const position = calculateNewCardPosition(
      lastCardPosition, 
      mapSize, 
      cards, 
      layoutAlgorithm, 
      layoutOptions,
      viewportInfo
    );
    
    const newCard: ICard = {
      id: `card-${Date.now()}`,
      content: '新建卡片',
      x: position.x,
      y: position.y,
      width: 160,
      height: 80,
      color: getRandomColor(),
    };
    
    set((state) => ({ 
      cards: [...state.cards, newCard],
      lastCardPosition: position,
      selectedCardId: newCard.id,
      selectedCardIds: [newCard.id],
      editingCardId: newCard.id
    }));
    
    return newCard;
  },
  
  // 在指定位置创建卡片
  createCardAtPosition: (position) => {
    const newCard: ICard = {
      id: `card-${Date.now()}`,
      content: '新建卡片',
      x: position.x,
      y: position.y,
      width: 160,
      height: 80,
      color: getRandomColor(),
    };
    
    set((state) => ({ 
      cards: [...state.cards, newCard],
      selectedCardId: newCard.id,
      selectedCardIds: [newCard.id],
      editingCardId: newCard.id
    }));
    
    return newCard;
  },
  
  // 更新卡片内容
  updateCardContent: (cardId, content) => {
    set((state) => ({
      cards: state.cards.map(card => 
        card.id === cardId ? { ...card, content } : card
      )
    }));
  },
  
  // 移动卡片
  moveCard: (cardId, deltaX, deltaY) => {
    set((state) => ({
      cards: state.cards.map(card => {
        if (card.id === cardId) {
          return {
            ...card,
            x: card.x + deltaX,
            y: card.y + deltaY
          };
        }
        return card;
      })
    }));
  },
  
  // 批量移动卡片
  moveMultipleCards: (cardIds, deltaX, deltaY) => {
    set((state) => ({
      cards: state.cards.map(card => {
        if (cardIds.includes(card.id)) {
          return {
            ...card,
            x: card.x + deltaX,
            y: card.y + deltaY
          };
        }
        return card;
      })
    }));
  },
  
  // 删除卡片
  deleteCards: (cardIds) => {
    if (!cardIds.length) return;
  
    set((state) => {
      // 过滤掉要删除的卡片
      const filteredCards = state.cards.filter(card => !cardIds.includes(card.id));
      
      // 清理选择状态
      const newSelectedCardIds = state.selectedCardIds.filter(id => !cardIds.includes(id));
      
      // 更新单选和编辑状态
      const newSelectedCardId = state.selectedCardId && cardIds.includes(state.selectedCardId) ? 
        null : state.selectedCardId;
        
      const newEditingCardId = state.editingCardId && cardIds.includes(state.editingCardId) ? 
        null : state.editingCardId;
      
      return {
        cards: filteredCards,
        selectedCardIds: newSelectedCardIds,
        selectedCardId: newSelectedCardId,
        editingCardId: newEditingCardId
      };
    });
  },
  
  // 处理卡片删除（包括相关连接）
  handleCardsDelete: (deleteCardConnections) => {
    const { selectedCardIds } = get();
    if (selectedCardIds.length === 0) return;
  
    // 复制选中的卡片ID数组
    const cardsToDelete = [...selectedCardIds];
    
    // 记录要删除的所有卡片
    const { cards } = get();
    const deleteInfo = cardsToDelete.map(id => {
      const card = cards.find(c => c.id === id);
      return card ? `${id} (${card.content.substring(0, 10)}...)` : id;
    }).join(', ');
    Logger.selection('批量删除', '卡片', deleteInfo);
    
    // 删除卡片相关连接
    if (deleteCardConnections) {
      cardsToDelete.forEach(cardId => deleteCardConnections(cardId));
    }
    
    // 删除卡片
    get().deleteCards(cardsToDelete);
  },
  
  // 获取当前布局设置
  getLayoutSettings: () => {
    const { layoutAlgorithm, layoutOptions } = get();
    return { 
      algorithm: layoutAlgorithm, 
      options: layoutOptions
    };
  },
  
  // 更改布局算法
  changeLayoutAlgorithm: (algorithm: LayoutAlgorithm, options: LayoutOptions) => {
    set({ layoutAlgorithm: algorithm });
    if (options) {
      set((state) => ({ 
        layoutOptions: { ...state.layoutOptions, ...options } 
      }));
    }
  }
}));