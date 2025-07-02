/**
 * AI配置模态框组件
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIStore } from '../store/aiStore';
import { AIConfig, AIProvider } from '../types/AITypes';
import '../styles/modals/AIConfigModal.css';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { config, setConfig, clearConfig } = useAIStore();
  
  const [formData, setFormData] = useState<AIConfig>({
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: '',
    maxTokens: 2000,
    temperature: 0.7
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // 当模态框打开时，初始化表单数据
  useEffect(() => {
    if (isOpen && config) {
      setFormData(config);
    }
  }, [isOpen, config]);

  // 提供商选项
  const providerOptions: { value: AIProvider; label: string; defaultModel: string; defaultBaseUrl?: string }[] = [
    { value: 'openai', label: t('ai.config.providers.openai'), defaultModel: 'gpt-3.5-turbo', defaultBaseUrl: 'https://api.openai.com/v1' },
    { value: 'deepseek', label: t('ai.config.providers.deepseek'), defaultModel: 'deepseek-chat', defaultBaseUrl: 'https://api.deepseek.com/v1' },
    { value: 'anthropic', label: t('ai.config.providers.anthropic'), defaultModel: 'claude-3-sonnet-20240229', defaultBaseUrl: 'https://api.anthropic.com/v1' },
    { value: 'custom', label: t('ai.config.providers.custom'), defaultModel: '', defaultBaseUrl: '' }
  ];

  // 常见自定义API预设
  const customPresets = [
    { name: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1', model: 'deepseek-ai/deepseek-chat' },
    { name: 'Moonshot', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' },
    { name: 'Zhipu AI', baseUrl: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4' },
    { name: 'Baichuan', baseUrl: 'https://api.baichuan-ai.com/v1', model: 'Baichuan2-Turbo' }
  ];

  // 处理提供商变更
  const handleProviderChange = (provider: AIProvider) => {
    const option = providerOptions.find(opt => opt.value === provider);
    if (option) {
      setFormData(prev => ({
        ...prev,
        provider,
        model: option.defaultModel,
        baseUrl: option.defaultBaseUrl || ''
      }));
    }
  };

  // 处理表单字段变更
  const handleFieldChange = (field: keyof AIConfig, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // 验证表单
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.provider) {
      newErrors.provider = t('ai.config.errors.providerRequired');
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = t('ai.config.errors.apiKeyRequired');
    }

    if (formData.provider === 'custom' && !formData.baseUrl?.trim()) {
      newErrors.baseUrl = t('ai.config.errors.baseUrlRequired');
    }

    if (formData.maxTokens && (formData.maxTokens < 100 || formData.maxTokens > 8000)) {
      newErrors.maxTokens = t('ai.config.errors.maxTokensRange');
    }

    if (formData.temperature && (formData.temperature < 0 || formData.temperature > 2)) {
      newErrors.temperature = t('ai.config.errors.temperatureRange');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 测试连接
  const testConnection = async () => {
    if (!validateForm()) return;

    setIsTestingConnection(true);
    try {
      // 创建临时AI服务实例进行测试
      const { AIService } = await import('../utils/ai/aiService');
      const testService = new AIService(formData);

      // 发送简单的测试请求
      const response = await testService.sendRequest({
        prompt: '你好，这是一个连接测试。请简单回复"连接成功"。',
        systemPrompt: '你是一个AI助手，请简洁回复。',
        maxTokens: 50,
        temperature: 0.1
      });

      if (response.success && response.content) {
        alert(t('ai.config.messages.testSuccess') + '\n响应: ' + response.content.substring(0, 100));
      } else {
        throw new Error(response.error || '测试失败');
      }
    } catch (error) {
      console.error('连接测试失败:', error);
      alert(t('ai.config.messages.testFailed') + '：' + (error instanceof Error ? error.message : t('ai.errors.unknownError')));
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 保存配置
  const handleSave = () => {
    if (!validateForm()) return;

    setConfig(formData);
    onClose();
  };

  // 清除配置
  const handleClear = () => {
    if (window.confirm(t('ai.config.messages.clearConfirm'))) {
      clearConfig();
      setFormData({
        provider: 'openai',
        apiKey: '',
        baseUrl: '',
        model: '',
        maxTokens: 2000,
        temperature: 0.7
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ai-config-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('ai.config.title')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="config-form">
            {/* AI提供商选择 */}
            <div className="form-group">
              <label>{t('ai.config.provider')}</label>
              <select
                value={formData.provider}
                onChange={e => handleProviderChange(e.target.value as AIProvider)}
                className={errors.provider ? 'error' : ''}
              >
                {providerOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.provider && <span className="error-text">{errors.provider}</span>}
            </div>

            {/* API密钥 */}
            <div className="form-group">
              <label>{t('ai.config.apiKey')}</label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={e => handleFieldChange('apiKey', e.target.value)}
                placeholder={t('ai.config.placeholders.apiKey')}
                className={errors.apiKey ? 'error' : ''}
              />
              {errors.apiKey && <span className="error-text">{errors.apiKey}</span>}
            </div>

            {/* 基础URL（自定义API时必填） */}
            {(formData.provider === 'custom' || formData.baseUrl) && (
              <div className="form-group">
                <label>{t('ai.config.baseUrl')}</label>
                <input
                  type="url"
                  value={formData.baseUrl || ''}
                  onChange={e => handleFieldChange('baseUrl', e.target.value)}
                  placeholder={t('ai.config.placeholders.baseUrl')}
                  className={errors.baseUrl ? 'error' : ''}
                />
                {formData.provider === 'custom' && (
                  <div className="form-help">
                    <div className="custom-presets">
                      <small>常用预设:</small>
                      <div className="preset-buttons">
                        {customPresets.map(preset => (
                          <button
                            key={preset.name}
                            type="button"
                            className="preset-btn"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                baseUrl: preset.baseUrl,
                                model: preset.model
                              }));
                            }}
                          >
                            {preset.name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <small>
                      示例: https://api.siliconflow.cn/v1 或 https://api.example.com/v1/chat/completions
                      <br />
                      如果不包含具体端点，系统会自动添加 /chat/completions
                    </small>
                  </div>
                )}
                {errors.baseUrl && <span className="error-text">{errors.baseUrl}</span>}
              </div>
            )}

            {/* 模型名称 */}
            <div className="form-group">
              <label>{t('ai.config.model')}</label>
              <input
                type="text"
                value={formData.model || ''}
                onChange={e => handleFieldChange('model', e.target.value)}
                placeholder={t('ai.config.placeholders.model')}
              />
            </div>

            {/* 高级设置 */}
            <details className="advanced-settings">
              <summary>{t('ai.config.advancedSettings')}</summary>

              <div className="form-group">
                <label>{t('ai.config.maxTokens')}</label>
                <input
                  type="number"
                  value={formData.maxTokens || 2000}
                  onChange={e => handleFieldChange('maxTokens', parseInt(e.target.value))}
                  min="100"
                  max="8000"
                  className={errors.maxTokens ? 'error' : ''}
                />
                {errors.maxTokens && <span className="error-text">{errors.maxTokens}</span>}
              </div>

              <div className="form-group">
                <label>{t('ai.config.temperature')} (0-2)</label>
                <input
                  type="number"
                  value={formData.temperature || 0.7}
                  onChange={e => handleFieldChange('temperature', parseFloat(e.target.value))}
                  min="0"
                  max="2"
                  step="0.1"
                  className={errors.temperature ? 'error' : ''}
                />
                {errors.temperature && <span className="error-text">{errors.temperature}</span>}
              </div>
            </details>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            <button
              className="btn btn-secondary"
              onClick={testConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? t('common.loading') : t('ai.config.testConnection')}
            </button>
            <button className="btn btn-danger" onClick={handleClear}>
              {t('ai.config.clearConfig')}
            </button>
          </div>
          <div className="footer-right">
            <button className="btn btn-secondary" onClick={onClose}>
              {t('ai.config.cancel')}
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              {t('ai.config.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConfigModal;
