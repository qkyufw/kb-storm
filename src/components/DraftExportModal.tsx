import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIStore } from '../store/aiStore';
import { useCardStore } from '../store/cardStore';
import { useConnectionStore } from '../store/connectionStore';
import { useUIStore } from '../store/UIStore';
import { useAIConfigStore } from '../store/aiConfigStore';
import { DraftExportService } from '../utils/ai/draftExportService';
import { getDefaultAIService } from '../utils/ai/aiService';
import { AIRole, AIOutputStyle } from '../types/AITypes';
import '../styles/modals/DraftExportModal.css';

interface DraftExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DraftExportModal: React.FC<DraftExportModalProps> = ({
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();
  const ai = useAIStore();
  const cards = useCardStore();
  const connections = useConnectionStore();
  const ui = useUIStore();

  // 全局AI配置状态
  const {
    globalRole,
    globalOutputStyle,
    setGlobalRole,
    setGlobalOutputStyle,
    clearGlobalRole,
    clearGlobalOutputStyle
  } = useAIConfigStore();
  
  const [draftContent, setDraftContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // 配置状态
  const [customDescription, setCustomDescription] = useState('');
  const [temperature, setTemperature] = useState(0.7);

  // 折叠状态管理
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const saved = localStorage.getItem('draft-config-collapsed-sections');
      return saved ? JSON.parse(saved) : {
        roleConfig: true,    // 默认折叠
        outputStyleConfig: true  // 默认折叠
      };
    } catch {
      return {
        roleConfig: true,
        outputStyleConfig: true
      };
    }
  });

  // 获取默认配置
  const defaultConfig = React.useMemo(() => ai.config?.functionConfig?.draft || {
    defaultDescription: '请基于以下卡片内容生成一份结构化的草稿文章',
    temperature: 0.7,
    maxTokens: 4000,
    openConfigBeforeExecution: false
  }, [ai.config?.functionConfig?.draft]);

  // 初始化配置
  React.useEffect(() => {
    if (isOpen) {
      setCustomDescription(defaultConfig.defaultDescription);
      setTemperature(defaultConfig.temperature);
      setDraftContent('');
      setError('');
    }
  }, [isOpen, defaultConfig]);

  // 生成草稿
  const handleGenerateDraft = async () => {
    if (!ai.config) {
      setError(t('ai.errors.configRequired'));
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const aiService = getDefaultAIService();
      if (!aiService) {
        throw new Error(t('ai.status.serviceNotInitialized'));
      }

      const draftService = new DraftExportService(aiService);
      const result = await draftService.exportDraftFromViewport(
        cards.cards,
        ui.viewportInfo,
        customDescription || defaultConfig.defaultDescription,
        temperature,
        globalRole,
        globalOutputStyle
      );

      if (!result.success) {
        throw new Error(result.error || t('ai.functions.draft.error'));
      }

      setDraftContent(result.data?.draftContent || '');
    } catch (error) {
      console.error('生成草稿失败:', error);
      setError(error instanceof Error ? error.message : t('ai.errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 生成逻辑草稿
  const handleGenerateLogicDraft = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { LogicDraftService } = await import('../utils/ai/logicDraftService');

      const aiService = getDefaultAIService();
      if (!aiService) {
        throw new Error(t('ai.status.serviceNotInitialized'));
      }

      const logicDraftService = new LogicDraftService(aiService);
      const result = await logicDraftService.generateLogicDraftFromViewport(
        cards.cards,
        connections.connections,
        ui.viewportInfo,
        customDescription || defaultConfig.defaultDescription,
        temperature
      );

      if (!result.success) {
        throw new Error(result.error || t('ai.functions.draft.error'));
      }

      setDraftContent(result.data?.draftContent || '');
    } catch (error) {
      console.error('生成逻辑草稿失败:', error);
      setError(error instanceof Error ? error.message : t('ai.errors.unknownError'));
    } finally {
      setIsLoading(false);
    }
  };

  // 切换折叠状态
  const toggleCollapse = (section: 'roleConfig' | 'outputStyleConfig') => {
    const newState = {
      ...collapsedSections,
      [section]: !collapsedSections[section]
    };
    setCollapsedSections(newState);
    localStorage.setItem('draft-config-collapsed-sections', JSON.stringify(newState));
  };

  // 处理全局角色配置变化
  const handleGlobalRoleConfigChange = (field: keyof AIRole, value: string | string[]) => {
    const newRole: AIRole = {
      name: globalRole?.name || '',
      description: globalRole?.description || '',
      personality: globalRole?.personality || '',
      expertise: globalRole?.expertise || [],
      ...globalRole,
      [field]: field === 'expertise' && typeof value === 'string'
        ? value.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : value
    };
    setGlobalRole(newRole);
  };

  // 处理全局输出风格配置变化
  const handleGlobalOutputStyleChange = (field: keyof AIOutputStyle, value: string) => {
    if (!value) {
      // 如果值为空，清除整个配置
      setGlobalOutputStyle(undefined);
      return;
    }

    const newStyle: AIOutputStyle = {
      ...globalOutputStyle,
      [field]: value
    } as AIOutputStyle;
    setGlobalOutputStyle(newStyle);
  };

  // 清除全局角色配置
  const clearGlobalRoleConfig = () => {
    clearGlobalRole();
  };

  // 清除全局输出风格配置
  const clearGlobalOutputStyleConfig = () => {
    clearGlobalOutputStyle();
  };

  // 导出为Markdown文件
  const handleExportMarkdown = () => {
    if (!draftContent) return;

    const blob = new Blob([draftContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `draft-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 复制到剪贴板
  const handleCopyToClipboard = async () => {
    if (!draftContent) return;

    try {
      await navigator.clipboard.writeText(draftContent);
      // 这里可以添加成功提示
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-config-modal-overlay" onClick={onClose}>
      <div
        className="ai-config-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: '900px',
          maxWidth: '95vw',
          maxHeight: '85vh'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px 16px',
          borderBottom: '1px solid #e1e5e9'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#1a1a1a' }}>
            {t('ai.functions.draft.title')}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#666',
              cursor: 'pointer',
              padding: 0,
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* 配置区域 */}
          <div style={{
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 600,
              color: '#1a1a1a'
            }}>
              {t('ai.functionConfig.basicSettings')}
            </h3>
            
            {/* 任务描述 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: 500,
                color: '#333',
                fontSize: '14px'
              }}>
                {t('ai.functionConfig.taskDescription')}
              </label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder={t('ai.functionConfig.draftDescriptionPlaceholder')}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  minHeight: '80px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* 温度设置 */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontWeight: 500,
                color: '#333',
                fontSize: '14px'
              }}>
                {t('ai.functionConfig.temperature')}
                <span style={{ fontWeight: 'normal', color: '#666', marginLeft: '8px' }}>
                  ({temperature})
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={{ width: '100%', margin: '8px 0' }}
              />
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#666',
                marginTop: '4px'
              }}>
                <span>{t('ai.functionConfig.temperatureConservative')}</span>
                <span>{t('ai.functionConfig.temperatureCreative')}</span>
              </div>
            </div>

            {/* AI角色设定 */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  padding: '8px 0',
                  borderBottom: '1px solid #e9ecef'
                }}
                onClick={() => toggleCollapse('roleConfig')}
              >
                <span style={{ fontWeight: 500, color: '#333', fontSize: '14px' }}>
                  {t('ai.functionConfig.role.title')}
                  <span style={{ fontWeight: 'normal', color: '#666', fontStyle: 'italic', marginLeft: '8px' }}>
                    {t('ai.functionConfig.role.optional')}
                  </span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {globalRole && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearGlobalRoleConfig();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '2px 6px',
                        borderRadius: '3px'
                      }}
                      title={t('ai.functionConfig.role.clear')}
                    >
                      ✕
                    </button>
                  )}
                  <span style={{
                    fontSize: '12px',
                    transform: collapsedSections.roleConfig ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}>
                    ▼
                  </span>
                </div>
              </div>

              {!collapsedSections.roleConfig && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder={t('ai.functionConfig.role.namePlaceholder')}
                    value={globalRole?.name || ''}
                    onChange={(e) => handleGlobalRoleConfigChange('name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <textarea
                    placeholder={t('ai.functionConfig.role.descriptionPlaceholder')}
                    value={globalRole?.description || ''}
                    onChange={(e) => handleGlobalRoleConfigChange('description', e.target.value)}
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="text"
                    placeholder={t('ai.functionConfig.role.personalityPlaceholder')}
                    value={globalRole?.personality || ''}
                    onChange={(e) => handleGlobalRoleConfigChange('personality', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <input
                    type="text"
                    placeholder={t('ai.functionConfig.role.expertisePlaceholder')}
                    value={globalRole?.expertise?.join(', ') || ''}
                    onChange={(e) => handleGlobalRoleConfigChange('expertise', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <small style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {t('ai.functionConfig.role.hint')}
                  </small>
                </div>
              )}
            </div>

            {/* 输出风格配置 */}
            <div style={{ marginBottom: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  padding: '8px 0',
                  borderBottom: '1px solid #e9ecef'
                }}
                onClick={() => toggleCollapse('outputStyleConfig')}
              >
                <span style={{ fontWeight: 500, color: '#333', fontSize: '14px' }}>
                  {t('ai.functionConfig.outputStyle.title')}
                  <span style={{ fontWeight: 'normal', color: '#666', fontStyle: 'italic', marginLeft: '8px' }}>
                    {t('ai.functionConfig.outputStyle.optional')}
                  </span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {globalOutputStyle && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearGlobalOutputStyleConfig();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '2px 6px',
                        borderRadius: '3px'
                      }}
                      title={t('ai.functionConfig.outputStyle.clear')}
                    >
                      ✕
                    </button>
                  )}
                  <span style={{
                    fontSize: '12px',
                    transform: collapsedSections.outputStyleConfig ? 'rotate(-90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}>
                    ▼
                  </span>
                </div>
              </div>

              {!collapsedSections.outputStyleConfig && (
                <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#555', marginBottom: '4px', display: 'block' }}>
                      {t('ai.functionConfig.outputStyle.tone')}
                    </label>
                    <input
                      type="text"
                      list="draft-tone-presets"
                      placeholder={t('ai.functionConfig.outputStyle.toneCustomPlaceholder')}
                      value={globalOutputStyle?.tone || ''}
                      onChange={(e) => handleGlobalOutputStyleChange('tone', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        backgroundColor: 'white',
                        boxSizing: 'border-box'
                      }}
                    />
                    <datalist id="draft-tone-presets">
                      <option value={t('ai.functionConfig.outputStyle.tones.formal')} />
                      <option value={t('ai.functionConfig.outputStyle.tones.casual')} />
                      <option value={t('ai.functionConfig.outputStyle.tones.academic')} />
                      <option value={t('ai.functionConfig.outputStyle.tones.creative')} />
                      <option value={t('ai.functionConfig.outputStyle.tones.professional')} />
                      <option value={t('ai.functionConfig.outputStyle.tones.friendly')} />
                    </datalist>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: '#555', marginBottom: '4px', display: 'block' }}>
                      {t('ai.functionConfig.outputStyle.length')}
                    </label>
                    <input
                      type="text"
                      list="draft-length-presets"
                      placeholder={t('ai.functionConfig.outputStyle.lengthCustomPlaceholder')}
                      value={globalOutputStyle?.length || ''}
                      onChange={(e) => handleGlobalOutputStyleChange('length', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '13px',
                        backgroundColor: 'white',
                        boxSizing: 'border-box'
                      }}
                    />
                    <datalist id="draft-length-presets">
                      <option value={t('ai.functionConfig.outputStyle.lengths.concise')} />
                      <option value={t('ai.functionConfig.outputStyle.lengths.detailed')} />
                      <option value={t('ai.functionConfig.outputStyle.lengths.comprehensive')} />
                      <option value={t('ai.functionConfig.outputStyle.lengths.brief')} />
                      <option value={t('ai.functionConfig.outputStyle.lengths.extensive')} />
                    </datalist>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <small style={{ fontSize: '12px', color: '#666' }}>
                      {t('ai.functionConfig.outputStyle.hint')}
                    </small>
                  </div>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={handleGenerateDraft}
                disabled={isLoading}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '36px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                {isLoading ? t('ai.functions.draft.loading') : t('ai.functions.draft.generate')}
              </button>
              <button
                onClick={handleGenerateLogicDraft}
                disabled={isLoading}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '36px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                {isLoading ? t('ai.functions.draft.loading') : t('ai.functions.draft.logicDraft')}
              </button>
            </div>
          </div>

          {/* 错误显示 */}
          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px 16px',
              borderRadius: '4px',
              border: '1px solid #f5c6cb',
              margin: '16px 0',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          {/* 草稿内容显示 */}
          {draftContent && (
            <div style={{
              marginTop: '24px',
              border: '1px solid #e9ecef',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                backgroundColor: '#f8f9fa',
                borderBottom: '1px solid #e9ecef'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#1a1a1a'
                }}>
                  {t('ai.functions.draft.result')}
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleGenerateDraft}
                    disabled={isLoading}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '32px',
                      backgroundColor: '#6c757d',
                      color: 'white',
                      opacity: isLoading ? 0.6 : 1
                    }}
                  >
                    {t('ai.functions.draft.regenerate')}
                  </button>
                  <button
                    onClick={handleCopyToClipboard}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '32px',
                      backgroundColor: '#6c757d',
                      color: 'white'
                    }}
                  >
                    {t('common.copy')}
                  </button>
                  <button
                    onClick={handleExportMarkdown}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      minHeight: '32px',
                      backgroundColor: '#007bff',
                      color: 'white'
                    }}
                  >
                    {t('ai.functions.draft.exportMarkdown')}
                  </button>
                </div>
              </div>

              <div style={{
                padding: '20px',
                backgroundColor: '#ffffff',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                <pre style={{
                  margin: 0,
                  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#333',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {draftContent}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
