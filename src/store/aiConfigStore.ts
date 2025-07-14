import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIRole, AIOutputStyle } from '../types/AITypes';

// 角色配置项
interface RoleConfig {
  id: string;
  name: string;
  role: AIRole;
  outputStyle?: AIOutputStyle;
  createdAt: number;
  updatedAt: number;
}

interface AIConfigState {
  // 全局AI配置
  globalRole: AIRole | undefined;
  globalOutputStyle: AIOutputStyle | undefined;

  // 角色配置管理
  roleConfigs: RoleConfig[];
  currentRoleConfigId: string | null;

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

  // 角色配置管理方法
  addRoleConfig: (name: string, role: AIRole, outputStyle?: AIOutputStyle) => string;
  updateRoleConfig: (id: string, updates: Partial<Omit<RoleConfig, 'id' | 'createdAt'>>) => void;
  deleteRoleConfig: (id: string) => void;
  switchToRoleConfig: (id: string) => void;
  getCurrentRoleConfig: () => RoleConfig | undefined;
}

/**
 * AI配置全局状态管理
 * 用于在所有AI功能间共享角色设定和输出风格配置
 */
export const useAIConfigStore = create<AIConfigState>()(
  persist(
    (set, get) => ({
      globalRole: undefined,
      globalOutputStyle: undefined,
      roleConfigs: [],
      currentRoleConfigId: null,

      setGlobalRole: (role) => set({ globalRole: role }),

      setGlobalOutputStyle: (style) => set({ globalOutputStyle: style }),

      clearGlobalRole: () => set({ globalRole: undefined }),

      clearGlobalOutputStyle: () => set({ globalOutputStyle: undefined }),

      resetAllConfig: () => set({
        globalRole: undefined,
        globalOutputStyle: undefined,
        roleConfigs: [],
        currentRoleConfigId: null
      }),

      // 添加角色配置
      addRoleConfig: (name: string, role: AIRole, outputStyle?: AIOutputStyle) => {
        const id = `role_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const newConfig: RoleConfig = {
          id,
          name,
          role,
          outputStyle,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        set(state => ({
          roleConfigs: [...state.roleConfigs, newConfig]
        }));

        return id;
      },

      // 更新角色配置
      updateRoleConfig: (id: string, updates: Partial<Omit<RoleConfig, 'id' | 'createdAt'>>) => {
        set(state => ({
          roleConfigs: state.roleConfigs.map(config =>
            config.id === id
              ? { ...config, ...updates, updatedAt: Date.now() }
              : config
          )
        }));
      },

      // 删除角色配置
      deleteRoleConfig: (id: string) => {
        set(state => ({
          roleConfigs: state.roleConfigs.filter(config => config.id !== id),
          currentRoleConfigId: state.currentRoleConfigId === id ? null : state.currentRoleConfigId
        }));
      },

      // 切换到指定角色配置
      switchToRoleConfig: (id: string) => {
        const { roleConfigs } = get();
        const config = roleConfigs.find(c => c.id === id);
        if (config) {
          set({
            currentRoleConfigId: id,
            globalRole: config.role,
            globalOutputStyle: config.outputStyle
          });
        }
      },

      // 获取当前角色配置
      getCurrentRoleConfig: () => {
        const { roleConfigs, currentRoleConfigId } = get();
        return currentRoleConfigId ? roleConfigs.find(c => c.id === currentRoleConfigId) : undefined;
      }
    }),
    {
      name: 'ai-config-storage', // localStorage key
      version: 2, // 增加版本号以处理数据结构变化
    }
  )
);
