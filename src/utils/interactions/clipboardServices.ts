import { useClipboardStore } from '../../store/clipboardStore';
import { useUIStore } from '../../store/UIStore';
import { IPosition } from '../../types/CoreTypes';

/**
 * 粘贴服务
 */
export const pasteClipboardService = (): void => {
  const clipboard = useClipboardStore.getState();
  const ui = useUIStore.getState();
  
  // 计算鼠标位置
  let mousePosition: IPosition;
  
  if (ui.mapRef.current) {
    // 尝试从全局事件获取鼠标位置
    const lastEvent = window.event as MouseEvent;
    if (lastEvent && lastEvent.clientX) {
      const rect = ui.mapRef.current.getBoundingClientRect();
      mousePosition = {
        x: (lastEvent.clientX - rect.left - ui.pan.x) / ui.zoomLevel,
        y: (lastEvent.clientY - rect.top - ui.pan.y) / ui.zoomLevel
      };
    } else {
      // 回退到视口中心
      mousePosition = {
        x: (ui.viewportInfo.viewportWidth / 2 - ui.pan.x) / ui.zoomLevel,
        y: (ui.viewportInfo.viewportHeight / 2 - ui.pan.y) / ui.zoomLevel
      };
    }
  } else {
    // 如果没有参考点，使用默认坐标
    mousePosition = { x: 100, y: 100 };
  }
  
  clipboard.handlePaste(mousePosition);
};
