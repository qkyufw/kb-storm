/**
 * AI服务基础类
 * 支持多种AI提供商的统一接口
 */

import { AIConfig, AIRequest, AIResponse } from '../../types/AITypes';

export class AIService {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * 更新AI配置
   */
  updateConfig(config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  getConfig(): AIConfig {
    return { ...this.config };
  }

  /**
   * 验证配置是否有效
   */
  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.provider);
  }

  /**
   * 构建增强的系统提示词，包含角色和风格信息
   */
  private buildEnhancedSystemPrompt(request: AIRequest): string {
    let systemPrompt = request.systemPrompt || '';

    // 添加角色信息
    if (request.role) {
      const rolePrompt = `你现在扮演的角色是：${request.role.name}。
角色描述：${request.role.description}
性格特点：${request.role.personality}
专业领域：${request.role.expertise.join('、')}

请以这个角色的身份和专业视角来回答问题。`;

      systemPrompt = rolePrompt + (systemPrompt ? '\n\n' + systemPrompt : '');
    }

    // 添加输出风格信息
    if (request.outputStyle) {
      const stylePrompt = `输出要求：
- 语调风格：${this.getStyleDescription('tone', request.outputStyle.tone)}
- 详细程度：${this.getStyleDescription('length', request.outputStyle.length)}

请严格按照以上风格要求组织你的回答。`;

      systemPrompt = systemPrompt + (systemPrompt ? '\n\n' + stylePrompt : stylePrompt);
    }

    return systemPrompt;
  }

  /**
   * 获取风格描述
   */
  private getStyleDescription(type: string, value: string): string {
    const descriptions: Record<string, Record<string, string>> = {
      tone: {
        formal: '正式、专业的语调',
        casual: '轻松、随意的语调',
        academic: '学术、严谨的语调',
        creative: '创意、生动的语调'
      },
      length: {
        concise: '简洁明了，重点突出',
        detailed: '详细说明，提供充分信息',
        comprehensive: '全面深入，覆盖各个方面'
      }
    };

    return descriptions[type]?.[value] || value;
  }

  /**
   * 发送AI请求
   */
  async sendRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.validateConfig()) {
      return {
        success: false,
        error: 'AI配置无效，请检查API密钥和提供商设置'
      };
    }

    try {
      // 构建增强的系统提示词
      const enhancedRequest = {
        ...request,
        systemPrompt: this.buildEnhancedSystemPrompt(request)
      };

      switch (this.config.provider) {
        case 'openai':
          return await this.sendOpenAIRequest(enhancedRequest);
        case 'deepseek':
          return await this.sendDeepSeekRequest(enhancedRequest);
        case 'anthropic':
          return await this.sendAnthropicRequest(enhancedRequest);
        case 'custom':
          return await this.sendCustomRequest(enhancedRequest);
        default:
          return {
            success: false,
            error: `不支持的AI提供商: ${this.config.provider}`
          };
      }
    } catch (error) {
      console.error('AI请求失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * OpenAI API请求
   */
  private async sendOpenAIRequest(request: AIRequest): Promise<AIResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1';
    const model = this.config.model || 'gpt-3.5-turbo';

    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      content: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    };
  }

  /**
   * DeepSeek API请求
   */
  private async sendDeepSeekRequest(request: AIRequest): Promise<AIResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.deepseek.com/v1';
    const model = this.config.model || 'deepseek-chat';

    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      content: data.choices[0]?.message?.content || '',
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    };
  }

  /**
   * Anthropic API请求
   */
  private async sendAnthropicRequest(request: AIRequest): Promise<AIResponse> {
    const baseUrl = this.config.baseUrl || 'https://api.anthropic.com/v1';
    const model = this.config.model || 'claude-3-sonnet-20240229';

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: request.maxTokens || 2000,
        system: request.systemPrompt || '',
        messages: [{ role: 'user', content: request.prompt }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Anthropic API错误: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      content: data.content[0]?.text || '',
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      }
    };
  }

  /**
   * 自定义API请求
   */
  private async sendCustomRequest(request: AIRequest): Promise<AIResponse> {
    if (!this.config.baseUrl) {
      throw new Error('自定义API需要提供baseUrl');
    }

    // 尝试使用OpenAI兼容格式（大多数API都支持这种格式）
    const messages = [];
    if (request.systemPrompt) {
      messages.push({ role: 'system', content: request.systemPrompt });
    }
    messages.push({ role: 'user', content: request.prompt });

    // 构建请求URL，如果baseUrl不包含具体端点，则添加默认端点
    let apiUrl = this.config.baseUrl;
    if (!apiUrl.includes('/chat/completions') && !apiUrl.includes('/completions')) {
      // 如果URL不包含具体端点，尝试添加chat/completions
      apiUrl = apiUrl.endsWith('/') ? apiUrl + 'chat/completions' : apiUrl + '/chat/completions';
    }

    const requestBody = {
      model: this.config.model || 'gpt-3.5-turbo',
      messages,
      max_tokens: request.maxTokens || 2000,
      temperature: request.temperature || 0.7
    };

    console.log('自定义API请求:', {
      url: apiUrl,
      body: requestBody
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('自定义API错误响应:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`自定义API错误: ${response.status} - ${response.statusText}${errorText ? '\n' + errorText : ''}`);
    }

    const data = await response.json();
    console.log('自定义API响应:', data);

    // 尝试解析不同格式的响应
    let content = '';
    if (data.choices && data.choices[0]) {
      // OpenAI格式
      content = data.choices[0].message?.content || data.choices[0].text || '';
    } else if (data.content) {
      // 直接content字段
      content = data.content;
    } else if (data.response) {
      // response字段
      content = data.response;
    } else if (data.output) {
      // output字段
      content = data.output;
    } else if (typeof data === 'string') {
      // 直接返回字符串
      content = data;
    }

    return {
      success: true,
      content,
      usage: data.usage || undefined
    };
  }
}

// 默认AI服务实例
let defaultAIService: AIService | null = null;

/**
 * 获取默认AI服务实例
 */
export function getDefaultAIService(): AIService | null {
  return defaultAIService;
}

/**
 * 设置默认AI服务实例
 */
export function setDefaultAIService(config: AIConfig): AIService {
  defaultAIService = new AIService(config);
  return defaultAIService;
}

/**
 * 清除默认AI服务实例
 */
export function clearDefaultAIService(): void {
  defaultAIService = null;
}
