import { useClipboardStore } from '../../store/clipboardStore';
import { useUIStore } from '../../store/UIStore';
import { calculatePastePosition } from '../ui/clipboard';

/**
 * 粘贴服务 - 简化版，使用统一的剪贴板工具函数
 */
export const pasteClipboardService = (): void => {
  const clipboard = useClipboardStore.getState();
  const ui = useUIStore.getState();

  // 使用统一的位置计算函数
  const mousePosition = calculatePastePosition(
    ui.mapRef,
    ui.pan,
    ui.zoomLevel,
    ui.viewportInfo
  );

  clipboard.handlePaste(mousePosition);
};
