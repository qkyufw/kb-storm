/**
 * AI服务相关的类型定义
 */

// AI提供商类型
export type AIProvider = 'openai' | 'deepseek' | 'anthropic' | 'custom';

// AI配置接口
export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseUrl?: string;
  model?: string;
  // 功能配置
  functionConfig?: AIFunctionConfig;
}

// AI请求参数
export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

// AI响应接口
export interface AIResponse {
  success: boolean;
  content?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}



// AI功能配置
export interface AIFunctionConfig {
  // 扩展思路配置
  expansion: {
    defaultDescription: string;
    temperature: number;
    maxTokens: number;
    openConfigBeforeExecution: boolean; // 执行前是否打开配置
  };
  // 整理精简配置
  organization: {
    defaultDescription: string;
    temperature: number;
    maxTokens: number;
    openConfigBeforeExecution: boolean; // 执行前是否打开配置
  };
  // 导出草稿配置
  draft: {
    defaultDescription: string;
    temperature: number;
    maxTokens: number;
    openConfigBeforeExecution: boolean; // 执行前是否打开配置
  };
  // 逻辑整理配置 (Mermaid)
  logicOrganization: {
    defaultDescription: string;
    temperature: number;
    maxTokens: number;
    openConfigBeforeExecution: boolean; // 执行前是否打开配置
  };
  // 逻辑草稿配置 (Mermaid)
  logicDraft: {
    defaultDescription: string;
    temperature: number;
    maxTokens: number;
    openConfigBeforeExecution: boolean; // 执行前是否打开配置
  };
}



// AI操作结果
export interface AIOperationResult {
  success: boolean;
  data?: {
    expandedCards?: string[];
    organizedCards?: string[];
    draftContent?: string;
    mermaidCode?: string; // 用于逻辑整理功能
  };
  error?: string;
}

// AI服务状态
export interface AIServiceStatus {
  isLoading: boolean;
  currentOperation?: 'expand' | 'organize' | 'logicOrganize' | 'logicDraft';
  progress?: number;
  error?: string;
}
