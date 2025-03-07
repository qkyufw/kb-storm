import React, { useRef, useEffect } from 'react';
import '../styles/Card.css';

interface CardProps {
  card: {
    id: string;
    content: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
  };
  isSelected: boolean;
  isEditing: boolean;
  onClick: () => void;
  onContentChange: (content: string) => void;
  onEditComplete: () => void;
}

const Card: React.FC<CardProps> = ({
  card,
  isSelected,
  isEditing,
  onClick,
  onContentChange,
  onEditComplete
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onEditComplete();
    } else if (e.key === 'Escape') {
      onEditComplete();
    }
  };
  
  return (
    <div
      className={`card ${isSelected ? 'selected' : ''}`}
      style={{
        left: card.x,
        top: card.y,
        width: card.width,
        height: card.height,
        backgroundColor: card.color,
      }}
      onClick={onClick}
      data-id={card.id}
    >
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={card.content}
          onChange={(e) => onContentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={onEditComplete}
          className="card-editor"
        />
      ) : (
        <div className="card-content">{card.content}</div>
      )}
    </div>
  );
};

export default Card;
