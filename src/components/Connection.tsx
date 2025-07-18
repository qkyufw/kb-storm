import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ICard, IConnection, ArrowType } from '../types/CoreTypes';
import { calculateConnectionRenderPoints, calculateBezierCurvePath } from '../utils/canvas/connectionUtils';
import '../styles/canvas/Connection.css';

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

  // 查找起始和结束卡片（使用useMemo缓存）
  const { startCard, endCard } = useMemo(() => {
    const start = cards.find(card => card.id === connection.startCardId);
    const end = cards.find(card => card.id === connection.endCardId);
    return { startCard: start, endCard: end };
  }, [cards, connection.startCardId, connection.endCardId]);

  // 计算连接线路径和箭头信息（使用useMemo缓存）
  const connectionData = useMemo(() => {
    // 如果缺少卡片则返回null
    if (!startCard || !endCard) {
      return null;
    }

    // 计算连接线起点和终点 - 使用工具函数
    const { startX, startY, endX, endY } = calculateConnectionRenderPoints(startCard, endCard);

    // 生成贝塞尔曲线路径 - 使用工具函数
    const pathData = calculateBezierCurvePath(startX, startY, endX, endY);

    // 生成箭头标记ID
    const startArrowId = `arrow-start-${connection.id}`;
    const endArrowId = `arrow-end-${connection.id}`;

    // 确定是否需要渲染箭头
    const arrowType = connection.arrowType || ArrowType.NONE;
    const showStartArrow = arrowType === ArrowType.START || arrowType === ArrowType.BOTH;
    const showEndArrow = arrowType === ArrowType.END || arrowType === ArrowType.BOTH;

    return {
      startX, startY, endX, endY, pathData,
      startArrowId, endArrowId, showStartArrow, showEndArrow
    };
  }, [startCard, endCard, connection.id, connection.arrowType]);

  // 为箭头类型添加样式类（使用useMemo缓存）
  const arrowClassNames = useMemo(() => {
    const arrowType = connection.arrowType || ArrowType.NONE;
    return `connection ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} arrow-${arrowType}`;
  }, [isSelected, isHighlighted, connection.arrowType]);

  // 处理输入完成（使用useCallback优化）
  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      if (onEditComplete) {
        onEditComplete();
      }
    }
  }, [onEditComplete]);

  // 处理输入变化（使用useCallback优化）
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (onLabelChange) {
      onLabelChange(e.target.value);
    }
  }, [onLabelChange]);

  // 处理失去焦点（使用useCallback优化）
  const handleBlur = useCallback(() => {
    if (onEditComplete) {
      onEditComplete();
    }
  }, [onEditComplete]);

  // 如果缺少卡片则不渲染连接线
  if (!connectionData) {
    return null;
  }

  return (
    <>
      <svg
        className={arrowClassNames}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      >
        {/* 定义箭头标记 - 调整refX值使箭头位于端点 */}
        <defs>
          <marker
            id={connectionData.startArrowId}
            viewBox="0 0 10 10"
            refX="2"  // 调整refX值使箭头位于起点
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={isSelected ? '#4285f4' : '#888'} />
          </marker>
          <marker
            id={connectionData.endArrowId}
            viewBox="0 0 10 10"
            refX="8"  // 调整refX值使箭头位于终点
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={isSelected ? '#4285f4' : '#888'} />
          </marker>
        </defs>

        <path
          d={connectionData.pathData}
          stroke={isSelected ? '#4285f4' : '#888'}
          strokeWidth={isSelected ? 3 : 2}
          fill="none"
          markerStart={connectionData.showStartArrow ? `url(#${connectionData.startArrowId})` : ''}
          markerEnd={connectionData.showEndArrow ? `url(#${connectionData.endArrowId})` : ''}
          style={{ 
            pointerEvents: 'stroke',
            cursor: 'pointer',
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
          }}
          onClick={onClick}
        />
        
        {/* 添加一条更宽的透明线用于接收点击事件 */}
        <path
          d={connectionData.pathData}
          stroke="transparent"
          strokeWidth={12}
          fill="none"
          pointerEvents="all"
          onClick={onClick}
          style={{ cursor: 'pointer' }}
        />
      </svg>
      
      {/* 连接线标签 - 确保标签位置跟随画布变换 */}
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

// 使用React.memo优化组件，只有当props真正改变时才重新渲染
export default React.memo(Connection, (prevProps, nextProps) => {
  // 自定义比较函数，深度比较connection对象和其他props
  return (
    prevProps.connection.id === nextProps.connection.id &&
    prevProps.connection.startCardId === nextProps.connection.startCardId &&
    prevProps.connection.endCardId === nextProps.connection.endCardId &&
    prevProps.connection.label === nextProps.connection.label &&
    prevProps.connection.arrowType === nextProps.connection.arrowType &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHighlighted === nextProps.isHighlighted &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.onClick === nextProps.onClick &&
    prevProps.onLabelChange === nextProps.onLabelChange &&
    prevProps.onEditComplete === nextProps.onEditComplete &&
    // 比较cards数组中相关卡片的变化
    (() => {
      const prevStartCard = prevProps.cards.find(card => card.id === prevProps.connection.startCardId);
      const nextStartCard = nextProps.cards.find(card => card.id === nextProps.connection.startCardId);
      const prevEndCard = prevProps.cards.find(card => card.id === prevProps.connection.endCardId);
      const nextEndCard = nextProps.cards.find(card => card.id === nextProps.connection.endCardId);

      return (
        prevStartCard?.x === nextStartCard?.x &&
        prevStartCard?.y === nextStartCard?.y &&
        prevStartCard?.width === nextStartCard?.width &&
        prevStartCard?.height === nextStartCard?.height &&
        prevEndCard?.x === nextEndCard?.x &&
        prevEndCard?.y === nextEndCard?.y &&
        prevEndCard?.width === nextEndCard?.width &&
        prevEndCard?.height === nextEndCard?.height
      );
    })()
  );
});