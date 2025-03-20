import React, { useState, useEffect } from 'react';
import '../../styles/ZoomControls.css';

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onReset
}) => {
  const [showIndicator, setShowIndicator] = useState(false);
  
  // 在缩放级别变化时显示指示器
  useEffect(() => {
    setShowIndicator(true);
    const timer = setTimeout(() => {
      setShowIndicator(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [zoomLevel]);
  
  return (
    <div className="zoom-controls-container">
      <div className="zoom-controls">
        <button 
          className="zoom-button" 
          onClick={onZoomOut}
          title="缩小 (Ctrl+ -)"
        >
          <span>−</span>
        </button>
        
        <button 
          className="zoom-level-indicator" 
          onClick={onReset}
          title="重置视图 (Ctrl+空格)"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        
        <button 
          className="zoom-button" 
          onClick={onZoomIn}
          title="放大 (Ctrl+ +)"
        >
          <span>+</span>
        </button>
      </div>
      
      {showIndicator && (
        <div className="zoom-indicator">
          {Math.round(zoomLevel * 100)}%
        </div>
      )}
    </div>
  );
};

export default ZoomControls;
