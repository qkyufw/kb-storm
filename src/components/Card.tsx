import React, { useRef, useEffect, useState } from 'react';
import '../styles/canvas/Card.css';
import { useCardStore } from '../store/cardStore';

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
  isTargeted?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onContentChange: (content: string) => void;
  onEditComplete: () => void;
  onMove?: (cardId: string, deltaX: number, deltaY: number) => void;
}

const Card: React.FC<CardProps> = ({
  card,
  isSelected,
  isEditing = false,
  isTargeted = false,
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
  const [wasDragged, setWasDragged] = useState(false);
  
  // 自动调整文本区域大小
  const autoResizeTextArea = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      
      // 确保卡片足够大以显示全部内容
      const newHeight = Math.max(80, inputRef.current.scrollHeight + 20);
      
      setDimensions({ width: inputRef.current.scrollWidth, height: newHeight });
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
  
  // 添加 useEffect 来处理编辑模式下的文本全选
  useEffect(() => {
    if (isEditing && inputRef.current) {
      // 设置定时器延迟执行全选，确保文本框已完全渲染
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 10);
      
      return () => clearTimeout(timer);
    }
  }, [isEditing]);
  
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      autoResizeTextArea();
    }
  }, [isEditing]);
  
  // 修改：确保在退出编辑模式前文本框失去焦点
  const handleEditComplete = () => {
    // 先让文本框失去焦点
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    // 延迟一下再调用onEditComplete，确保焦点已经完全释放
    setTimeout(() => {
      // 主动将焦点设置到画布上
      document.getElementById('canvas-wrapper')?.focus();
      onEditComplete();
    }, 10);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      // 修改：使用新的处理方法
      handleEditComplete();
    } else if (e.key === 'Escape') {
      // 修改：使用新的处理方法
      handleEditComplete();
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
      setWasDragged(false); // 重置拖拽状态
    }
  };
  
  // 处理卡片拖拽移动
  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // 只有超过一定阈值才标记为拖拽
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        setWasDragged(true);
      }
      
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        setDragStart({ x: e.clientX, y: e.clientY });
        if (onMove) {
          onMove(card.id, deltaX, deltaY);
        }
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      
      // 拖拽结束后，保存状态
      if (wasDragged) {
        const cardStore = useCardStore.getState();
        cardStore.saveState();
      }
      
      // 保持wasDragged标记一小段时间，让点击事件可以读取
      setTimeout(() => {
        setWasDragged(false);
      }, 50); // 50ms足够了，不需要过长
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, card.id, onMove, wasDragged]);
  
  // 处理点击事件，将原始事件传递给父组件
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 只有当不是拖拽结束后的点击时才触发选择
    if (!isEditing && !wasDragged) {
      onClick(e);
    }
  };
  
  // 修改卡片样式函数以支持目标高亮
  const getCardStyle = () => {
    return {
      left: card.x,
      top: card.y,
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: card.color,
      minWidth: '160px',
      minHeight: '80px',
      border: isTargeted 
        ? '3px dashed #4285f4' 
        : isSelected 
          ? '2px solid #4285f4' 
          : '1px solid #ddd',
      boxShadow: isTargeted 
        ? '0 0 10px rgba(66, 133, 244, 0.8)' 
        : isSelected 
          ? '0 0 5px rgba(66, 133, 244, 0.5)' 
          : '0 1px 3px rgba(0, 0, 0, 0.1)',
      zIndex: isTargeted ? 12 : isSelected || isDragging ? 10 : 1,
      cursor: !isEditing && (isSelected || isDragging) ? 'move' : 'pointer',
    };
  };

  return (
    <div
      ref={cardRef}
      className={`card ${isSelected ? 'selected' : ''} ${isTargeted ? 'targeted' : ''} ${isDragging ? 'dragging' : ''}`}
      style={getCardStyle()}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      data-id={card.id}
      data-was-dragged={wasDragged.toString()}
    >
      <textarea
        ref={inputRef}
        value={card.content}
        onChange={isEditing ? handleChange : undefined}
        onKeyDown={isEditing ? handleKeyDown : undefined}
        onBlur={isEditing ? handleEditComplete : undefined} 
        className={`card-editor ${isEditing ? '' : 'readonly'}`}
        style={{ 
          width: '100%', 
          height: '100%', 
          overflow: 'hidden',
          cursor: isEditing ? 'text' : 'pointer',
          resize: 'none',
          background: 'transparent',
          border: 'none',
          outline: 'none',
        }}
        readOnly={!isEditing}
        onKeyPress={(e) => {
          if (isEditing && e.key === 'Enter' && 
              e.currentTarget.selectionStart === 0 && 
              e.currentTarget.selectionEnd === card.content.length) {
            e.preventDefault();
          }
        }}
      />
    </div>
  );
};

export default Card;