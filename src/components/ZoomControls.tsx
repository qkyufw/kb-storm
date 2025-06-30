import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../store/UIStore';
import '../styles/toolbar/ZoomControls.css';

const ZoomControls: React.FC = () => {
  const { t } = useTranslation();
  // 直接使用 UIStore
  const ui = useUIStore();

  return (
    <div className="zoom-controls-container">
      <button onClick={ui.handleZoomIn} className="zoom-button" title={t('zoom.zoomIn')}>
        <span>+</span>
      </button>
      <div className="zoom-level">
        {Math.round(ui.zoomLevel * 100)}%
      </div>
      <button onClick={ui.handleZoomOut} className="zoom-button" title={t('zoom.zoomOut')}>
        <span>-</span>
      </button>
      <button onClick={ui.resetView} className="zoom-button reset" title={t('zoom.resetView')}>
        <span>↺</span>
      </button>
    </div>
  );
};

export default ZoomControls;