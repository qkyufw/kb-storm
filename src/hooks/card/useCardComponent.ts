import { useCallback, useState, useRef } from 'react';
import { ICard } from '../../types/CoreTypes';

/**
 * 卡片组件操作钩子
 */
export const useCardComponent = (
  card: ICard,
  isEditing: boolean,
  onContentChange: (content: string) => void,
  onEditComplete: () => void,
  onMove?: (cardId: string, deltaX: number, deltaY: number) => void
) => {
  const [dimensions, setDimensions] = useState({ width: card.width, height: card.height });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 自动调整文本区域大小
  const autoResizeTextArea = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      
      // 确保卡片足够大以显示全部内容
      const newWidth = Math.max(160, inputRef.current.scrollWidth + 20);
      const newHeight = Math.max(80, inputRef.current.scrollHeight + 20);
      
      setDimensions({ width: newWidth, height: newHeight });
    }
  }, []);

  // 处理卡片内容修改
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onContentChange(e.target.value);
    setTimeout(autoResizeTextArea, 0);
  }, [onContentChange, autoResizeTextArea]);

  // 处理键盘按下事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      onEditComplete();
    } else if (e.key === 'Escape') {
      onEditComplete();
    }
    
    // 在每次按键时都调整大小
    setTimeout(autoResizeTextArea, 0);
  }, [onEditComplete, autoResizeTextArea]);

  // 处理卡片拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 只在左键点击且不是编辑状态时处理拖拽
    if (!isEditing && e.button === 0) {
      e.stopPropagation(); // 防止事件冒泡到画布
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  }, [isEditing]);

  // 处理鼠标移动事件
  const handleMouseMove = useCallback((e: MouseEvent) => {
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
  }, [isDragging, dragStart, card.id, onMove]);

  // 处理鼠标释放事件
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 获取卡片样式
  const getCardStyle = useCallback((isSelected: boolean) => {
    return {
      left: card.x,
      top: card.y,
      width: dimensions.width,
      height: dimensions.height,
      backgroundColor: card.color,
      minWidth: '160px',
      minHeight: '80px',
      zIndex: isSelected || isDragging ? 10 : 1,
      cursor: !isEditing && (isSelected || isDragging) ? 'move' : 'pointer',
    };
  }, [card.x, card.y, card.color, dimensions.width, dimensions.height, isEditing, isDragging]);

  return {
    cardRef,
    inputRef,
    contentRef,
    dimensions,
    isDragging,
    autoResizeTextArea,
    handleChange,
    handleKeyDown,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    getCardStyle
  };
};

export default useCardComponent;
