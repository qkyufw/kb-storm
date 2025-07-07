/**
 * 逻辑整理服务
 * 将视口内容导出为Mermaid，发送给AI进行逻辑整理，然后导入新的Mermaid图
 */

import { ICard, IConnection } from '../../types/CoreTypes';
import { AIService } from './aiService';
import { AIOperationResult } from '../../types/AITypes';
import { ViewportInfo, exportViewportToMermaid } from './viewportUtils';

/**
 * 逻辑整理服务类
 */
export class LogicOrganizationService {
  private aiService: AIService;

  constructor(aiService: AIService) {
    this.aiService = aiService;
  }

  /**
   * 对视口内容进行逻辑整理
   * @param cards 所有卡片数组
   * @param connections 所有连接线数组
   * @param viewportInfo 视口信息
   * @param customDescription 用户自定义描述
   * @param temperature 温度设置
   * @returns 整理操作结果
   */
  async organizeLogicInViewport(
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
      const prompt = this.generateLogicOrganizationPrompt(mermaidCode, customDescription);

      // 发送AI请求
      const aiResponse = await this.aiService.sendRequest({
        prompt,
        systemPrompt: this.getLogicOrganizationSystemPrompt(),
        maxTokens: 3000, // 逻辑整理使用较多令牌以生成完整的Mermaid图
        temperature: temperature || 0.4 // 逻辑整理使用中低温度保持逻辑性
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
          mermaidCode: aiResponse.content
        }
      };

    } catch (error) {
      console.error('逻辑整理失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  }

  /**
   * 生成逻辑整理提示词
   */
  private generateLogicOrganizationPrompt(
    mermaidCode: string,
    customDescription?: string
  ): string {
    // 使用自定义描述或默认描述
    const baseDescription = customDescription || '请对以下思维导图进行逻辑整理，优化结构和连接关系';

    const prompt = `${baseDescription}：

原始Mermaid图：
${mermaidCode}

整理要求：
1. 分析节点之间的逻辑关系和层次结构
2. 重新组织节点的连接关系，使逻辑更清晰
3. 优化节点的排列顺序，突出主要流程和分支
4. 保持所有原始信息的完整性和准确性
5. 确保生成的Mermaid图语法正确且可渲染
6. 可以调整连接线的方向和类型以更好地表达逻辑关系

请直接返回整理后的Mermaid代码，不需要额外的解释或说明。确保代码以"graph"开头，格式正确。`;

    return prompt;
  }

  /**
   * 获取逻辑整理系统提示词
   */
  private getLogicOrganizationSystemPrompt(): string {
    return `你是一个专业的逻辑分析和图表整理专家，擅长分析思维导图的结构并进行逻辑优化。你的任务是：
1. 理解Mermaid思维导图中节点的含义和关系
2. 分析节点之间的逻辑层次和依赖关系
3. 重新组织图表结构，使逻辑流程更加清晰
4. 优化连接关系，突出主要路径和分支逻辑
5. 确保生成的Mermaid代码语法正确且可以正常渲染
6. 保持原始信息的完整性，不添加或删除重要内容

请始终返回有效的Mermaid代码，格式为：
graph LR
  节点定义和连接关系...`;
  }
}
