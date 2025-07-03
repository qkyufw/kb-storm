/**
 * 卡片尺寸计算工具
 */

export interface CardSizeConfig {
  baseWidth: number;
  baseHeight: number;
  charWidth: number;  // 每个字符的估算宽度
  lineHeight: number; // 每行的估算高度
  padding: number;    // 内边距
}

// 默认配置
export const DEFAULT_CARD_SIZE_CONFIG: CardSizeConfig = {
  baseWidth: 160,
  baseHeight: 80,
  charWidth: 8,
  lineHeight: 20,
  padding: 20
};

/**
 * 根据内容计算最优的卡片尺寸
 * @param content 卡片内容
 * @param config 尺寸配置
 * @returns 计算后的尺寸
 */
export function calculateOptimalCardSize(
  content: string,
  config: CardSizeConfig = DEFAULT_CARD_SIZE_CONFIG
): { width: number; height: number } {
  const { baseWidth, baseHeight, charWidth, lineHeight, padding } = config;
  const charCount = content.length;

  // 简单粗暴的判断：如果内容较短，保持原比例
  if (charCount <= 30) {
    return { width: baseWidth, height: baseHeight };
  }

  // 内容较长时，切换为1:1比例
  // 先确定一个基础的正方形尺寸（取较大的那个维度）
  let squareSize = Math.max(baseWidth, baseHeight);

  // 根据内容长度动态调整正方形尺寸，确保能容纳内容
  const charsPerLine = Math.floor((squareSize - padding) / charWidth);
  const linesNeeded = Math.ceil(charCount / charsPerLine);
  const minHeightNeeded = linesNeeded * lineHeight + padding;

  // 如果计算出的高度超过了当前的正方形尺寸，则增大正方形尺寸
  if (minHeightNeeded > squareSize) {
    squareSize = minHeightNeeded;
  }

  // 再次计算，确保宽度也足够，并添加安全边距
  const finalCharsPerLine = Math.floor((squareSize - padding) / charWidth);
  const finalLinesNeeded = Math.ceil(charCount / finalCharsPerLine);
  const finalHeight = Math.max(squareSize, finalLinesNeeded * lineHeight + padding);

  // 添加10%的安全边距，确保内容不会显示不全
  const safeWidth = Math.ceil(squareSize * 1.1);
  const safeHeight = Math.ceil(finalHeight * 1.1);

  return { width: safeWidth, height: safeHeight };
}

/**
 * 检查内容是否需要调整卡片尺寸
 * @param content 卡片内容
 * @param currentWidth 当前宽度
 * @param currentHeight 当前高度
 * @param config 尺寸配置
 * @returns 是否需要调整
 */
export function shouldResizeCard(
  content: string,
  currentWidth: number,
  currentHeight: number,
  config: CardSizeConfig = DEFAULT_CARD_SIZE_CONFIG
): boolean {
  const { charWidth, lineHeight, padding } = config;
  const charCount = content.length;
  
  // 计算当前尺寸能容纳的字符数
  const charsPerLine = Math.floor((currentWidth - padding) / charWidth);
  const linesInCurrent = Math.floor((currentHeight - padding) / lineHeight);
  const maxCharsInCurrent = charsPerLine * linesInCurrent;
  
  return charCount > maxCharsInCurrent;
}
