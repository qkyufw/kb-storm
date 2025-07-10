import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/canvas/Card.css';
import { useCardStore } from '../store/cardStore';
import { saveMindMapDataImmediate } from '../utils/storageUtils';

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
  isInMultiSelection?: boolean; // 添加新属性，表示是否在多选模式下
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
  isInMultiSelection = false, // 默认为false
  onClick,
  onContentChange,
  onEditComplete,
  onMove
}) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null); // 添加resize手柄引用
  
  const [dimensions, setDimensions] = useState({ width: card.width, height: card.height });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false); // 添加resizing状态
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [wasDragged, setWasDragged] = useState(false);
  const [startDimensions, setStartDimensions] = useState({ width: 0, height: 0 }); // 添加开始尺寸
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedColorIndex, setSelectedColorIndex] = useState<number>(-1);
  const [colorOptions, setColorOptions] = useState<string[]>([]);

  // 自动调整文本区域大小（使用useCallback优化）
  const autoResizeTextArea = useCallback(() => {
    if (inputRef.current) {
      // 保存原始宽度
      const originalWidth = dimensions.width;

      // 重置高度以获取实际需要的高度
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;

      // 确保卡片足够高以显示全部内容，但保持原有宽度
      const newHeight = Math.max(80, inputRef.current.scrollHeight + 20);

      // 只有当内容宽度超过现有宽度时才增加宽度，否则保持原宽度
      const contentWidth = inputRef.current.scrollWidth;
      const newWidth = contentWidth > originalWidth ? contentWidth : originalWidth;

      setDimensions({ width: newWidth, height: newHeight });
    }
  }, [dimensions.width]);
  
  // 编辑状态下的自动调整
  useEffect(() => {
    if (isEditing) {
      autoResizeTextArea();
    }
  }, [isEditing, card.content]);
  
  // 确保组件初始化时使用卡片的实际尺寸
  useEffect(() => {
    // 初始化时设置尺寸，但在调整和拖拽过程中不更新
    if (!isResizing && !isDragging) {
      setDimensions({ width: card.width, height: card.height });
    }
  }, [card.id]); // 只在卡片ID变化时更新，避免循环更新


  
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
      
      // 延迟执行自动调整大小，确保先保留了原始尺寸
      setTimeout(autoResizeTextArea, 0);
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
    
    // 输入文字时延迟自动调整大小，确保文字变化后才调整
    setTimeout(autoResizeTextArea, 0);
  };
  
  // 处理卡片拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    // 如果点击的是resize手柄，不触发卡片拖动
    if (resizeHandleRef.current && resizeHandleRef.current.contains(e.target as Node)) {
      e.stopPropagation();
      return;
    }
    
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
      
      // 拖拽结束后，立即保存状态（关键操作）
      if (wasDragged) {
        const cardStore = useCardStore.getState();
        const connectionStore = require('../store/connectionStore').useConnectionStore.getState();
        saveMindMapDataImmediate({
          cards: cardStore.cards,
          connections: connectionStore.connections
        });
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
  
  // 处理点击事件，将原始事件传递给父组件（使用useCallback优化）
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // 只有当不是拖拽结束后的点击时才触发选择
    if (!isEditing && !wasDragged) {
      onClick(e);
    }
  }, [isEditing, wasDragged, onClick]);

  // 修改卡片样式函数以支持目标高亮（使用useMemo优化）
  const cardStyle = useMemo(() => {
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
  }, [card.x, card.y, card.color, dimensions.width, dimensions.height, isTargeted, isSelected, isDragging, isEditing]);

  // 生成颜色选项
  useEffect(() => {
    // 常用的预定义柔和颜色
    const predefinedColors = [
      '#F9E7E7', // 柔和粉
      '#E7F9E7', // 柔和绿
      '#E7E7F9', // 柔和蓝
      '#F9F9E7', // 柔和黄
      '#F9E7F9', // 柔和紫
      '#E7F9F9', // 柔和青
      '#F5F5F5', // 浅灰
      '#FFFFFF'  // 白色
    ];
    
    setColorOptions(predefinedColors);
    
    // 找到当前颜色的索引
    const currentIndex = predefinedColors.indexOf(card.color);
    if (currentIndex !== -1) {
      setSelectedColorIndex(currentIndex);
    }
  }, [card.id, card.color]); // 只在卡片ID变化时重新生成

  // 处理颜色变化
  const handleColorChange = useCallback((color: string) => {
    // 获取cardStore并更新颜色
    const cardStore = useCardStore.getState();
    cardStore.updateCardColor(card.id, color);
  }, [card.id]);



  // 重写点击外部区域处理逻辑
  useEffect(() => {
    // 只在编辑模式下添加全局点击事件监听
    if (!isEditing) return;
    
    // 使用函数引用，以便可以正确移除监听器
    function handleGlobalClick(e: MouseEvent) {
      // 确保点击是发生在卡片外部
      const clickedElement = e.target as Node;
      if (cardRef.current && !cardRef.current.contains(clickedElement)) {
        // 防止事件冒泡
        e.stopPropagation();
        
        // 调用编辑完成函数
        handleEditComplete();
      }
    }
    
    // 使用捕获阶段处理点击，确保先于其他处理程序触发
    document.addEventListener('mousedown', handleGlobalClick, true);
    
    return () => {
      document.removeEventListener('mousedown', handleGlobalClick, true);
    };
  }, [isEditing, handleEditComplete]);
  
  // 修改处理resize过程的useEffect
  useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      // 计算新尺寸，确保最小尺寸
      const newWidth = Math.max(160, startDimensions.width + deltaX);
      const newHeight = Math.max(80, startDimensions.height + deltaY);
      
      setDimensions({ width: newWidth, height: newHeight });
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      setIsResizing(false);
      
      // 计算最终尺寸
      const finalWidth = Math.max(160, startDimensions.width + (e.clientX - dragStart.x));
      const finalHeight = Math.max(80, startDimensions.height + (e.clientY - dragStart.y));
      
      // 更新本地状态
      setDimensions({ width: finalWidth, height: finalHeight });
      
      // 保存到store
      const cardStore = useCardStore.getState();
      cardStore.updateCardSize(card.id, finalWidth, finalHeight);
      
      // 确保持久化
      setTimeout(() => cardStore.saveState(), 0);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, dragStart, startDimensions, card.id]);

  // 确保卡片在被选中时自动获得焦点
  useEffect(() => {
    if (isSelected && !isEditing && cardRef.current) {
      // 使用setTimeout确保DOM完全更新后再设置焦点
      setTimeout(() => {
        cardRef.current?.focus();
      }, 0);
    }
  }, [isSelected, isEditing]);

  // 改进Tab键处理函数
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isSelected || isEditing) return;
    
    if (e.key === 'Tab') {
      e.preventDefault(); // 阻止默认Tab行为
      
      // 循环到下一个颜色
      const nextIndex = (colorOptions.indexOf(card.color) + 1) % colorOptions.length;
      
      // 应用新颜色
      const cardStore = useCardStore.getState();
      cardStore.updateCardColor(card.id, colorOptions[nextIndex]);
      
      // 确保卡片保持焦点
      setTimeout(() => {
        if (cardRef.current) {
          cardRef.current.focus();
        }
      }, 0);
    }
  }, [isSelected, isEditing, colorOptions, card.id, card.color]);

  return (
    <div
      ref={cardRef}
      className={`card ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${isDragging ? 'dragging' : ''} ${isTargeted ? 'targeted' : ''} ${isResizing ? 'resizing' : ''}`}
      style={cardStyle}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onKeyDown={handleTabKeyDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!isEditing) {
          // 先选中卡片，再进入编辑模式
          onClick(e);
          // 获取卡片store并进入编辑模式
          const cardStore = useCardStore.getState();
          cardStore.setEditingCardId(card.id);
        }
      }}
      tabIndex={isSelected ? 0 : undefined}
    >
      {/* 只在单选模式下显示颜色工具栏 */}
      {isSelected && !isEditing && !isInMultiSelection && (
        <div className="card-toolbar">
          <div className="color-options">
            {colorOptions.map((color, index) => (
              <div
                key={index}
                className={`color-option ${card.color === color ? 'active' : ''}`}
                style={{ backgroundColor: color }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorChange(color);
                }}
                title={t('card.changeColor')}
              />
            ))}
          </div>
        </div>
      )}
      
      {isEditing ? (
        <textarea
          ref={inputRef}
          className="card-editor"
          value={card.content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      ) : (
        <div ref={contentRef} className="card-content">
          <textarea
            className="card-editor readonly"
            value={card.content}
            readOnly
          />
        </div>
      )}
      
      <div 
        ref={resizeHandleRef}
        className="resize-hint" 
        title={t('card.resizeHint')}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          
          if (isEditing) return;
          
          setIsResizing(true);
          setDragStart({ x: e.clientX, y: e.clientY });
          setStartDimensions({ width: dimensions.width, height: dimensions.height });
        }}
      ></div>
      
      {/* 只在单选模式下显示颜色提示 */}
      {isSelected && !isEditing && !isInMultiSelection && (
        <div className="color-hint">{t('card.colorHint')}</div>
      )}
    </div>
  );
};

// 使用React.memo优化组件，只有当props真正改变时才重新渲染
export default React.memo(Card, (prevProps, nextProps) => {
  // 自定义比较函数，深度比较card对象和其他props
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.content === nextProps.card.content &&
    prevProps.card.x === nextProps.card.x &&
    prevProps.card.y === nextProps.card.y &&
    prevProps.card.width === nextProps.card.width &&
    prevProps.card.height === nextProps.card.height &&
    prevProps.card.color === nextProps.card.color &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.isTargeted === nextProps.isTargeted &&
    prevProps.isInMultiSelection === nextProps.isInMultiSelection &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.onContentChange === nextProps.onContentChange &&
    prevProps.onEditComplete === nextProps.onEditComplete &&
    prevProps.onMove === nextProps.onMove
  );
});