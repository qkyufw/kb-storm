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
  maxTokens?: number;
  temperature?: number;
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

// 卡片扩展请求
export interface CardExpansionRequest {
  cards: Array<{
    id: string;
    content: string;
  }>;
  context?: string;
}

// 卡片整理请求
export interface CardOrganizationRequest {
  cards: Array<{
    id: string;
    content: string;
  }>;
  organizationType?: 'summarize' | 'categorize' | 'refine';
}

// AI操作结果
export interface AIOperationResult {
  success: boolean;
  data?: {
    expandedCards?: Array<{
      content: string;
      category?: string;
    }>;
    organizedCards?: Array<{
      content: string;
      category?: string;
    }>;
  };
  error?: string;
}

// AI服务状态
export interface AIServiceStatus {
  isLoading: boolean;
  currentOperation?: 'expand' | 'organize';
  progress?: number;
  error?: string;
}
