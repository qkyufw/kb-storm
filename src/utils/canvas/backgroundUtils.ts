/**
 * 背景网格处理工具函数
 */

const GRID_SIZE = 20; // 基础网格大小

/**
 * 更新背景网格样式
 * @param element 画布元素
 * @param zoomLevel 缩放级别
 * @param pan 平移位置
 */
export const updateBackgroundGrid = (
  element: HTMLElement | null,
  zoomLevel: number,
  pan: { x: number, y: number }
): void => {
  if (!element) return;
  
  // 计算网格参数
  const gridScale = zoomLevel >= 1 ? zoomLevel : 1;
  const scaledGridSize = GRID_SIZE * gridScale;
  const offsetX = (pan.x % scaledGridSize) / gridScale;
  const offsetY = (pan.y % scaledGridSize) / gridScale;
  
  // 查找背景网格元素并更新样式
  const backgroundGrid = element.querySelector('.background-grid') as HTMLElement;
  if (backgroundGrid) {
    backgroundGrid.style.backgroundSize = `${scaledGridSize}px ${scaledGridSize}px`;
    backgroundGrid.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
  }
};

/**
 * 获取背景网格样式对象
 */
export const getBackgroundGridStyle = (
  zoomLevel: number,
  pan: { x: number, y: number }
) => {
  const gridScale = zoomLevel >= 1 ? zoomLevel : 1;
  const scaledGridSize = GRID_SIZE * gridScale;
  const offsetX = (pan.x % scaledGridSize) / gridScale;
  const offsetY = (pan.y % scaledGridSize) / gridScale;
  
  return {
    backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
    backgroundPosition: `${offsetX}px ${offsetY}px`,
  };
};
