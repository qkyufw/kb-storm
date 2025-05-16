import React, { useEffect, useCallback, useRef } from 'react';
import './App.css';

// 导入 Stores
import { useUIStore } from './store/UIStore';
import { useExportImportStore } from './store/exportImportStore';

// 导入组件
import MindMapKeyboardHandler from './handlers/MindMapKeyboardHandler';
import MindMapContent from './components/Content/MindMapContent';
import MindMapHeader from './components/Header/Toolbar';
import ZoomControls from './components/Content/ZoomControls';
import { RenderModals } from './components/Modals/ModalComponents';

const App: React.FC = () => {
  // 使用 Stores
  const ui = useUIStore();
  
  // 地图容器引用
  const mapRef = useRef<HTMLDivElement | null>(null);
  
  // 设置ref的回调函数
  const setMapRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node && node !== mapRef.current) {
      mapRef.current = node;
      ui.setMapRef(node);
    }
  }, []);
  
  // 响应窗口尺寸变化
  useEffect(() => {
    const handleResize = () => ui.updateViewportInfo();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 更新 UI 状态
  useEffect(() => {
    ui.updateViewportInfo();
  }, [ui.zoomLevel, ui.pan]);
  
  return (
    <div className="mind-map-container">
      <MindMapKeyboardHandler/>
      <MindMapHeader/>
      <MindMapContent mapRefCallback={setMapRefCallback} />
      <ZoomControls />
      <RenderModals />
    </div>
  );
};

export default App;