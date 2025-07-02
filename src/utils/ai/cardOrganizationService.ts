/**
 * 卡片内容整理服务
 * 将视口内的卡片内容发送给AI进行整理精简，并替换原有卡片
 */

import { ICard } from '../../types/CoreTypes';
import { AIService } from './aiService';
import { CardOrganizationRequest, AIOperationResult } from '../../types/AITypes';
import { getCardsInViewport, ViewportInfo, getViewportCenter } from './viewportUtils';
import { generateUniqueCardIdWithCheck } from '../idGenerator';
import { getRandomColor } from '../ui/colors';

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
   * @param organizationType 整理类型
   * @returns 整理操作结果
   */
  async organizeCardsInViewport(
    cards: ICard[],
    viewportInfo: ViewportInfo,
    organizationType: 'summarize' | 'categorize' | 'refine' = 'summarize'
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

      // 准备整理请求
      const request: CardOrganizationRequest = {
        cards: cardsInViewport.map(card => ({
          id: card.id,
          content: card.content
        })),
        organizationType
      };

      // 生成AI提示词
      const prompt = this.generateOrganizationPrompt(request);

      // 发送AI请求
      const aiResponse = await this.aiService.sendRequest({
        prompt,
        systemPrompt: this.getOrganizationSystemPrompt(organizationType),
        maxTokens: 2000,
        temperature: 0.3
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
  private generateOrganizationPrompt(request: CardOrganizationRequest): string {
    const cardContents = request.cards.map((card, index) => 
      `${index + 1}. ${card.content}`
    ).join('\n');

    let prompt = `请对以下卡片内容进行整理和精简：

原始卡片内容：
${cardContents}

`;

    switch (request.organizationType) {
      case 'summarize':
        prompt += `整理要求：
1. 将相似或相关的内容合并
2. 提取核心要点和关键信息
3. 去除重复和冗余内容
4. 保持信息的完整性和准确性
5. 生成3-8个精简的核心卡片`;
        break;
      
      case 'categorize':
        prompt += `整理要求：
1. 将内容按主题或类别进行分组
2. 为每个分类创建一个总结卡片
3. 确保分类逻辑清晰
4. 保持原始信息的完整性
5. 生成4-10个分类卡片`;
        break;
      
      case 'refine':
        prompt += `整理要求：
1. 优化每个卡片的表达方式
2. 使内容更加清晰和具体
3. 补充必要的细节或说明
4. 保持原有的数量和结构
5. 提升内容的可读性和实用性`;
        break;
    }

    prompt += `

请按照以下JSON格式返回整理后的内容：
{
  "organizedCards": [
    {
      "content": "整理后的内容1",
      "category": "分类名称（可选）"
    },
    {
      "content": "整理后的内容2",
      "category": "分类名称（可选）"
    }
  ]
}

要求：
1. 每个卡片内容应该简洁明了
2. 保持信息的准确性和完整性
3. 内容要有逻辑性和条理性
4. 适合在思维导图中展示`;

    return prompt;
  }

  /**
   * 获取整理系统提示词
   */
  private getOrganizationSystemPrompt(organizationType: string): string {
    const basePrompt = `你是一个专业的信息整理助手，擅长对思维导图内容进行结构化整理。`;

    switch (organizationType) {
      case 'summarize':
        return basePrompt + `你的任务是：
1. 分析和理解所有卡片内容
2. 识别核心主题和关键信息
3. 合并相似内容，去除冗余
4. 生成精简而完整的总结
5. 严格按照要求的JSON格式返回结果`;

      case 'categorize':
        return basePrompt + `你的任务是：
1. 分析卡片内容的主题和类别
2. 建立清晰的分类体系
3. 将相关内容归类整理
4. 为每个类别生成代表性内容
5. 严格按照要求的JSON格式返回结果`;

      case 'refine':
        return basePrompt + `你的任务是：
1. 优化每个卡片的表达方式
2. 提升内容的清晰度和准确性
3. 补充必要的细节和说明
4. 保持原有的逻辑结构
5. 严格按照要求的JSON格式返回结果`;

      default:
        return basePrompt + `请按照用户要求整理卡片内容，并严格按照JSON格式返回结果。`;
    }
  }

  /**
   * 解析AI响应内容
   */
  private parseOrganizationResponse(content: string): Array<{ content: string; category?: string }> {
    try {
      // 尝试提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('未找到有效的JSON响应');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.organizedCards || !Array.isArray(parsed.organizedCards)) {
        throw new Error('响应格式不正确');
      }

      return parsed.organizedCards.filter((card: any) => 
        card && typeof card.content === 'string' && card.content.trim()
      );

    } catch (error) {
      console.warn('解析AI响应失败，尝试简单分割:', error);
      
      // 备用解析方法：按行分割
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('{') && !line.startsWith('}') && !line.includes('"organizedCards"'));

      return lines.map(line => ({
        content: line.replace(/^\d+\.\s*/, '').replace(/^[-*]\s*/, ''),
        category: undefined
      })).filter(item => item.content.length > 0);
    }
  }

  /**
   * 将整理结果转换为卡片对象
   * @param organizedCards 整理后的卡片数据
   * @param viewportInfo 视口信息
   * @param originalCards 原始卡片（用于参考位置）
   * @returns 新的卡片对象数组
   */
  generateOrganizedCards(
    organizedCards: Array<{ content: string; category?: string }>,
    viewportInfo: ViewportInfo,
    originalCards: ICard[]
  ): ICard[] {
    const newCards: ICard[] = [];
    const viewportCenter = getViewportCenter(viewportInfo);
    
    // 卡片基础尺寸
    const cardWidth = 160;
    const cardHeight = 80;
    const spacing = 30;
    
    // 如果原始卡片数量较少，尝试使用原始位置
    if (organizedCards.length <= originalCards.length && originalCards.length <= 5) {
      organizedCards.forEach((cardData, index) => {
        const originalCard = originalCards[index];
        const position = originalCard ?
          { x: originalCard.x, y: originalCard.y } :
          {
            x: viewportCenter.x + (index % 3) * (cardWidth + spacing) - cardWidth,
            y: viewportCenter.y + Math.floor(index / 3) * (cardHeight + spacing) - cardHeight
          };

        // 生成唯一ID，确保不与现有卡片重复
        const existingIds = newCards.map(card => card.id);
        const cardId = generateUniqueCardIdWithCheck(existingIds);

        const newCard: ICard = {
          id: cardId,
          content: cardData.content,
          x: position.x,
          y: position.y,
          width: cardWidth,
          height: cardHeight,
          color: getRandomColor()
        };

        newCards.push(newCard);
      });
    } else {
      // 使用网格布局
      const cols = Math.ceil(Math.sqrt(organizedCards.length));
      const rows = Math.ceil(organizedCards.length / cols);
      
      const totalWidth = cols * cardWidth + (cols - 1) * spacing;
      const totalHeight = rows * cardHeight + (rows - 1) * spacing;
      const startX = viewportCenter.x - totalWidth / 2;
      const startY = viewportCenter.y - totalHeight / 2;

      organizedCards.forEach((cardData, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        const x = startX + col * (cardWidth + spacing);
        const y = startY + row * (cardHeight + spacing);

        // 生成唯一ID，确保不与现有卡片重复
        const existingIds = newCards.map(card => card.id);
        const cardId = generateUniqueCardIdWithCheck(existingIds);

        const newCard: ICard = {
          id: cardId,
          content: cardData.content,
          x,
          y,
          width: cardWidth,
          height: cardHeight,
          color: getRandomColor()
        };

        newCards.push(newCard);
      });
    }

    return newCards;
  }

  /**
   * 获取要删除的原始卡片ID列表
   * @param cards 所有卡片数组
   * @param viewportInfo 视口信息
   * @returns 要删除的卡片ID数组
   */
  getCardsToDelete(cards: ICard[], viewportInfo: ViewportInfo): string[] {
    const cardsInViewport = getCardsInViewport(cards, viewportInfo);
    return cardsInViewport.map(card => card.id);
  }
}
