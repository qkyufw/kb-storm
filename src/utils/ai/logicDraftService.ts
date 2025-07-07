/**
 * 逻辑草稿服务
 * 将视口内容导出为Mermaid，发送给AI进行逻辑分析并生成草稿
 */

import { ICard, IConnection } from '../../types/CoreTypes';
import { AIService } from './aiService';
import { AIOperationResult } from '../../types/AITypes';
import { ViewportInfo, exportViewportToMermaid } from './viewportUtils';

/**
 * 逻辑草稿服务类
 */
export class LogicDraftService {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  /**
   * 基于视口内容的逻辑结构生成草稿
   * @param cards 所有卡片数组
   * @param connections 所有连接线数组
   * @param viewportInfo 视口信息
   * @param customDescription 用户自定义描述
   * @param temperature 温度设置
   * @returns 草稿生成结果
   */
  async generateLogicDraftFromViewport(
    cards: ICard[],
    connections: IConnection[],
    viewportInfo: ViewportInfo,
    customDescription?: string,
    temperature?: number
  ): Promise<AIOperationResult> {
    try {
      // 导出视口内容为Mermaid
      const mermaidCode = exportViewportToMermaid(cards, connections, viewportInfo);

      if (!mermaidCode || mermaidCode.trim() === 'graph LR\n') {
        return {
          success: false,
          error: '当前视口范围内没有可导出的内容'
        };
      }

      // 生成AI提示词
      const prompt = this.generateLogicDraftPrompt(mermaidCode, customDescription);

      // 发送AI请求
      const aiResponse = await this.aiService.sendRequest({
        prompt,
        systemPrompt: this.getLogicDraftSystemPrompt(),
        maxTokens: 4000, // 逻辑草稿使用更多令牌以生成完整文章
        temperature: temperature || 0.7 // 逻辑草稿使用中等温度平衡逻辑性和创意性
      });

      if (!aiResponse.success || !aiResponse.content) {
        return {
          success: false,
          error: aiResponse.error || 'AI响应为空'
        };
      }

      return {
        success: true,
        data: {
          draftContent: aiResponse.content
        }
      };

    } catch (error) {
      console.error('逻辑草稿生成失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 生成逻辑草稿提示词
   */
  private generateLogicDraftPrompt(
    mermaidCode: string,
    customDescription?: string
  ): string {
    // 使用自定义描述或默认描述
    const baseDescription = customDescription || '请基于以下思维导图的逻辑结构转化为结构化的草稿文章，并确保文章逻辑清晰、表达流畅';

    const prompt = `${baseDescription}：

思维导图（Mermaid格式）：
${mermaidCode}

生成要求：
1. 分析思维导图中节点的逻辑关系和层次结构
2. 理解连接线表示的流程、依赖或关联关系
3. 按照图中的逻辑顺序组织文章结构
4. 将节点内容转化为连贯的段落和章节
5. 保持原始逻辑关系的完整性和准确性
6. 补充必要的过渡语句和逻辑连接
7. 使用Markdown格式输出，包含适当的标题层级

请直接输出完整的草稿文章，不需要额外的解释或说明。`;

    return prompt;
  }

  /**
   * 获取逻辑草稿系统提示词
   */
  private getLogicDraftSystemPrompt(): string {
    return `你是一个专业的逻辑分析和文档写作专家，擅长理解思维导图的结构并转化为结构化文章。你的任务是：
1. 深入理解Mermaid思维导图中的逻辑关系和层次结构
2. 识别图中的主要流程、分支逻辑和关键节点
3. 按照图表的逻辑顺序组织文章内容
4. 将图形化的信息转化为连贯的文字表达
5. 保持原始逻辑关系的准确性和完整性
6. 生成结构清晰、逻辑严密的草稿文章
7. 使用适当的Markdown格式进行排版

请始终基于思维导图的逻辑结构来组织文章，确保文章的逻辑性和可读性。`;
  }
}
