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

// AI角色配置
export interface AIRole {
  name: string;           // 角色名称，如"创意导师"、"逻辑分析师"
  description: string;    // 角色描述
  personality: string;    // 性格特点，如"严谨"、"创新"、"实用"
  expertise: string[];    // 专业领域，如["商业分析", "创意写作"]
}

// AI输出风格配置
export interface AIOutputStyle {
  tone: string;    // 语调，支持预设选项或自定义输入
  length: string;  // 详细程度，支持预设选项或自定义输入
}

// AI请求参数
export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  role?: AIRole;          // 角色设定
  outputStyle?: AIOutputStyle;  // 输出风格
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



// AI功能单项配置
export interface AIFunctionItemConfig {
  defaultDescription: string;
  temperature: number;
  maxTokens: number;
  openConfigBeforeExecution: boolean; // 执行前是否打开配置
  role?: AIRole;                      // 角色设定（可选）
  outputStyle?: AIOutputStyle;        // 输出风格（可选）
}

// AI功能配置
export interface AIFunctionConfig {
  // 扩展思路配置
  expansion: AIFunctionItemConfig;
  // 整理精简配置
  organization: AIFunctionItemConfig;
  // 导出草稿配置
  draft: AIFunctionItemConfig;
  // 逻辑整理配置 (Mermaid)
  logicOrganization: AIFunctionItemConfig;
  // 逻辑草稿配置 (Mermaid)
  logicDraft: AIFunctionItemConfig;
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
