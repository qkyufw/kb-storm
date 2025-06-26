/**
 * 统一的ID生成工具
 * 避免在多个文件中重复相同的ID生成逻辑
 */

/**
 * 生成简单的唯一ID（基于时间戳）
 * 适用于不需要高度唯一性的场景
 */
export const generateSimpleId = (prefix: string): string => {
  return `${prefix}-${Date.now()}`;
};

/**
 * 生成复杂的唯一ID（时间戳 + 随机字符串）
 * 适用于需要高度唯一性的场景，如导入/导出
 */
export const generateUniqueId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * 生成卡片ID
 */
export const generateCardId = (): string => {
  return generateSimpleId('card');
};

/**
 * 生成连接线ID
 */
export const generateConnectionId = (): string => {
  return generateSimpleId('conn');
};

/**
 * 生成唯一卡片ID（用于导入/导出）
 */
export const generateUniqueCardId = (): string => {
  return generateUniqueId('card');
};

/**
 * 生成唯一连接线ID（用于导入/导出）
 */
export const generateUniqueConnectionId = (): string => {
  return generateUniqueId('conn');
};
