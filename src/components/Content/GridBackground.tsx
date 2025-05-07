import React from 'react';

interface GridBackgroundProps {
  pan: { x: number; y: number };
  zoomLevel: number;
}

const GridBackground: React.FC<GridBackgroundProps> = ({ pan, zoomLevel }) => {
  // 计算网格大小和偏移（关键部分）
  const gridSize = 20 * zoomLevel;
  const offsetX = pan.x % gridSize;
  const offsetY = pan.y % gridSize;

  return (
    <div className="grid-background"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, #cccccc 1px, transparent 1px)',
        backgroundSize: `${gridSize}px ${gridSize}px`,
        backgroundPosition: `${offsetX}px ${offsetY}px`,
        backgroundColor: 'rgb(245, 250, 255)'
      }}
    />
  );
};

export default GridBackground;