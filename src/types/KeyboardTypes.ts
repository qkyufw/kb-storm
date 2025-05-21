import { IKeyBindings } from './CoreTypes';

// 键盘处理器结果
export interface KeyHandlerResult {
  handled: boolean;  // 是否已处理
}

// 键盘事件上下文
export interface KeyboardEventContext {
  event: KeyboardEvent;
  isEditing: boolean;  // 是否正在编辑
  keyBindings: IKeyBindings;
  ctrlOrMeta: boolean; // Ctrl或Meta(Mac)键是否按下
  shiftKey: boolean;   // Shift键是否按下
  altKey: boolean;     // Alt键是否按下
  tabPressed: boolean; // Tab键是否处于按下状态
  spacePressed: boolean; // 空格键是否处于按下状态
  // 添加这些属性到上下文中
  cards: any;
  connections: any;
  ui: any;
}

// 键盘处理器接口
export interface KeyboardHandler {
  handleKeyDown(event: KeyboardEvent, context: KeyboardEventContext): KeyHandlerResult;
  handleKeyUp?(event: KeyboardEvent, context: KeyboardEventContext): KeyHandlerResult;
  priority: number; // 处理优先级，数字越小优先级越高
}
