import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIStore } from '../store/aiStore';
import { useCardStore } from '../store/cardStore';
import { useUIStore } from '../store/UIStore';
import { DraftExportService } from '../utils/ai/draftExportService';
import { getDefaultAIService } from '../utils/ai/aiService';
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
  const ui = useUIStore();
  
  const [draftContent, setDraftContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  
  // 配置状态
  const [customDescription, setCustomDescription] = useState('');
  const [temperature, setTemperature] = useState(0.7);

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
        temperature
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
                max="2"
                step="0.1"
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
