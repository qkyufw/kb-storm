import React, { useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();

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

  // 更新页面标题
  useEffect(() => {
    document.title = (t as any)('app.title') || 'KB Storm';
  }, [t, i18n.language]);

  // 响应窗口尺寸变化
  useEffect(() => {
    const handleResize = () => ui.updateViewportInfo();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [ui.updateViewportInfo]);
  
  // 更新 UI 状态 - 只在组件挂载时执行一次
  useEffect(() => {
    ui.updateViewportInfo();
  }, []); // 移除ui依赖，避免无限循环

  // 初始化加载存储的数据 - 只在组件挂载时执行一次
  useEffect(() => {
    // 先加载卡片，然后加载连接线
    initializeCardStore();
    initializeConnectionStore();

    console.log("从本地存储加载了思维导图数据");

    // 延迟执行智能定位，确保数据已加载且UI已渲染
    setTimeout(() => {
      const cardStore = require('./store/cardStore').useCardStore.getState();
      const cards = cardStore.cards;

      // 如果有卡片，自动定位到卡片区域
      if (cards && cards.length > 0) {
        const { calculatePanToFitCards } = require('./utils/layoutUtils');

        const panToCards = calculatePanToFitCards(cards, {
          viewportWidth: ui.viewportInfo.viewportWidth,
          viewportHeight: ui.viewportInfo.viewportHeight,
          zoom: ui.zoomLevel
        });

        if (panToCards) {
          ui.setPan(panToCards);
          console.log("初始化时定位到卡片区域:", panToCards);
        }
      }
    }, 100); // 短暂延迟确保渲染完成
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