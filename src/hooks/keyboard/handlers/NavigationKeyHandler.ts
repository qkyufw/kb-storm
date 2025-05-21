import { useUIStore, InteractionMode } from '../../../store/UIStore';
import { useCardStore } from '../../../store/cardStore';
import { useConnectionStore } from '../../../store/connectionStore';
import { KeyboardEventContext, KeyboardHandler, KeyHandlerResult } from '../../../types/KeyboardTypes';
import { findNearestCardInDirection } from '../../../utils/cardPositioning';
import { ICard } from '../../../types/CoreTypes';

export class NavigationKeyHandler implements KeyboardHandler {
  // 方向键步长（移动卡片时）
  private moveDistance = 10;
  
  // 实现接口所需的属性
  priority = 10; // 导航优先级高
  
  handleKeyDown(event: KeyboardEvent, context: KeyboardEventContext): KeyHandlerResult {
    return this.handle(event, context);
  }
  
  handle(event: KeyboardEvent, context: KeyboardEventContext): KeyHandlerResult {
    const { cards, connections, ui, isEditing } = context; // Added isEditing
    const { interactionMode } = ui;

    // If editing text in a card or connection, don't handle global navigation keys
    if (isEditing) {
      // Allow Tab/Arrows to function normally within the input field
      // by not marking the event as handled and not calling preventDefault.
      return { handled: false };
    }
    
    // 数字键2和3用于切换模式
    if (event.key === '2' && !event.repeat) {
      ui.setInteractionMode('cardMovement');
      // 当切换到卡片移动模式时，清除连接线选择
      if (connections.selectedConnectionIds.length > 0) {
        connections.clearConnectionSelection();
      }
      return { handled: true };
    }
    
    if (event.key === '3' && !event.repeat) {
      ui.setInteractionMode('connectionSelection');
      // 当切换到连接线选择模式时，清除卡片选择
      if (cards.selectedCardIds.length > 0) {
        cards.clearSelection();
      }
      return { handled: true };
    }
    
    if (event.key === '1' && !event.repeat) {
      ui.setInteractionMode('cardSelection');
      // 当切换到卡片选择模式时，清除连接线选择
      if (connections.selectedConnectionIds.length > 0) {
        connections.clearConnectionSelection();
      }
      return { handled: true };
    }
    
    // 移除 Shift+空格 切换模式的功能
    
    // 按下Tab键时的处理
    if (event.key === 'Tab') {
      event.preventDefault(); // 阻止默认Tab行为
      
      // 获取Shift键状态，用于确定方向
      const isReverse = event.shiftKey;
      
      if (interactionMode === 'cardSelection' || interactionMode === 'cardMovement') {
        this.handleTabForCardSelection(cards, isReverse);
        return { handled: true };
      } 
      // 连接线模式下，不在这里处理Tab键，交给ConnectionKeyHandler处理
      else if (interactionMode === 'connectionSelection') {
        return { handled: false };
      }
      
      return { handled: true };
    }
    
    // 处理方向键
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      // 在卡片选择模式下，方向键用于在卡片间导航
      if (interactionMode === 'cardSelection' && !connections.connectionMode) {
        return { handled: this.handleArrowKeyForCardSelection(event.key, cards) };
      }
      
      // 在连接线选择模式下，方向键用于在连接线间导航
      if (interactionMode === 'connectionSelection') {
        return { handled: this.handleArrowKeyForConnectionSelection(event.key, connections) };
      }
      
      // 在连线模式下使用方向键选择目标卡片
      if (connections.connectionMode) {
        // 这部分由ConnectionKeyHandler处理
        return { handled: false };
      }
      
      // 在卡片移动模式下，方向键用于移动卡片
      if (interactionMode === 'cardMovement') {
        return { handled: this.handleArrowKeyForCardMovement(event.key, cards) };
      }
    }
    
    return { handled: false };
  }
  
  private isArrowKey(key: string): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);
  }
  
  private handleArrowKey(event: KeyboardEvent, context: KeyboardEventContext): boolean {
    const { cards, connections, ui } = context;
    const { interactionMode } = ui;
    
    switch (interactionMode) {
      case 'cardSelection':
        return this.handleArrowKeyForCardSelection(event.key, cards);
      
      case 'cardMovement':
        return this.handleArrowKeyForCardMovement(event.key, cards);
      
      case 'connectionSelection':
        return this.handleArrowKeyForConnectionSelection(event.key, connections);
      
      default:
        return false;
    }
  }
  
  private handleTabForCardSelection(cards: any, isReverse: boolean): void {
    const allCards = cards.cards;
    
    if (allCards.length === 0) return;
    
    // 获取当前选中的卡片
    const currentSelection = cards.selectedCardId;
    
    if (!currentSelection || allCards.findIndex((card: ICard) => card.id === currentSelection) === -1) {
      // 如果没有选中卡片或选中的卡片不存在，选择第一个或最后一个
      const cardToSelect = isReverse ? allCards[allCards.length - 1].id : allCards[0].id;
      cards.setSelectedCardId(cardToSelect);
      return;
    }
    
    // 找到当前选中卡片的索引
    const currentIndex = allCards.findIndex((card: ICard) => card.id === currentSelection);
    
    // 计算下一个要选择的卡片索引
    let nextIndex;
    if (isReverse) {
      nextIndex = (currentIndex - 1 + allCards.length) % allCards.length;
    } else {
      nextIndex = (currentIndex + 1) % allCards.length;
    }
    
    // 选择下一个卡片
    cards.setSelectedCardId(allCards[nextIndex].id);
  }
  
  private handleTabForConnectionSelection(connections: any, isReverse: boolean): void {
    // 此处不再循环选择连接线，改为由ConnectionKeyHandler处理
    // 在连接线选择模式下按Tab键时，应该循环切换箭头类型而不是选择下一条线
  }
  
  private handleArrowKeyForCardSelection(key: string, cards: any): boolean {
    const { selectedCardId } = cards;
    
    // 如果没有选中卡片且有卡片存在，则选择第一个卡片
    if (!selectedCardId && cards.cards.length > 0) {
      cards.setSelectedCardId(cards.cards[0].id);
      return true;
    }
    
    if (!selectedCardId) return false;
    
    const direction = this.getDirectionFromKey(key);
    if (!direction) return false;
    
    const allCards = cards.cards;
    const currentCard = allCards.find((c: ICard) => c.id === selectedCardId);
    if (!currentCard) return false;
    
    // 将dx/dy转换为方向字符串
    let directionString: 'up' | 'down' | 'left' | 'right';
    if (direction.dy < 0) {
      directionString = 'up';
    } else if (direction.dy > 0) {
      directionString = 'down';
    } else if (direction.dx < 0) {
      directionString = 'left';
    } else {
      directionString = 'right';
    }
    
    const nearestCard = findNearestCardInDirection(
      currentCard,
      allCards,
      directionString
    );
    
    if (nearestCard) {
      cards.setSelectedCardId(nearestCard.id);
      return true;
    }
    
    return false;
  }
  
  private handleArrowKeyForCardMovement(key: string, cards: any): boolean {
    const { selectedCardIds } = cards;
    if (selectedCardIds.length === 0) {
      // 如果没有选中卡片，自动切换回卡片选择模式
      const uiStore = require('../../../store/UIStore').useUIStore.getState();
      uiStore.setInteractionMode('cardSelection');
      return false;
    }
    
    const direction = this.getDirectionFromKey(key);
    if (!direction) return false;
    
    cards.moveMultipleCards(
      selectedCardIds,
      direction.dx * this.moveDistance,
      direction.dy * this.moveDistance
    );
    
    return true;
  }
  
  private handleArrowKeyForConnectionSelection(key: string, connections: any): boolean {
    // 现在只实现根据上下箭头循环选择连接线
    if (key === 'ArrowDown' || key === 'ArrowRight') {
      connections.selectNextConnection(false);
      return true;
    } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
      connections.selectNextConnection(true);
      return true;
    }
    
    return false;
  }
  
  private getDirectionFromKey(key: string): { dx: number; dy: number } | null {
    switch (key) {
      case 'ArrowUp':
        return { dx: 0, dy: -1 };
      case 'ArrowDown':
        return { dx: 0, dy: 1 };
      case 'ArrowLeft':
        return { dx: -1, dy: 0 };
      case 'ArrowRight':
        return { dx: 1, dy: 0 };
      default:
        return null;
    }
  }
}
