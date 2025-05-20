import React from 'react';
import { useUIStore } from '../store/UIStore';
import '../styles/toolbar/ZoomControls.css';

const ZoomControls: React.FC = () => {
  // 直接使用 UIStore
  const ui = useUIStore();
  
  return (
    <div className="zoom-controls-container">
      <button onClick={ui.handleZoomIn} className="zoom-button" title="放大">
        <span>+</span>
      </button>
      <div className="zoom-level">
        {Math.round(ui.zoomLevel * 100)}%
      </div>
      <button onClick={ui.handleZoomOut} className="zoom-button" title="缩小">
        <span>-</span>
      </button>
      <button onClick={ui.resetView} className="zoom-button reset" title="重置视图">
        <span>↺</span>
      </button>
    </div>
  );
};

export default ZoomControls;