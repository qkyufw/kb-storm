/**
 * 卡片内容整理服务
 * 将视口内的卡片内容发送给AI进行整理精简，并替换原有卡片
 */

import { ICard } from '../../types/CoreTypes';
import { AIService } from './aiService';
import { AIOperationResult, AIRole, AIOutputStyle } from '../../types/AITypes';
import { getCardsInViewport, ViewportInfo, getViewportCenter } from './viewportUtils';
import { generateUniqueCardIdWithCheck } from '../idGenerator';
import { getRandomColor } from '../ui/colors';
import { calculateOptimalCardSize, DEFAULT_CARD_SIZE_CONFIG } from '../cardSizeUtils';

/**
 * 卡片整理服务类
 */
export class CardOrganizationService {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  /**
   * 整理视口内的卡片内容
   * @param cards 所有卡片数组
   * @param viewportInfo 视口信息
   * @param customDescription 用户自定义描述
   * @param temperature 温度设置
   * @param role AI角色设定
   * @param outputStyle 输出风格设定
   * @returns 整理操作结果
   */
  async organizeCardsInViewport(
    cards: ICard[],
    viewportInfo: ViewportInfo,
    customDescription?: string,
    temperature?: number,
    role?: AIRole,
    outputStyle?: AIOutputStyle
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

      // 生成AI提示词
      const prompt = this.generateOrganizationPrompt(
        cardsInViewport.map(card => card.content),
        customDescription
      );

      // 发送AI请求
      const aiResponse = await this.aiService.sendRequest({
        prompt,
        systemPrompt: this.getOrganizationSystemPrompt(),
        maxTokens: 2000, // 整理精简使用适中令牌
        temperature: temperature || 0.3, // 整理精简使用更低温度
        role, // 传递角色设定
        outputStyle // 传递输出风格
      });

      if (!aiResponse.success || !aiResponse.content) {
        return {
          success: false,
          error: aiResponse.error || 'AI响应为空'
        };
      }

      // 解析AI响应并生成整理后的卡片数据
      const organizedCards = this.parseOrganizationResponse(aiResponse.content);

      return {
        success: true,
        data: {
          organizedCards
        }
      };

    } catch (error) {
      console.error('卡片整理失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 生成整理提示词
   */
  private generateOrganizationPrompt(
    cardContents: string[],
    customDescription?: string
  ): string {
    const contents = cardContents.join('\n');

    // 使用自定义描述或默认描述
    const baseDescription = customDescription || '请对以下卡片内容进行整理和精简';

    const prompt = `${baseDescription}：

原始卡片内容：
${contents}

整理要求：
1. 将相似或相关的内容合并
2. 提取核心要点和关键信息
3. 去除重复和冗余内容
4. 保持信息的完整性和准确性
5. 生成3-8个精简的核心卡片

请直接返回整理后的卡片内容，每个卡片内容之间必须用"---"分隔：

卡片内容1

---

卡片内容2

---

卡片内容3

要求：
1. 每个卡片内容应该简洁明了
2. 保持信息的准确性和完整性
3. 内容要有逻辑性和条理性
4. 适合在思维导图中展示
5. 不要包含任何JSON格式或其他标记，只返回纯文本内容`;

    return prompt;
  }

  /**
   * 获取整理系统提示词
   */
  private getOrganizationSystemPrompt(): string {
    return `你是一个专业的信息整理助手，擅长对思维导图内容进行结构化整理。你的任务是：
1. 分析和理解所有卡片内容
2. 识别核心主题和关键信息
3. 合并相似内容，去除冗余
4. 生成精简而完整的总结
5. 直接返回卡片内容，每个卡片之间必须用"---"分隔`;
  }

  /**
   * 解析AI响应内容
   */
  private parseOrganizationResponse(content: string): string[] {
    try {
      // 清理内容，移除可能的markdown代码块标记
      let cleanContent = content
        .replace(/```[\s\S]*?```/g, '') // 移除代码块
        .replace(/```/g, '') // 移除单独的代码块标记
        .trim();

      // 按 "---" 分隔符分割内容
      const contentBlocks = cleanContent
        .split(/\n\s*---\s*\n/)
        .map(block => block.trim())
        .filter(block => block.length > 0);

      // 如果没有找到分隔符，尝试其他分割方式
      if (contentBlocks.length <= 1) {
        // 尝试按双换行分割
        const paragraphs = cleanContent
          .split(/\n\n+/)
          .map(p => p.trim())
          .filter(p => p.length > 0);

        if (paragraphs.length > 1) {
          return paragraphs.map(content =>
            content.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '')
          );
        }

        // 尝试按编号分割
        const numberedItems = cleanContent
          .split(/\n\d+\.\s*/)
          .map(item => item.trim())
          .filter(item => item.length > 0);

        if (numberedItems.length > 1) {
          return numberedItems.map(content =>
            content.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '')
          );
        }

        // 如果都没有，返回整个内容作为一个卡片
        if (cleanContent.length > 0) {
          return [cleanContent];
        }

        return [];
      }

      return contentBlocks.map(content =>
        content.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, '')
      );

    } catch (error) {
      console.warn('解析AI响应失败:', error);

      // 最后的备用方法：按行分割
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('```') && line.length > 0);

      return lines
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''))
        .filter(content => content.length > 0);
    }
  }

  /**
   * 将整理结果转换为卡片对象
   * @param organizedCards 整理后的卡片内容数组
   * @param viewportInfo 视口信息
   * @returns 新的卡片对象数组
   */
  generateOrganizedCards(
    organizedCards: string[],
    viewportInfo: ViewportInfo
  ): ICard[] {
    const newCards: ICard[] = [];
    const viewportCenter = getViewportCenter(viewportInfo);

    // 卡片基础尺寸
    const baseCardWidth = 160;
    const baseCardHeight = 80;
    const spacing = 30;

    // 为每个卡片计算合适的尺寸
    const cardsWithSizes = organizedCards.map(content => {
      const { width, height } = calculateOptimalCardSize(content, {
        ...DEFAULT_CARD_SIZE_CONFIG,
        baseWidth: baseCardWidth,
        baseHeight: baseCardHeight
      });
      return { content, width, height };
    });
    
    // 使用简单的网格布局
    const cols = Math.ceil(Math.sqrt(cardsWithSizes.length));
    const avgWidth = cardsWithSizes.reduce((sum, card) => sum + card.width, 0) / cardsWithSizes.length;
    const avgHeight = cardsWithSizes.reduce((sum, card) => sum + card.height, 0) / cardsWithSizes.length;
    const totalWidth = cols * avgWidth + (cols - 1) * spacing;
    const totalHeight = Math.ceil(cardsWithSizes.length / cols) * avgHeight + (Math.ceil(cardsWithSizes.length / cols) - 1) * spacing;
    const startX = viewportCenter.x - totalWidth / 2;
    const startY = viewportCenter.y - totalHeight / 2;

    cardsWithSizes.forEach((cardData, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      const x = startX + col * (avgWidth + spacing);
      const y = startY + row * (avgHeight + spacing);

      const newCard: ICard = {
        id: generateUniqueCardIdWithCheck([]),
        content: cardData.content,
        x,
        y,
        width: cardData.width,
        height: cardData.height,
        color: getRandomColor()
      };

      newCards.push(newCard);
    });

    return newCards;
  }

}
