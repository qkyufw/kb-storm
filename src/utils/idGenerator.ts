/**
 * 统一的ID生成工具
 * 避免在多个文件中重复相同的ID生成逻辑
 */

// 计数器，用于确保在同一毫秒内生成的ID也是唯一的
let idCounter = 0;

/**
 * 生成简单的唯一ID（基于时间戳 + 计数器）
 * 适用于不需要高度唯一性的场景
 */
export const generateSimpleId = (prefix: string): string => {
  idCounter = (idCounter + 1) % 10000; // 防止计数器无限增长
  return `${prefix}-${Date.now()}-${idCounter}`;
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

/**
 * 生成确保唯一的卡片ID
 * @param existingIds 现有的ID数组，用于检查重复
 * @returns 唯一的卡片ID
 */
export const generateUniqueCardIdWithCheck = (existingIds: string[]): string => {
  let cardId = generateCardId();
  let attempts = 0;

  // 最多尝试100次，避免无限循环
  while (existingIds.includes(cardId) && attempts < 100) {
    cardId = generateCardId();
    attempts++;
  }

  // 如果100次都重复，使用更复杂的ID生成
  if (attempts >= 100) {
    cardId = generateUniqueCardId();
  }

  return cardId;
};
