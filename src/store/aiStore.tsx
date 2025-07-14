/**
 * AI功能状态管理
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AIConfig, AIServiceStatus, AIRole, AIOutputStyle } from '../types/AITypes';
import { setDefaultAIService, getDefaultAIService } from '../utils/ai/aiService';
import { CardExpansionService } from '../utils/ai/cardExpansionService';
import { CardOrganizationService } from '../utils/ai/cardOrganizationService';
import { ICard, IConnection } from '../types/CoreTypes';
import { getCardsInViewport, ViewportInfo } from '../utils/ai/viewportUtils';

// API配置项
interface APIConfig {
  id: string;
  name: string;
  config: AIConfig;
  createdAt: number;
  updatedAt: number;
}

interface AIState {
  // AI配置
  config: AIConfig | null;
  isConfigured: boolean;

  // API配置管理
  apiConfigs: APIConfig[];
  currentApiConfigId: string | null;

  // 服务状态
  status: AIServiceStatus;

  // 模态框状态
  showConfigModal: boolean;
  configModalDefaultTab?: 'connection' | 'expansion' | 'organization' | 'draft';
  showDraftModal: boolean;
  showSettingsModal: boolean;
  
  // 操作方法
  setConfig: (config: AIConfig) => void;
  updateConfig: (updates: Partial<AIConfig>) => void;
  clearConfig: () => void;
  setShowConfigModal: (show: boolean, defaultTab?: 'connection' | 'expansion' | 'organization' | 'draft') => void;
  setShowDraftModal: (show: boolean) => void;
  setShowSettingsModal: (show: boolean) => void;

  // API配置管理方法
  addApiConfig: (name: string, config: AIConfig) => string;
  updateApiConfig: (id: string, updates: Partial<Omit<APIConfig, 'id' | 'createdAt'>>) => void;
  deleteApiConfig: (id: string) => void;
  switchToApiConfig: (id: string) => void;
  getCurrentApiConfig: () => APIConfig | undefined;
  
  // AI操作方法
  expandCards: (cards: ICard[], viewportInfo: ViewportInfo, customDescription?: string, temperature?: number, role?: AIRole, outputStyle?: AIOutputStyle) => Promise<ICard[]>;
  organizeCards: (cards: ICard[], viewportInfo: ViewportInfo, customDescription?: string, temperature?: number, role?: AIRole, outputStyle?: AIOutputStyle) => Promise<{ newCards: ICard[]; cardsToDelete: string[] }>;
  logicOrganizeCards: (cards: ICard[], connections: IConnection[], viewportInfo: ViewportInfo, customDescription?: string, temperature?: number, role?: AIRole, outputStyle?: AIOutputStyle) => Promise<{ mermaidCode: string }>;
  generateLogicDraft: (cards: ICard[], connections: IConnection[], viewportInfo: ViewportInfo, customDescription?: string, temperature?: number, role?: AIRole, outputStyle?: AIOutputStyle) => Promise<{ draftContent: string }>;
  
  // 状态管理
  setStatus: (status: Partial<AIServiceStatus>) => void;
  resetStatus: () => void;
}

// 从本地存储加载配置
const loadConfigFromStorage = (): AIConfig | null => {
  try {
    const stored = localStorage.getItem('ai-config');
    if (stored) {
      const config = JSON.parse(stored);
      // 验证配置格式
      if (config.provider && config.apiKey) {
        return config;
      }
    }
  } catch (error) {
    console.warn('加载AI配置失败:', error);
  }
  return null;
};

// 保存配置到本地存储
const saveConfigToStorage = (config: AIConfig | null): void => {
  try {
    if (config) {
      localStorage.setItem('ai-config', JSON.stringify(config));
    } else {
      localStorage.removeItem('ai-config');
    }
  } catch (error) {
    console.warn('保存AI配置失败:', error);
  }
};

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => {
      // 初始化时加载配置
      const initialConfig = loadConfigFromStorage();

      // 如果有配置，初始化AI服务
      if (initialConfig) {
        setDefaultAIService(initialConfig);
      }

      return {
        // 初始状态
        config: initialConfig,
        isConfigured: !!initialConfig,
        apiConfigs: [],
        currentApiConfigId: null,
        status: {
          isLoading: false,
          currentOperation: undefined,
          progress: undefined,
          error: undefined
        },
        showConfigModal: false,
        configModalDefaultTab: undefined,
        showDraftModal: false,
        showSettingsModal: false,

    // 设置配置
    setConfig: (config: AIConfig) => {
      // 保存到本地存储
      saveConfigToStorage(config);
      
      // 初始化AI服务
      setDefaultAIService(config);
      
      set({
        config,
        isConfigured: true,
        showConfigModal: false
      });
    },

    // 更新配置
    updateConfig: (updates: Partial<AIConfig>) => {
      const { config } = get();
      if (!config) return;

      const newConfig = { ...config, ...updates };
      
      // 保存到本地存储
      saveConfigToStorage(newConfig);
      
      // 更新AI服务
      const aiService = getDefaultAIService();
      if (aiService) {
        aiService.updateConfig(updates);
      }
      
      set({ config: newConfig });
    },

    // 清除配置
    clearConfig: () => {
      saveConfigToStorage(null);
      set({
        config: null,
        isConfigured: false,
        showConfigModal: false
      });
    },

    // 设置模态框显示状态
    setShowConfigModal: (show: boolean, defaultTab?: 'connection' | 'expansion' | 'organization' | 'draft') => {
      set({
        showConfigModal: show,
        configModalDefaultTab: show ? defaultTab : undefined
      });
    },

    // 设置导出草稿模态框显示状态
    setShowDraftModal: (show: boolean) => {
      set({
        showDraftModal: show
      });
    },

    // 设置AI设定模态框显示状态
    setShowSettingsModal: (show: boolean) => {
      set({
        showSettingsModal: show
      });
    },

    // 添加API配置
    addApiConfig: (name: string, config: AIConfig) => {
      const id = `api_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const newConfig: APIConfig = {
        id,
        name,
        config,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      set(state => ({
        apiConfigs: [...state.apiConfigs, newConfig]
      }));

      return id;
    },

    // 更新API配置
    updateApiConfig: (id: string, updates: Partial<Omit<APIConfig, 'id' | 'createdAt'>>) => {
      set(state => ({
        apiConfigs: state.apiConfigs.map(config =>
          config.id === id
            ? { ...config, ...updates, updatedAt: Date.now() }
            : config
        )
      }));
    },

    // 删除API配置
    deleteApiConfig: (id: string) => {
      set(state => ({
        apiConfigs: state.apiConfigs.filter(config => config.id !== id),
        currentApiConfigId: state.currentApiConfigId === id ? null : state.currentApiConfigId
      }));
    },

    // 切换到指定API配置
    switchToApiConfig: (id: string) => {
      const { apiConfigs } = get();
      const apiConfig = apiConfigs.find(c => c.id === id);
      if (apiConfig) {
        // 保存到本地存储
        saveConfigToStorage(apiConfig.config);

        // 初始化AI服务
        setDefaultAIService(apiConfig.config);

        set({
          currentApiConfigId: id,
          config: apiConfig.config,
          isConfigured: true
        });
      }
    },

    // 获取当前API配置
    getCurrentApiConfig: () => {
      const { apiConfigs, currentApiConfigId } = get();
      return currentApiConfigId ? apiConfigs.find(c => c.id === currentApiConfigId) : undefined;
    },

    // 扩展卡片
    expandCards: async (cards: ICard[], viewportInfo: ViewportInfo, customDescription?: string, temperature?: number, role?: AIRole, outputStyle?: AIOutputStyle): Promise<ICard[]> => {
      const { config } = get();
      
      if (!config) {
        set({
          status: {
            isLoading: false,
            error: '请先配置AI服务'
          }
        });
        throw new Error('请先配置AI服务');
      }

      // 设置加载状态
      set({
        status: {
          isLoading: true,
          currentOperation: 'expand',
          progress: 0,
          error: undefined
        }
      });

      try {
        const aiService = getDefaultAIService();
        if (!aiService) {
          throw new Error('AI服务未初始化');
        }

        const expansionService = new CardExpansionService(aiService);
        
        // 更新进度
        set(state => ({
          status: { ...state.status, progress: 30 }
        }));

        const result = await expansionService.expandCardsInViewport(cards, viewportInfo, customDescription, temperature, role, outputStyle);
        
        if (!result.success) {
          throw new Error(result.error || '扩展失败');
        }

        // 更新进度
        set(state => ({
          status: { ...state.status, progress: 70 }
        }));

        // 生成新卡片
        const newCards = expansionService.generateNewCards(
          result.data?.expandedCards || [],
          viewportInfo
        );

        // 完成
        set({
          status: {
            isLoading: false,
            currentOperation: undefined,
            progress: 100,
            error: undefined
          }
        });

        return newCards;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '扩展失败';
        set({
          status: {
            isLoading: false,
            currentOperation: undefined,
            progress: undefined,
            error: errorMessage
          }
        });
        throw error;
      }
    },

    // 整理卡片
    organizeCards: async (
      cards: ICard[],
      viewportInfo: ViewportInfo,
      customDescription?: string,
      temperature?: number,
      role?: AIRole,
      outputStyle?: AIOutputStyle
    ): Promise<{ newCards: ICard[]; cardsToDelete: string[] }> => {
      const { config } = get();
      
      if (!config) {
        set({
          status: {
            isLoading: false,
            error: '请先配置AI服务'
          }
        });
        throw new Error('请先配置AI服务');
      }

      // 设置加载状态
      set({
        status: {
          isLoading: true,
          currentOperation: 'organize',
          progress: 0,
          error: undefined
        }
      });

      try {
        const aiService = getDefaultAIService();
        if (!aiService) {
          throw new Error('AI服务未初始化');
        }

        const organizationService = new CardOrganizationService(aiService);
        
        // 获取要删除的卡片
        const cardsInViewport = getCardsInViewport(cards, viewportInfo);
        const cardsToDelete = cardsInViewport.map(card => card.id);
        
        // 更新进度
        set(state => ({
          status: { ...state.status, progress: 30 }
        }));

        const result = await organizationService.organizeCardsInViewport(cards, viewportInfo, customDescription, temperature, role, outputStyle);
        
        if (!result.success) {
          throw new Error(result.error || '整理失败');
        }

        // 更新进度
        set(state => ({
          status: { ...state.status, progress: 70 }
        }));

        // 生成新卡片
        const newCards = organizationService.generateOrganizedCards(
          result.data?.organizedCards || [],
          viewportInfo
        );

        // 完成
        set({
          status: {
            isLoading: false,
            currentOperation: undefined,
            progress: 100,
            error: undefined
          }
        });

        return { newCards, cardsToDelete };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '整理失败';
        set({
          status: {
            isLoading: false,
            currentOperation: undefined,
            progress: undefined,
            error: errorMessage
          }
        });
        throw error;
      }
    },

    // 逻辑整理卡片
    logicOrganizeCards: async (cards: ICard[], connections: IConnection[], viewportInfo: ViewportInfo, customDescription?: string, temperature?: number, role?: AIRole, outputStyle?: AIOutputStyle): Promise<{ mermaidCode: string }> => {
      const { config } = get();

      if (!config) {
        set({
          status: {
            isLoading: false,
            error: 'AI服务未配置'
          }
        });
        throw new Error('AI服务未配置');
      }

      try {
        set({
          status: {
            isLoading: true,
            currentOperation: 'logicOrganize',
            progress: 10,
            error: undefined
          }
        });

        const aiService = getDefaultAIService();
        if (!aiService) {
          throw new Error('AI服务未初始化');
        }

        const { LogicOrganizationService } = await import('../utils/ai/logicOrganizationService');
        const logicService = new LogicOrganizationService(aiService);

        const result = await logicService.organizeLogicInViewport(
          cards,
          connections,
          viewportInfo,
          customDescription,
          temperature,
          role,
          outputStyle
        );

        if (!result.success) {
          throw new Error(result.error || '逻辑整理失败');
        }

        set({
          status: {
            isLoading: false,
            currentOperation: undefined,
            progress: 100,
            error: undefined
          }
        });

        return { mermaidCode: result.data?.mermaidCode || '' };

      } catch (error) {
        set({
          status: {
            isLoading: false,
            error: error instanceof Error ? error.message : '逻辑整理失败'
          }
        });
        throw error;
      }
    },

    // 生成逻辑草稿
    generateLogicDraft: async (cards: ICard[], connections: IConnection[], viewportInfo: ViewportInfo, customDescription?: string, temperature?: number, role?: AIRole, outputStyle?: AIOutputStyle): Promise<{ draftContent: string }> => {
      const { config } = get();

      if (!config) {
        set({
          status: {
            isLoading: false,
            error: 'AI服务未配置'
          }
        });
        throw new Error('AI服务未配置');
      }

      try {
        set({
          status: {
            isLoading: true,
            currentOperation: 'logicDraft',
            progress: 10,
            error: undefined
          }
        });

        const aiService = getDefaultAIService();
        if (!aiService) {
          throw new Error('AI服务未初始化');
        }

        const { LogicDraftService } = await import('../utils/ai/logicDraftService');
        const logicDraftService = new LogicDraftService(aiService);

        const result = await logicDraftService.generateLogicDraftFromViewport(
          cards,
          connections,
          viewportInfo,
          customDescription,
          temperature,
          role,
          outputStyle
        );

        if (!result.success) {
          throw new Error(result.error || '逻辑草稿生成失败');
        }

        set({
          status: {
            isLoading: false,
            currentOperation: undefined,
            progress: 100,
            error: undefined
          }
        });

        return { draftContent: result.data?.draftContent || '' };

      } catch (error) {
        set({
          status: {
            isLoading: false,
            error: error instanceof Error ? error.message : '逻辑草稿生成失败'
          }
        });
        throw error;
      }
    },

    // 设置状态
    setStatus: (statusUpdate: Partial<AIServiceStatus>) => {
      set(state => ({
        status: { ...state.status, ...statusUpdate }
      }));
    },

    // 重置状态
    resetStatus: () => {
      set({
        status: {
          isLoading: false,
          currentOperation: undefined,
          progress: undefined,
          error: undefined
        }
      });
    }
  };
},
{
  name: 'ai-store-storage',
  version: 1,
  partialize: (state) => ({
    apiConfigs: state.apiConfigs,
    currentApiConfigId: state.currentApiConfigId
  })
}
)
);
