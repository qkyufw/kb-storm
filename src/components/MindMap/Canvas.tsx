import React, { forwardRef } from 'react';
import Card from '../Card';
import Connection from '../Connection';
import { ICard, IConnection } from '../../types';

interface CanvasProps {
  cards: ICard[];
  connections: IConnection[];
  selectedCardId: string | null;
  editingCardId: string | null;
  connectionMode: boolean;
  zoomLevel: number;
  pan: { x: number, y: number };
  onCardSelect: (cardId: string) => void;
  onCardContentChange: (cardId: string, content: string) => void;
  onEditComplete: () => void;
}

const Canvas = forwardRef<HTMLDivElement, CanvasProps>((
  { 
    cards, 
    connections, 
    selectedCardId, 
    editingCardId, 
    connectionMode,
    zoomLevel,
    pan,
    onCardSelect,
    onCardContentChange,
    onEditComplete
  }, 
  ref
) => {
  return (
    <div 
      ref={ref}
      className="mind-map"
      style={{
        transform: `scale(${zoomLevel}) translate(${pan.x}px, ${pan.y}px)`,
      }}
    >
      {connections.map(connection => (
        <Connection
          key={connection.id}
          connection={connection}
          cards={cards}
        />
      ))}
      
      {cards.map(card => (
        <Card
          key={card.id}
          card={card}
          isSelected={selectedCardId === card.id}
          isEditing={editingCardId === card.id}
          onClick={() => onCardSelect(card.id)}
          onContentChange={(content: string) => onCardContentChange(card.id, content)}
          onEditComplete={onEditComplete}
        />
      ))}
    </div>
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;
