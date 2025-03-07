// 颜色相关工具函数

/**
 * 生成随机颜色
 */
export const getRandomColor = (): string => {
  const colors = ['#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff', '#ccffff'];
  return colors[Math.floor(Math.random() * colors.length)];
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
