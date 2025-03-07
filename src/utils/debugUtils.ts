/**
 * 调试工具函数
 */

// 控制是否输出调试信息
const DEBUG = true;

/**
 * 输出调试日志
 * @param message 调试消息
 * @param data 可选的数据对象
 */
export const debugLog = (message: string, data?: any): void => {
  if (!DEBUG) return;
  
  if (data !== undefined) {
    console.log(`[DEBUG] ${message}`, data);
  } else {
    console.log(`[DEBUG] ${message}`);
  }
};

export default {
  debugLog
};
