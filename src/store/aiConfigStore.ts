import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIRole, AIOutputStyle } from '../types/AITypes';

interface AIConfigState {
  // 全局AI配置
  globalRole: AIRole | undefined;
  globalOutputStyle: AIOutputStyle | undefined;
  
  // 设置全局角色
  setGlobalRole: (role: AIRole | undefined) => void;
  
  // 设置全局输出风格
  setGlobalOutputStyle: (style: AIOutputStyle | undefined) => void;
  
  // 清除全局角色
  clearGlobalRole: () => void;
  
  // 清除全局输出风格
  clearGlobalOutputStyle: () => void;
  
  // 重置所有配置
  resetAllConfig: () => void;
}

/**
 * AI配置全局状态管理
 * 用于在所有AI功能间共享角色设定和输出风格配置
 */
export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set) => ({
      globalRole: undefined,
      globalOutputStyle: undefined,
      
      setGlobalRole: (role) => set({ globalRole: role }),
      
      setGlobalOutputStyle: (style) => set({ globalOutputStyle: style }),
      
      clearGlobalRole: () => set({ globalRole: undefined }),
      
      clearGlobalOutputStyle: () => set({ globalOutputStyle: undefined }),
      
      resetAllConfig: () => set({ 
        globalRole: undefined, 
        globalOutputStyle: undefined 
      }),
    }),
    {
      name: 'ai-config-storage', // localStorage key
      version: 1,
    }
  )
);
