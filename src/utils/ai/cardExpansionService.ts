/**
 * 卡片内容扩展服务
 * 将视口内的卡片内容发送给AI进行扩展，并生成新的卡片
 */

import { ICard } from '../../types/CoreTypes';
import { AIService } from './aiService';
import { AIOperationResult, AIRole, AIOutputStyle } from '../../types/AITypes';
import { getCardsInViewport, ViewportInfo, getViewportCenter } from './viewportUtils';
import { generateUniqueCardIdWithCheck } from '../idGenerator';
import { getRandomColor } from '../ui/colors';
import { calculateOptimalCardSize, DEFAULT_CARD_SIZE_CONFIG } from '../cardSizeUtils';

/**
 * 卡片扩展服务类
 */
export class CardExpansionService {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  /**
   * 扩展视口内的卡片内容
   * @param cards 所有卡片数组
   * @param viewportInfo 视口信息
   * @param customDescription 用户自定义描述
   * @param temperature 温度设置
   * @param role AI角色设定
   * @param outputStyle 输出风格设定
   * @returns 扩展操作结果
   */
  async expandCardsInViewport(
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
      const prompt = this.generateExpansionPrompt(
        cardsInViewport.map(card => card.content),
        customDescription
      );

      // 发送AI请求
      const aiResponse = await this.aiService.sendRequest({
        prompt,
        systemPrompt: this.getExpansionSystemPrompt(),
        maxTokens: 3000, // 扩展思路使用更多令牌
        temperature: temperature || 0.8, // 扩展思路使用更高温度
        role, // 传递角色设定
        outputStyle // 传递输出风格
      });

      if (!aiResponse.success || !aiResponse.content) {
        return {
          success: false,
          error: aiResponse.error || 'AI响应为空'
        };
      }

      // 解析AI响应并生成新卡片数据
      const expandedCards = this.parseExpansionResponse(aiResponse.content);

      return {
        success: true,
        data: {
          expandedCards
        }
      };

    } catch (error) {
      console.error('卡片扩展失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 生成扩展提示词
   */
  private generateExpansionPrompt(
    cardContents: string[],
    customDescription?: string
  ): string {
    const contents = cardContents.join('\n');

    // 使用自定义描述或默认描述
    const description = customDescription ||
      '请基于以下卡片内容进行创意扩展和联想，为每个主题生成3-5个相关的新想法或子主题';

    const prompt = `${description}：

原始卡片内容：
${contents}

请直接返回扩展后的卡片内容，每个卡片内容之间必须用"---"分隔：

扩展内容1

---

扩展内容2

---

扩展内容3

要求：
1. 每个扩展内容应该简洁明了，适合放在卡片中
2. 内容要有创意和启发性
3. 可以包含具体的行动建议、相关概念或延伸思考
4. 保持与原始内容的相关性
5. 返回的内容数量在10-20个之间
6. 不要包含任何JSON格式或其他标记，只返回纯文本内容`;

    return prompt;
  }

  /**
   * 获取扩展系统提示词
   */
  private getExpansionSystemPrompt(): string {
    return `你是一个创意思维助手，擅长基于现有想法进行扩展和联想。你的任务是：
1. 理解用户提供的卡片内容
2. 进行创意扩展和深度思考
3. 生成相关的新想法、子主题或行动建议
4. 确保扩展内容具有实用性和启发性
5. 直接返回卡片内容，每个卡片之间必须用"---"分隔`;
  }

  /**
   * 解析AI响应内容
   */
  private parseExpansionResponse(content: string): string[] {
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
   * 将扩展结果转换为卡片对象
   * @param expandedCards 扩展的卡片内容数组
   * @param viewportInfo 视口信息
   * @returns 新的卡片对象数组
   */
  generateNewCards(
    expandedCards: string[],
    viewportInfo: ViewportInfo
  ): ICard[] {
    const newCards: ICard[] = [];
    const viewportCenter = getViewportCenter(viewportInfo);

    // 卡片基础尺寸 - 为AI生成内容增加默认尺寸
    const baseCardWidth = 160;
    const baseCardHeight = 80;
    const spacing = 20;

    // 为每个卡片计算合适的尺寸
    const cardsWithSizes = expandedCards.map(content => {
      const { width, height } = calculateOptimalCardSize(content, {
        ...DEFAULT_CARD_SIZE_CONFIG,
        baseWidth: baseCardWidth,
        baseHeight: baseCardHeight
      });
      return { content, width, height };
    });

    // 计算网格布局
    const cols = Math.ceil(Math.sqrt(cardsWithSizes.length));

    // 计算起始位置（视口中心偏移）- 使用平均尺寸
    const avgWidth = cardsWithSizes.reduce((sum, card) => sum + card.width, 0) / cardsWithSizes.length;
    const avgHeight = cardsWithSizes.reduce((sum, card) => sum + card.height, 0) / cardsWithSizes.length;
    const totalWidth = cols * avgWidth + (cols - 1) * spacing;
    const rows = Math.ceil(cardsWithSizes.length / cols);
    const totalHeight = rows * avgHeight + (rows - 1) * spacing;
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
