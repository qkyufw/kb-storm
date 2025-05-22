import { useCardStore } from '../../store/cardStore';
import { findNearestCardInDirection } from '../../utils/cardPositioning';

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
