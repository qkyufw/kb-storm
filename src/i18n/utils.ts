import { TFunction } from 'i18next';

/**
 * 格式化键盘快捷键显示文本
 * @param t 翻译函数
 * @param keyBinding 快捷键绑定
 * @param fallback 回退文本
 */
export const formatKeyBinding = (t: TFunction, keyBinding?: string, fallback?: string): string => {
  if (!keyBinding) {
    return fallback || ((t as any)('common.notSet') || '未设置');
  }
  
  // 处理组合键显示
  return keyBinding
    .replace(/ArrowUp/g, '↑')
    .replace(/ArrowDown/g, '↓')
    .replace(/ArrowLeft/g, '←')
    .replace(/ArrowRight/g, '→')
    .replace(/Ctrl/g, 'Ctrl')
    .replace(/Alt/g, 'Alt')
    .replace(/Shift/g, 'Shift');
};

/**
 * 生成带时间戳的文件名
 * @param t 翻译函数
 * @param baseName 基础文件名
 * @param extension 文件扩展名
 */
export const generateFileName = (t: TFunction, baseName?: string, extension?: string): string => {
  const base = baseName || ((t as any)('files.defaultName') || 'kbstorm');
  const ext = extension || '';
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');

  return `${base}-${timestamp}${ext}`;
};

/**
 * 格式化错误消息
 * @param t 翻译函数
 * @param error 错误对象或字符串
 * @param fallbackKey 回退翻译键
 */
export const formatErrorMessage = (t: TFunction, error: any, fallbackKey?: string): string => {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return fallbackKey ? ((t as any)(fallbackKey) || fallbackKey) : ((t as any)('common.error') || 'Error');
};

/**
 * 获取工具提示文本
 * @param t 翻译函数
 * @param actionKey 动作翻译键
 * @param keyBinding 快捷键
 */
export const getTooltipText = (t: TFunction, actionKey: string, keyBinding?: string): string => {
  const action = (t as any)(actionKey) || actionKey;
  if (keyBinding) {
    const formattedKey = formatKeyBinding(t, keyBinding);
    return `${action} (${formattedKey})`;
  }
  return action;
};

/**
 * 显示本地化的alert消息
 * @param t 翻译函数
 * @param messageKey 消息翻译键
 * @param interpolation 插值对象
 */
export const showLocalizedAlert = (t: TFunction, messageKey: string, interpolation?: any): void => {
  const message = interpolation ? ((t as any)(messageKey, interpolation) || messageKey) : ((t as any)(messageKey) || messageKey);
  alert(message);
};

/**
 * 显示本地化的console消息
 * @param t 翻译函数
 * @param level 日志级别
 * @param messageKey 消息翻译键
 * @param data 额外数据
 */
export const logLocalizedMessage = (
  t: TFunction, 
  level: 'log' | 'error' | 'warn' | 'info', 
  messageKey: string, 
  data?: any
): void => {
  const message = (t as any)(messageKey) || messageKey;
  console[level](message, data);
};
