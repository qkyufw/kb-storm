import React, { useEffect, useCallback, useRef } from 'react';
import './App.css';

import { useUIStore } from './store/UIStore';
import { useExportImportStore } from './store/exportImportStore'; // 修正大小写

// 导入组件
import KeyboardManager from './components/KeyboardManager';
import MindMapContent from './components/MindMapContent';
import MindMapHeader from './components/Toolbar';
import ZoomControls from './components/ZoomControls';
import { RenderModals } from './components/ModalComponents';
import { initializeCardStore } from './store/cardStore';
import { initializeConnectionStore } from './store/connectionStore';

const App: React.FC = () => {
  // 使用 Stores
  const ui = useUIStore();
  const exportImport = useExportImportStore();
  
  // 地图容器引用
  const mapRef = useRef<HTMLDivElement | null>(null);
  
  // 设置ref的回调函数
  const setMapRefCallback = useCallback((node: HTMLDivElement | null) => {
    if (node && node !== mapRef.current) {
      mapRef.current = node;
      ui.setMapRef(node);
      exportImport.setCanvasRef(node);
    }
  }, [ui, exportImport]);
  
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

  // 初始化加载存储的数据
  useEffect(() => {
    // 先加载卡片，然后加载连接线
    initializeCardStore();
    initializeConnectionStore();
    
    console.log("从本地存储加载了思维导图数据");
  }, []);
  
  return (
    <div className="mind-map-container">
      <KeyboardManager/>
      <MindMapHeader/>
      <MindMapContent mapRefCallback={setMapRefCallback} />
      <ZoomControls />
      <RenderModals />
    </div>
  );
};

export default App;