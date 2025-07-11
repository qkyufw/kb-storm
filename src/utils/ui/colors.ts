// 颜色相关工具函数

/**
 * 预定义的卡片颜色选项（恢复原始的8种颜色）
 */
export const PREDEFINED_COLORS = [
  '#ffcccc', // 浅红
  '#ccffcc', // 浅绿
  '#ccccff', // 浅蓝
  '#ffffcc', // 浅黄
  '#ffccff', // 浅紫
  '#ccffff', // 浅青
  '#f0f0f0', // 浅灰
  '#ffffff'  // 白色
];

/**
 * 生成随机颜色
 * 从预定义颜色中随机选择一个（排除白色）
 */
export const getRandomColor = (): string => {
  // 排除最后一个白色，从前7种颜色中选择
  const colorIndex = Math.floor(Math.random() * (PREDEFINED_COLORS.length - 1));
  return PREDEFINED_COLORS[colorIndex];
};

/**
 * 获取互补色
 */
export const getComplementaryColor = (color: string): string => {
  // 移除#前缀并解析为RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // 计算互补色
  const rComp = 255 - r;
  const gComp = 255 - g;
  const bComp = 255 - b;
  
  // 转回十六进制格式
  return `#${rComp.toString(16).padStart(2, '0')}${gComp.toString(16).padStart(2, '0')}${bComp.toString(16).padStart(2, '0')}`;
};
