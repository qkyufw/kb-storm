import React from 'react';
import '../styles/Connection.css';

interface ConnectionProps {
  connection: {
    id: string;
    startCardId: string;
    endCardId: string;
    label?: string;
  };
  cards: {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  isSelected?: boolean; // 添加选中状态
  isHighlighted?: boolean; // 添加是否高亮属性
  onClick?: (e: React.MouseEvent) => void; // 添加点击事件
}

const Connection: React.FC<ConnectionProps> = ({ connection, cards, isSelected, isHighlighted = false, onClick }) => {
  const startCard = cards.find(card => card.id === connection.startCardId);
  const endCard = cards.find(card => card.id === connection.endCardId);
  
  if (!startCard || !endCard) return null;
  
  // 计算连线的起点和终点
  const startX = startCard.x + startCard.width / 2;
  const startY = startCard.y + startCard.height / 2;
  const endX = endCard.x + endCard.width / 2;
  const endY = endCard.y + endCard.height / 2;
  
  // 计算贝塞尔曲线的控制点
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const controlPointOffset = distance / 3;
  
  // 生成用于点击检测的区域路径
  const svgPath = `M ${startX},${startY} C ${startX + controlPointOffset},${startY} ${endX - controlPointOffset},${endY} ${endX},${endY}`;
  
  return (
    <svg 
      className={`connection ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      onClick={onClick} // 添加点击事件
    >
      <defs>
        <marker
          id={`arrow-${connection.id}`}
          viewBox="0 0 10 10"
          refX="5"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill={isSelected ? "#4285f4" : "black"} />
        </marker>
      </defs>
      
      {/* 添加一个宽一些的透明路径用于更容易点击 */}
      <path
        d={svgPath}
        fill="transparent"
        stroke="transparent"
        strokeWidth="20"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
      />
      
      <path
        d={svgPath}
        fill="transparent"
        stroke={isSelected ? "#4285f4" : "black"}
        strokeWidth={isSelected ? "3" : "2"}
        markerEnd={`url(#arrow-${connection.id})`}
        style={{ pointerEvents: 'none' }}
      />
      
      {connection.label && (
        <text
          x={(startX + endX) / 2}
          y={(startY + endY) / 2 - 10}
          textAnchor="middle"
          fill={isSelected ? "#4285f4" : "black"}
          pointerEvents="none"
        >
          {connection.label}
        </text>
      )}
    </svg>
  );
};

export default Connection;
