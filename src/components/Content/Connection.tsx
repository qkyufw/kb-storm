import React, { useRef, useEffect, useState } from 'react';
import { ICard, IConnection } from '../../types/CoreTypes';
import '../../styles/Connection.css';

interface ConnectionProps {
  connection: IConnection;
  cards: ICard[];
  isSelected: boolean;
  isHighlighted?: boolean;
  isEditing?: boolean;
  onClick: (e: React.MouseEvent) => void;
  onLabelChange?: (label: string) => void;
  onEditComplete?: () => void;
}

const Connection: React.FC<ConnectionProps> = ({ 
  connection, 
  cards, 
  isSelected,
  isHighlighted = false,
  isEditing = false,
  onClick,
  onLabelChange,
  onEditComplete
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [labelPosition, setLabelPosition] = useState({ x: 0, y: 0 });

  // 将 Hook 调用移到条件语句之前，避免 Hook 调用顺序问题
  // 更新标签位置
  useEffect(() => {
    const startCard = cards.find(card => card.id === connection.startCardId);
    const endCard = cards.find(card => card.id === connection.endCardId);
    
    if (startCard && endCard) {
      const startX = startCard.x + startCard.width / 2;
      const startY = startCard.y + startCard.height / 2;
      const endX = endCard.x + endCard.width / 2;
      const endY = endCard.y + endCard.height / 2;
      
      setLabelPosition({ 
        x: (startX + endX) / 2, 
        y: (startY + endY) / 2 
      });
    }
  }, [cards, connection.startCardId, connection.endCardId]);
  
  // 自动聚焦输入框 - 始终保持此处 Hook 调用
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 查找起始和结束卡片
  const startCard = cards.find(card => card.id === connection.startCardId);
  const endCard = cards.find(card => card.id === connection.endCardId);
  
  // 如果缺少卡片则不渲染连接线
  if (!startCard || !endCard) {
    return null;
  }
  
  // 计算连接线路径 - 使用贝塞尔曲线算法，使线条更平滑
  // 获取卡片中心点
  const startX = startCard.x + startCard.width / 2;
  const startY = startCard.y + startCard.height / 2;
  const endX = endCard.x + endCard.width / 2;
  const endY = endCard.y + endCard.height / 2;
  
  // 计算控制点以创建平滑的曲线
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // 控制点偏移量 - 距离越远，曲线越平滑
  const curveFactor = distance * 0.2; // 这个因子可以调整曲线的弯曲程度
  
  // 确定控制点 - 采用水平方向控制点
  const cp1x = startX + curveFactor;
  const cp1y = startY;
  const cp2x = endX - curveFactor;
  const cp2y = endY;
  
  // 生成贝塞尔曲线路径
  const pathData = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
  
  // 处理输入完成
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      if (onEditComplete) {
        onEditComplete();
      }
    }
  };
  
  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onLabelChange) {
      onLabelChange(e.target.value);
    }
  };
  
  // 处理失去焦点
  const handleBlur = () => {
    if (onEditComplete) {
      onEditComplete();
    }
  };

  return (
    <>
      <svg 
        className={`connection ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1 // 将图层设置在卡片下方
        }}
      >
        <path
          d={pathData}
          stroke={isSelected ? '#4285f4' : '#888'}
          strokeWidth={isSelected ? 3 : 2}
          fill="none"
          style={{ 
            pointerEvents: 'stroke', // 确保线条可以接收鼠标事件
            cursor: 'pointer',       // 鼠标悬停时显示指针光标 
            strokeLinecap: 'round',  // 使线条端点圆滑
            strokeLinejoin: 'round'  // 使线条连接处圆滑
          }}
          onClick={onClick}
        />
        {/* 添加一条更宽的透明线用于接收点击事件 */}
        <line 
          x1={startX} 
          y1={startY} 
          x2={endX} 
          y2={endY}
          stroke="transparent" 
          strokeWidth={12} // 增加交互区域宽度
          pointerEvents="all"
          onClick={onClick}
          style={{ cursor: 'pointer' }}
        />
      </svg>
      
      {/* 连接线标签 - 移除背景和边框 */}
      <div 
        className="connection-label-container"
        style={{
          position: 'absolute',
          left: labelPosition.x,
          top: labelPosition.y,
          transform: 'translate(-50%, -50%)',
          zIndex: 5, // 标签应该在卡片之上
          pointerEvents: 'none'
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="connection-label-input"
            defaultValue={connection.label || ''}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleBlur}
            style={{ pointerEvents: 'auto' }}
          />
        ) : connection.label ? (
          <div 
            className={`connection-label-text ${isSelected ? 'selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onClick(e);
            }}
            style={{ pointerEvents: 'auto' }}
          >
            {connection.label}
          </div>
        ) : null}
      </div>
    </>
  );
};

export default Connection;
