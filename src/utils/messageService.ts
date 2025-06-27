import i18n from '../i18n';

/**
 * 国际化消息服务
 * 提供统一的消息显示和日志记录功能
 */
export class MessageService {
  /**
   * 显示本地化的alert消息
   */
  static showAlert(messageKey: string, interpolation?: any): void {
    try {
      const message = interpolation
        ? (i18n.t as any)(messageKey, interpolation)
        : (i18n.t as any)(messageKey);
      alert(message);
    } catch (error) {
      alert(messageKey); // 回退到原始键
    }
  }

  /**
   * 显示本地化的console消息
   */
  static log(level: 'log' | 'error' | 'warn' | 'info', messageKey: string, data?: any): void {
    try {
      const message = (i18n.t as any)(messageKey);
      console[level](message, data);
    } catch (error) {
      console[level](messageKey, data);
    }
  }

  /**
   * 显示错误消息
   */
  static showError(error: any, fallbackKey: string = 'common.error'): void {
    let message: string;
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else {
      try {
        message = (i18n.t as any)(fallbackKey);
      } catch {
        message = fallbackKey;
      }
    }
    
    alert(message);
  }

  /**
   * 记录错误日志
   */
  static logError(messageKey: string, error?: any): void {
    try {
      const message = (i18n.t as any)(messageKey);
      console.error(message, error);
    } catch {
      console.error(messageKey, error);
    }
  }

  /**
   * 显示成功消息
   */
  static showSuccess(messageKey: string, interpolation?: any): void {
    try {
      const message = interpolation
        ? (i18n.t as any)(messageKey, interpolation)
        : (i18n.t as any)(messageKey);

      // 可以在这里实现更好的成功提示UI，比如toast
      console.log(message);
    } catch {
      console.log(messageKey);
    }
  }

  /**
   * 生成本地化的文件名
   */
  static generateFileName(baseName?: string, extension?: string): string {
    let base = baseName;
    if (!base) {
      try {
        base = (i18n.t as any)('files.defaultName');
      } catch {
        base = 'kbstorm';
      }
    }
    const ext = extension || '';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');

    return `${base}-${timestamp}${ext}`;
  }
}

// 导出便捷函数
export const showAlert = MessageService.showAlert;
export const showError = MessageService.showError;
export const logError = MessageService.logError;
export const showSuccess = MessageService.showSuccess;
export const generateFileName = MessageService.generateFileName;
