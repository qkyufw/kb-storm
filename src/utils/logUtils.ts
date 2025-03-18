/**
 * 日志工具类
 */
export const LogUtils = {
  /**
   * 输出选择相关的日志
   * @param action 动作
   * @param target 目标
   * @param ids 相关ID
   */
  selection(action: string, target: string, ids: string | string[] | null): void {
    const idText = Array.isArray(ids) 
      ? `[${ids.length > 0 ? ids.join(', ') : '空'}]` 
      : (ids || '无');
    console.log(`🔍 选择操作: ${action} ${target} - ${idText}`);
  },
  
  /**
   * 格式化卡片信息用于日志输出
   * @param cardId 卡片ID
   * @param content 卡片内容
   * @returns 格式化后的信息
   */
  formatCardInfo(cardId: string, content: string | undefined): string {
    if (!content) return cardId;
    return `${cardId} (${content.substring(0, 15)}${content.length > 15 ? '...' : ''})`;
  }
};
