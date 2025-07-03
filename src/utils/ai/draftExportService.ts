import { ICard } from '../../types/CoreTypes';
import { AIService } from './aiService';
import { AIOperationResult, DraftExportRequest } from '../../types/AITypes';
import { getCardsInViewport, ViewportInfo } from './viewportUtils';

/**
 * 导出草稿服务
 * 负责将卡片内容转换为AI生成的草稿文章
 */
export class DraftExportService {
  constructor(private aiService: AIService) {}

  /**
   * 导出视口内的卡片内容为草稿
   * @param cards 所有卡片数组
   * @param viewportInfo 视口信息
   * @param customDescription 用户自定义描述
   * @param temperature 温度设置
   * @returns 导出操作结果
   */
  async exportDraftFromViewport(
    cards: ICard[],
    viewportInfo: ViewportInfo,
    customDescription?: string,
    temperature?: number
  ): Promise<AIOperationResult> {
    try {
      // 获取视口内的卡片
      const cardsInViewport = getCardsInViewport(cards, viewportInfo);

      if (cardsInViewport.length === 0) {
        return {
          success: false,
          error: '当前视口范围内没有卡片'
        };
      }

      // 准备导出请求
      const request: DraftExportRequest = {
        cards: cardsInViewport.map(card => ({
          id: card.id,
          content: card.content
        })),
        customDescription,
        temperature
      };

      // 生成AI提示词
      const prompt = this.generateDraftPrompt(request);

      // 发送AI请求
      const aiResponse = await this.aiService.sendRequest({
        prompt,
        systemPrompt: this.getDraftSystemPrompt(),
        maxTokens: 4000, // 导出草稿使用更多令牌以生成完整文章
        temperature: temperature || 0.7 // 导出草稿使用中等温度平衡创意和准确性
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
      console.error('导出草稿失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 生成导出草稿提示词
   */
  private generateDraftPrompt(request: DraftExportRequest): string {
    const cardContents = request.cards.map((card, index) => 
      `${index + 1}. ${card.content}`
    ).join('\n');

    // 使用自定义描述或默认描述
    const baseDescription = request.customDescription || '请基于以下卡片内容生成一份结构化的草稿文章';

    const prompt = `${baseDescription}：

卡片内容：
${cardContents}

要求：
1. 分析卡片内容的主题和逻辑关系
2. 构建清晰的文章结构（标题、段落、要点等）
3. 将卡片内容有机地整合到文章中
4. 补充必要的过渡和连接语句
5. 确保文章逻辑清晰、表达流畅
6. 保持原始信息的准确性和完整性
7. 使用Markdown格式输出，包含适当的标题层级

请直接输出完整的草稿文章，不需要额外的解释或说明。`;

    return prompt;
  }

  /**
   * 获取导出草稿系统提示词
   */
  private getDraftSystemPrompt(): string {
    return `你是一个专业的文档写作助手，擅长将零散的想法和要点整理成结构化的文章。你的任务是：
1. 理解用户提供的卡片内容和主题
2. 分析内容之间的逻辑关系和层次结构
3. 生成结构清晰、表达流畅的草稿文章
4. 使用适当的Markdown格式进行排版
5. 确保文章具有良好的可读性和逻辑性
6. 保持原始信息的准确性，不添加虚假内容`;
  }
}
