import React, { useRef, useEffect, useState } from 'react';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: card.width, height: card.height });
  
  // 自动调整文本区域大小
  const autoResizeTextArea = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      
      // 确保卡片足够大以显示全部内容
      const newWidth = Math.max(160, inputRef.current.scrollWidth + 20);
      const newHeight = Math.max(80, inputRef.current.scrollHeight + 20);
      
      setDimensions({ width: newWidth, height: newHeight });
    }
  };
  
  // 当编辑状态或内容改变时自动调整尺寸
  useEffect(() => {
    if (isEditing) {
      autoResizeTextArea();
    } else if (contentRef.current) {
      // 当不在编辑状态时，也要确保内容可见
      const newWidth = Math.max(160, contentRef.current.scrollWidth + 20);
      const newHeight = Math.max(80, contentRef.current.scrollHeight + 20);
      setDimensions({ width: newWidth, height: newHeight });
    }
  }, [isEditing, card.content]);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      autoResizeTextArea();
    }
  }, [isEditing]);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onEditComplete();
    } else if (e.key === 'Escape') {
      onEditComplete();
    }
    
    // 在每次按键时都调整大小
    setTimeout(autoResizeTextArea, 0);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
    setTimeout(autoResizeTextArea, 0);
  };
  
  return (
    <div
      className={`card ${isSelected ? 'selected' : ''}`}
      style={{
        left: card.x,
        top: card.y,
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: card.color,
        minWidth: '160px', // 确保有最小宽度
        minHeight: '80px',  // 确保有最小高度
      }}
      onClick={onClick}
      data-id={card.id}
    >
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={card.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={onEditComplete}
          className="card-editor"
          style={{ 
            width: '100%', 
            height: '100%', 
            overflow: 'hidden'
          }}
        />
      ) : (
        <div 
          ref={contentRef} 
          className="card-content"
        >
          {card.content}
        </div>
      )}
    </div>
  );
};

export default Card;
