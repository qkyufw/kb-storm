// 本地存储相关工具
import { ICard, IConnection, IKeyBindings } from '../types';

interface IMindMapData {
  cards: ICard[];
  connections: IConnection[];
}

/**
 * 保存思维导图数据
 */
export const saveMindMapToStorage = (data: IMindMapData): void => {
  localStorage.setItem('mindmap-data', JSON.stringify(data));
};

/**
 * 加载思维导图数据
 */
export const loadMindMapFromStorage = (): IMindMapData | null => {
  const savedData = localStorage.getItem('mindmap-data');
  if (savedData) {
    try {
      return JSON.parse(savedData) as IMindMapData;
    } catch (e) {
      console.error('Failed to parse saved mind map data:', e);
      return null;
    }
  }
  return null;
};

/**
 * 保存快捷键配置
 */
export const saveKeyBindings = (keyBindings: IKeyBindings): void => {
  localStorage.setItem('mindmap-keybindings', JSON.stringify(keyBindings));
};

/**
 * 加载快捷键配置
 */
export const loadKeyBindings = (): IKeyBindings | null => {
  const savedBindings = localStorage.getItem('mindmap-keybindings');
  if (savedBindings) {
    try {
      return JSON.parse(savedBindings) as IKeyBindings;
    } catch (e) {
      console.error('Failed to parse saved key bindings:', e);
      return null;
    }
  }
  return null;
};
