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
  isEditing?: boolean;
  onClick: (e: React.MouseEvent) => void; // 修改为接收鼠标事件参数
  onContentChange: (content: string) => void;
  onEditComplete: () => void;
  onMove?: (cardId: string, deltaX: number, deltaY: number) => void;  // 添加拖动回调
}

const Card: React.FC<CardProps> = ({
  card,
  isSelected,
  isEditing = false,
  onClick,
  onContentChange,
  onEditComplete,
  onMove
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: card.width, height: card.height });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
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
      // 处理非编辑状态下的内容尺寸
      const contentWidth = contentRef.current.scrollWidth;
      const contentHeight = contentRef.current.scrollHeight;
      
      // 只有当内容实际需要更大空间时才调整
      if (contentWidth > card.width - 20 || contentHeight > card.height - 20) {
        const newWidth = Math.max(160, contentWidth + 20);
        const newHeight = Math.max(80, contentHeight + 20);
        setDimensions({ width: newWidth, height: newHeight });
      } else {
        // 否则保持原始尺寸，避免频繁调整
        setDimensions({ width: card.width, height: card.height });
      }
    }
  }, [isEditing, card.content, card.width, card.height]);
  
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
  
  // 处理卡片拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    // 只在左键点击且不是编辑状态时处理拖拽
    if (isSelected && !isEditing && e.button === 0) {
      e.stopPropagation(); // 防止事件冒泡到画布
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };
  
  // 处理卡片拖拽移动
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        // 计算实际移动距离
        setDragStart({ x: e.clientX, y: e.clientY });
        
        // 如果有移动回调，通知父组件
        if (onMove) {
          onMove(card.id, deltaX, deltaY);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, card.id, onMove]);
  
  // 处理点击事件，将原始事件传递给父组件
  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing) {
      onClick(e);
    }
  };

  const getCardStyle = () => {
    return {
      left: card.x,
      top: card.y,
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: card.color,
      minWidth: '160px', // 确保有最小宽度
      minHeight: '80px',  // 确保有最小高度
      zIndex: isSelected || isDragging ? 10 : 3, // 确保卡片在连接线(z-index: 1)上方
      cursor: isSelected && !isEditing ? 'move' : 'pointer',
    };
  };

  return (
    <div
      ref={cardRef}
      className={`card ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      style={getCardStyle()}
      onClick={handleClick} // 传递事件对象
      onMouseDown={handleMouseDown}
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
