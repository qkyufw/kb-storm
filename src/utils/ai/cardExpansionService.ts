/**
 * 卡片内容扩展服务
 * 将视口内的卡片内容发送给AI进行扩展，并生成新的卡片
 */

import { ICard } from '../../types/CoreTypes';
import { AIService } from './aiService';
import { CardExpansionRequest, AIOperationResult } from '../../types/AITypes';
import { getCardsInViewport, ViewportInfo, getViewportCenter } from './viewportUtils';
import { generateUniqueCardIdWithCheck } from '../idGenerator';
import { getRandomColor } from '../ui/colors';

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
   * @param context 额外的上下文信息
   * @returns 扩展操作结果
   */
  async expandCardsInViewport(
    cards: ICard[],
    viewportInfo: ViewportInfo,
    context?: string
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

      // 准备扩展请求
      const request: CardExpansionRequest = {
        cards: cardsInViewport.map(card => ({
          id: card.id,
          content: card.content
        })),
        context
      };

      // 生成AI提示词
      const prompt = this.generateExpansionPrompt(request);

      // 发送AI请求
      const aiResponse = await this.aiService.sendRequest({
        prompt,
        systemPrompt: this.getExpansionSystemPrompt(),
        maxTokens: 3000,
        temperature: 0.8
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
  private generateExpansionPrompt(request: CardExpansionRequest): string {
    const cardContents = request.cards.map((card, index) => 
      `${index + 1}. ${card.content}`
    ).join('\n');

    let prompt = `请基于以下卡片内容进行创意扩展和联想，为每个主题生成3-5个相关的新想法或子主题：

原始卡片内容：
${cardContents}`;

    if (request.context) {
      prompt += `\n\n额外上下文：${request.context}`;
    }

    prompt += `

请按照以下JSON格式返回扩展后的内容：
{
  "expandedCards": [
    {
      "content": "扩展后的内容1",
      "category": "相关分类（可选）"
    },
    {
      "content": "扩展后的内容2", 
      "category": "相关分类（可选）"
    }
  ]
}

要求：
1. 每个扩展内容应该简洁明了，适合放在卡片中
2. 内容要有创意和启发性
3. 可以包含具体的行动建议、相关概念或延伸思考
4. 保持与原始内容的相关性
5. 返回的内容数量在10-20个之间`;

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
5. 严格按照要求的JSON格式返回结果`;
  }

  /**
   * 解析AI响应内容
   */
  private parseExpansionResponse(content: string): Array<{ content: string; category?: string }> {
    try {
      // 尝试提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('未找到有效的JSON响应');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.expandedCards || !Array.isArray(parsed.expandedCards)) {
        throw new Error('响应格式不正确');
      }

      return parsed.expandedCards.filter((card: any) => 
        card && typeof card.content === 'string' && card.content.trim()
      );

    } catch (error) {
      console.warn('解析AI响应失败，尝试简单分割:', error);
      
      // 备用解析方法：按行分割
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('{') && !line.startsWith('}') && !line.includes('"expandedCards"'));

      return lines.map(line => ({
        content: line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''),
        category: undefined
      })).filter(item => item.content.length > 0);
    }
  }

  /**
   * 将扩展结果转换为卡片对象
   * @param expandedCards 扩展的卡片数据
   * @param viewportInfo 视口信息
   * @param existingCards 现有卡片（用于避免重叠）
   * @returns 新的卡片对象数组
   */
  generateNewCards(
    expandedCards: Array<{ content: string; category?: string }>,
    viewportInfo: ViewportInfo,
    existingCards: ICard[]
  ): ICard[] {
    const newCards: ICard[] = [];
    const viewportCenter = getViewportCenter(viewportInfo);
    
    // 卡片基础尺寸
    const cardWidth = 160;
    const cardHeight = 80;
    const spacing = 20;
    
    // 计算网格布局
    const cols = Math.ceil(Math.sqrt(expandedCards.length));
    const rows = Math.ceil(expandedCards.length / cols);
    
    // 计算起始位置（视口中心偏移）
    const totalWidth = cols * cardWidth + (cols - 1) * spacing;
    const totalHeight = rows * cardHeight + (rows - 1) * spacing;
    const startX = viewportCenter.x - totalWidth / 2;
    const startY = viewportCenter.y - totalHeight / 2;

    expandedCards.forEach((cardData, index) => {
      const row = Math.floor(index / cols);
      const col = index % cols;

      const x = startX + col * (cardWidth + spacing);
      const y = startY + row * (cardHeight + spacing);

      // 检查位置是否与现有卡片重叠，如果重叠则稍微调整位置
      let finalX = x;
      let finalY = y;
      let attempts = 0;

      while (attempts < 10) {
        const currentX = finalX;
        const currentY = finalY;
        const hasOverlap = [...existingCards, ...newCards].some(existingCard => {
          const distance = Math.sqrt(
            Math.pow(existingCard.x - currentX, 2) +
            Math.pow(existingCard.y - currentY, 2)
          );
          return distance < 100; // 最小距离
        });

        if (!hasOverlap) break;

        // 调整位置
        finalX += (Math.random() - 0.5) * 100;
        finalY += (Math.random() - 0.5) * 100;
        attempts++;
      }

      // 生成唯一ID，确保不与现有卡片重复
      const existingIds = [...existingCards, ...newCards].map(card => card.id);
      const cardId = generateUniqueCardIdWithCheck(existingIds);

      const newCard: ICard = {
        id: cardId,
        content: cardData.content,
        x: finalX,
        y: finalY,
        width: cardWidth,
        height: cardHeight,
        color: getRandomColor()
      };

      console.log('AI生成的新卡片:', newCard);
      newCards.push(newCard);
    });

    return newCards;
  }
}
