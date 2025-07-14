/**
 * AI配置模态框组件
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIStore } from '../store/aiStore';
import { useCardStore } from '../store/cardStore';
import { useUIStore } from '../store/UIStore';
import { useHistoryStore } from '../store/historyStore';
import { useConnectionStore } from '../store/connectionStore';
import { useAIConfigStore } from '../store/aiConfigStore';
import { AIConfig, AIProvider, AIFunctionConfig } from '../types/AITypes';
import '../styles/modals/AIConfigModal.css';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIConfigModal: React.FC<AIConfigModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    config,
    setConfig,
    clearConfig,
    expandCards,
    organizeCards,
    logicOrganizeCards,
    status,
    configModalDefaultTab,
    setShowSettingsModal,
    apiConfigs,
    currentApiConfigId,
    addApiConfig,
    updateApiConfig,
    deleteApiConfig,
    switchToApiConfig,
    getCurrentApiConfig
  } = useAIStore();
  const cards = useCardStore();
  const connections = useConnectionStore();
  const ui = useUIStore();
  const history = useHistoryStore();

  // 全局AI配置状态
  const {
    globalRole,
    globalOutputStyle
  } = useAIConfigStore();
  
  const [formData, setFormData] = useState<AIConfig>({
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'connection' | 'expansion' | 'organization'>('connection');

  // API配置管理状态
  const [isSavingApiConfig, setIsSavingApiConfig] = useState(false);
  const [saveApiConfigName, setSaveApiConfigName] = useState('');
  const [showSavedConfigs, setShowSavedConfigs] = useState(false);
  const [configSearchTerm, setConfigSearchTerm] = useState('');
  const [showAllConfigs, setShowAllConfigs] = useState(false);



  // 默认功能配置
  const defaultFunctionConfig: AIFunctionConfig = React.useMemo(() => ({
    expansion: {
      defaultDescription: '请基于现有内容进行创意扩展，生成相关的新想法和子主题',
      temperature: 0.8,
      maxTokens: 3000,
      openConfigBeforeExecution: true
    },
    organization: {
      defaultDescription: '请对内容进行整理和精简，提取核心要点',
      temperature: 0.3,
      maxTokens: 2000,
      openConfigBeforeExecution: true
    },
    draft: {
      defaultDescription: '请基于以下卡片内容生成一份结构化的草稿文章',
      temperature: 0.7,
      maxTokens: 4000,
      openConfigBeforeExecution: true
    },
    logicOrganization: {
      defaultDescription: '请对以下思维导图进行逻辑整理，优化结构和连接关系',
      temperature: 0.4,
      maxTokens: 3000,
      openConfigBeforeExecution: true
    },
    logicDraft: {
      defaultDescription: '请基于以下思维导图的逻辑结构生成一份结构化的草稿文章',
      temperature: 0.7,
      maxTokens: 4000,
      openConfigBeforeExecution: true
    }
  }), []);

  const [functionConfig, setFunctionConfig] = useState<AIFunctionConfig>(defaultFunctionConfig);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // 当模态框打开时，初始化表单数据
  useEffect(() => {
    if (isOpen && config) {
      setFormData(config);
      // 确保functionConfig包含所有必要的配置，包括draft
      const mergedFunctionConfig = {
        expansion: config.functionConfig?.expansion || defaultFunctionConfig.expansion,
        organization: config.functionConfig?.organization || defaultFunctionConfig.organization,
        draft: config.functionConfig?.draft || defaultFunctionConfig.draft,
        logicOrganization: config.functionConfig?.logicOrganization || defaultFunctionConfig.logicOrganization,
        logicDraft: config.functionConfig?.logicDraft || defaultFunctionConfig.logicDraft
      };
      setFunctionConfig(mergedFunctionConfig);
      // 根据默认标签页设置活动标签
      if (configModalDefaultTab && configModalDefaultTab !== 'draft') {
        setActiveTab(configModalDefaultTab);
      }
    }
  }, [isOpen, config, configModalDefaultTab, defaultFunctionConfig]);

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

  // 处理功能配置字段变化
  const handleFunctionConfigChange = (
    functionType: 'expansion' | 'organization' | 'logicOrganization' | 'logicDraft',
    field: string,
    value: string | number | boolean
  ) => {
    setFunctionConfig(prev => ({
      ...prev,
      [functionType]: {
        ...prev[functionType],
        [field]: value
      }
    }));
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

    setConfig({
      ...formData,
      functionConfig
    });
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
        model: ''
      });
      setFunctionConfig(defaultFunctionConfig);
    }
  };

  // 重置功能配置
  const handleResetFunctionConfig = (functionType: 'expansion' | 'organization' | 'logicOrganization' | 'logicDraft') => {
    if (window.confirm(t('ai.functionConfig.messages.resetConfirm'))) {
      setFunctionConfig(prev => ({
        ...prev,
        [functionType]: defaultFunctionConfig[functionType]
      }));
    }
  };

  // 打开AI设定模态框
  const handleOpenSettings = () => {
    setShowSettingsModal(true);
  };

  // 校验是否有有效的API配置
  const hasValidApiConfig = () => {
    return formData.provider && formData.apiKey.trim();
  };

  // 校验是否可以保存API配置
  const canSaveApiConfig = () => {
    // 检查配置名称
    if (!saveApiConfigName.trim()) {
      return false;
    }

    // 检查配置名称是否已存在
    const nameExists = apiConfigs.some(config =>
      config.name.toLowerCase() === saveApiConfigName.trim().toLowerCase()
    );
    if (nameExists) {
      return false;
    }

    // 检查是否有有效配置
    return hasValidApiConfig();
  };

  // 保存当前API配置
  const handleSaveApiConfig = () => {
    const trimmedName = saveApiConfigName.trim();

    // 校验配置名称
    if (!trimmedName) {
      alert(t('ai.config.nameRequired'));
      return;
    }

    // 检查名称长度
    if (trimmedName.length > 50) {
      alert(t('ai.config.nameTooLong'));
      return;
    }

    // 检查名称是否已存在
    const nameExists = apiConfigs.some(config =>
      config.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      alert(t('ai.config.nameExists'));
      return;
    }

    // 校验是否有有效配置
    if (!hasValidApiConfig()) {
      alert(t('ai.config.noValidConfig'));
      return;
    }

    addApiConfig(trimmedName, formData);

    // 重置表单
    setSaveApiConfigName('');
    setIsSavingApiConfig(false);
  };

  // 取消保存API配置
  const handleCancelSaveApiConfig = () => {
    setIsSavingApiConfig(false);
    setSaveApiConfigName('');
  };

  // 删除API配置
  const handleDeleteApiConfig = (id: string) => {
    const config = apiConfigs.find(c => c.id === id);
    if (config && window.confirm(t('ai.config.deleteConfirm', { name: config.name }))) {
      deleteApiConfig(id);
    }
  };

  // 切换API配置
  const handleSwitchApiConfig = (id: string) => {
    const config = apiConfigs.find(c => c.id === id);
    if (config) {
      switchToApiConfig(id);
      setFormData(config.config);
    }
  };

  // 过滤配置列表
  const filteredApiConfigs = apiConfigs.filter(config => {
    if (!configSearchTerm.trim()) return true;
    const searchLower = configSearchTerm.toLowerCase();
    return (
      config.name.toLowerCase().includes(searchLower) ||
      config.config.provider.toLowerCase().includes(searchLower) ||
      (config.config.model && config.config.model.toLowerCase().includes(searchLower))
    );
  });

  // 显示的配置列表（限制数量）
  const MAX_VISIBLE_CONFIGS = 5;
  const displayedConfigs = configSearchTerm || showAllConfigs
    ? filteredApiConfigs
    : filteredApiConfigs.slice(0, MAX_VISIBLE_CONFIGS);
  const hasMoreConfigs = !configSearchTerm && !showAllConfigs && filteredApiConfigs.length > MAX_VISIBLE_CONFIGS;

  // 立即执行扩展思路
  const handleImmediateExpansion = async () => {
    // 先保存当前配置
    setConfig({
      ...formData,
      functionConfig
    });

    try {
      // 在AI操作前保存历史记录
      history.addToHistory(true);

      const expansionConfig = functionConfig.expansion;
      const newCards = await expandCards(
        cards.cards,
        ui.viewportInfo,
        expansionConfig.defaultDescription,
        expansionConfig.temperature,
        globalRole,
        globalOutputStyle
      );

      // 添加新卡片到画布
      cards.addCards(newCards);

      // 关闭配置模态框
      onClose();
    } catch (error) {
      console.error('立即扩展失败:', error);
    }
  };

  // 立即执行整理精简
  const handleImmediateOrganization = async () => {
    // 先保存当前配置
    setConfig({
      ...formData,
      functionConfig
    });

    try {
      // 在AI操作前保存历史记录
      history.addToHistory(true);

      const organizationConfig = functionConfig.organization;
      const result = await organizeCards(
        cards.cards,
        ui.viewportInfo,
        organizationConfig.defaultDescription,
        organizationConfig.temperature,
        globalRole,
        globalOutputStyle
      );

      // 删除原有卡片
      cards.deleteCards(result.cardsToDelete);
      // 添加新卡片
      cards.addCards(result.newCards);

      // 关闭配置模态框
      onClose();
    } catch (error) {
      console.error('立即整理失败:', error);
    }
  };

  // 立即执行逻辑整理
  const handleImmediateLogicOrganization = async () => {
    // 先保存当前配置
    setConfig({
      ...formData,
      functionConfig
    });

    try {
      // 在AI操作前保存历史记录
      history.addToHistory(true);

      const logicOrganizationConfig = functionConfig.logicOrganization;

      // 使用AI store的方法执行逻辑整理
      const result = await logicOrganizeCards(
        cards.cards,
        connections.connections,
        ui.viewportInfo,
        logicOrganizationConfig.defaultDescription,
        logicOrganizationConfig.temperature
      );

      // 删除视口内的所有卡片和连接线
      const { getCardsInViewport, getConnectionsInViewport } = await import('../utils/ai/viewportUtils');
      const cardsInViewport = getCardsInViewport(cards.cards, ui.viewportInfo);
      const connectionsInViewport = getConnectionsInViewport(connections.connections, cards.cards, ui.viewportInfo);

      // 删除卡片和连接线
      cards.deleteCards(cardsInViewport.map(card => card.id));
      connections.handleConnectionsDelete({
        connectionIds: connectionsInViewport.map(conn => conn.id)
      });

      // 导入新的Mermaid图
      if (result.mermaidCode) {
        const { importFromMermaid } = await import('../utils/storageUtils');
        const importResult = await importFromMermaid(result.mermaidCode);
        if (importResult) {
          cards.addCards(importResult.cards);
          connections.setConnectionsData([...connections.connections, ...importResult.connections]);
        }
      }

      // 关闭配置模态框
      onClose();
    } catch (error) {
      console.error('立即逻辑整理失败:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-config-modal-overlay" onClick={onClose}>
      <div className="modal-content ai-config-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('ai.config.title')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* 标签页导航 */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'connection' ? 'active' : ''}`}
            onClick={() => setActiveTab('connection')}
          >
            {t('ai.config.tabs.connection')}
          </button>
          <button
            className={`tab-button ${activeTab === 'expansion' ? 'active' : ''}`}
            onClick={() => setActiveTab('expansion')}
          >
            {t('ai.config.tabs.expansion')}
          </button>
          <button
            className={`tab-button ${activeTab === 'organization' ? 'active' : ''}`}
            onClick={() => setActiveTab('organization')}
          >
            {t('ai.config.tabs.organization')}
          </button>
        </div>

        <div className="modal-body">
          {/* 连接配置标签页 */}
          {activeTab === 'connection' && (
            <div className="config-form">
              {/* 当前API配置显示 */}
              {currentApiConfigId && getCurrentApiConfig() && (
                <div className="current-api-config-info">
                  <h3>{t('ai.config.currentApiConfig')}</h3>
                  <p className="config-name">{getCurrentApiConfig()?.name}</p>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      // 清除当前API配置关联，但保留表单数据
                      useAIStore.setState({ currentApiConfigId: null });
                    }}
                  >
                    {t('ai.config.clearCurrent')}
                  </button>
                </div>
              )}

              {/* API配置列表 */}
              {apiConfigs.length > 0 && (
                <div className="api-configs-section">
                  <div
                    className="api-configs-header"
                    onClick={() => setShowSavedConfigs(!showSavedConfigs)}
                  >
                    <h3>
                      {t('ai.config.savedConfigs')} ({apiConfigs.length})
                      <span className={`collapse-icon ${showSavedConfigs ? 'expanded' : 'collapsed'}`}>
                        ▼
                      </span>
                    </h3>
                  </div>

                  {showSavedConfigs && (
                    <div className="api-configs-content">
                      {/* 搜索框 */}
                      {apiConfigs.length > 3 && (
                        <div className="config-search">
                          <input
                            type="text"
                            placeholder={t('ai.config.searchConfigs')}
                            value={configSearchTerm}
                            onChange={(e) => setConfigSearchTerm(e.target.value)}
                            className="search-input"
                          />
                        </div>
                      )}

                      {/* 配置列表 */}
                      <div className="api-configs-list">
                        {filteredApiConfigs.length === 0 ? (
                          <div className="no-results">
                            {configSearchTerm ? t('ai.config.noSearchResults') : t('ai.config.noConfigs')}
                          </div>
                        ) : (
                          <>
                            {displayedConfigs.map(config => (
                              <div
                                key={config.id}
                                className={`api-config-item ${currentApiConfigId === config.id ? 'active' : ''}`}
                              >
                                <div className="api-config-info">
                                  <h4>{config.name}</h4>
                                  <p className="provider-info">{config.config.provider} - {config.config.model || t('ai.config.defaultModel')}</p>
                                </div>
                                <div className="api-config-actions">
                                  <button
                                    className={`btn btn-sm ${currentApiConfigId === config.id ? 'btn-success' : 'btn-primary'}`}
                                    onClick={() => handleSwitchApiConfig(config.id)}
                                    disabled={currentApiConfigId === config.id}
                                  >
                                    {currentApiConfigId === config.id ? t('ai.config.current') : t('ai.config.use')}
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDeleteApiConfig(config.id)}
                                  >
                                    {t('common.delete')}
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* 显示更多按钮 */}
                            {hasMoreConfigs && (
                              <div className="show-more-section">
                                <button
                                  className="btn btn-link show-more-btn"
                                  onClick={() => setShowAllConfigs(true)}
                                >
                                  {t('ai.config.showMore', { count: filteredApiConfigs.length - MAX_VISIBLE_CONFIGS })}
                                </button>
                              </div>
                            )}

                            {/* 显示较少按钮 */}
                            {showAllConfigs && filteredApiConfigs.length > MAX_VISIBLE_CONFIGS && (
                              <div className="show-more-section">
                                <button
                                  className="btn btn-link show-more-btn"
                                  onClick={() => setShowAllConfigs(false)}
                                >
                                  {t('ai.config.showLess')}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

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


            </div>
          )}

          {/* 扩展思路配置标签页 */}
          {activeTab === 'expansion' && (
            <div className="function-config-form">
              <h3>{t('ai.functionConfig.expansionTitle')}</h3>

              {/* 任务描述 */}
              <div className="form-group">
                <label>
                  {t('ai.functionConfig.taskDescription')}
                  <button
                    type="button"
                    className="reset-description-btn"
                    onClick={() => handleFunctionConfigChange('expansion', 'defaultDescription', defaultFunctionConfig.expansion.defaultDescription)}
                    title={t('ai.functionConfig.resetDescription')}
                  >
                    {t('ai.functionConfig.resetToDefault')}
                  </button>
                </label>
                <textarea
                  value={functionConfig.expansion.defaultDescription}
                  onChange={(e) => handleFunctionConfigChange('expansion', 'defaultDescription', e.target.value)}
                  placeholder={t('ai.functionConfig.expansionDescriptionPlaceholder')}
                  rows={3}
                />
                <small className="form-hint">
                  {t('ai.functionConfig.taskDescriptionHint')}
                </small>
              </div>

              {/* 温度设置 */}
              <div className="form-group">
                <label>
                  {t('ai.functionConfig.temperature')}
                  <span className="temperature-value">({functionConfig.expansion.temperature})</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={functionConfig.expansion.temperature}
                  onChange={(e) => handleFunctionConfigChange('expansion', 'temperature', parseFloat(e.target.value))}
                  className="temperature-slider"
                />
                <div className="temperature-labels">
                  <span>{t('ai.functionConfig.temperatureConservative')}</span>
                  <span>{t('ai.functionConfig.temperatureCreative')}</span>
                </div>
                <small className="form-hint">
                  {t('ai.functionConfig.expansionTemperatureHint')}
                </small>
              </div>

              {/* 最大令牌数 */}
              <div className="form-group">
                <label>{t('ai.functionConfig.maxTokens')}</label>
                <input
                  type="number"
                  min="500"
                  max="8000"
                  step="100"
                  value={functionConfig.expansion.maxTokens}
                  onChange={(e) => handleFunctionConfigChange('expansion', 'maxTokens', parseInt(e.target.value))}
                />
                <small className="form-hint">
                  {t('ai.functionConfig.maxTokensHint')}
                </small>
              </div>

              {/* 执行前打开配置选项 */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={functionConfig.expansion.openConfigBeforeExecution}
                    onChange={(e) => handleFunctionConfigChange('expansion', 'openConfigBeforeExecution', e.target.checked)}
                  />
                  {t('ai.functionConfig.openConfigBeforeExecution')}
                </label>
                <small className="form-hint">
                  {t('ai.functionConfig.openConfigBeforeExecutionHint')}
                </small>
              </div>

              <div className="function-action-buttons">
                <button
                  className="btn btn-secondary reset-function-btn"
                  onClick={() => handleResetFunctionConfig('expansion')}
                >
                  {t('ai.functionConfig.resetFunction')}
                </button>
                <button
                  className="btn btn-primary immediate-action-btn"
                  onClick={handleImmediateExpansion}
                  disabled={status.isLoading}
                >
                  {status.isLoading ? t('common.loading') : t('ai.functionConfig.immediateExpansion')}
                </button>
              </div>
            </div>
          )}

          {/* 整理精简配置标签页 */}
          {activeTab === 'organization' && (
            <div className="function-config-form">
              <h3>{t('ai.functionConfig.organizationTitle')}</h3>

              {/* 任务描述 */}
              <div className="form-group">
                <label>
                  {t('ai.functionConfig.taskDescription')}
                  <button
                    type="button"
                    className="reset-description-btn"
                    onClick={() => handleFunctionConfigChange('organization', 'defaultDescription', defaultFunctionConfig.organization.defaultDescription)}
                    title={t('ai.functionConfig.resetDescription')}
                  >
                    {t('ai.functionConfig.resetToDefault')}
                  </button>
                </label>
                <textarea
                  value={functionConfig.organization.defaultDescription}
                  onChange={(e) => handleFunctionConfigChange('organization', 'defaultDescription', e.target.value)}
                  placeholder={t('ai.functionConfig.organizationDescriptionPlaceholder')}
                  rows={3}
                />
                <small className="form-hint">
                  {t('ai.functionConfig.taskDescriptionHint')}
                </small>
              </div>

              {/* 温度设置 */}
              <div className="form-group">
                <label>
                  {t('ai.functionConfig.temperature')}
                  <span className="temperature-value">({functionConfig.organization.temperature})</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={functionConfig.organization.temperature}
                  onChange={(e) => handleFunctionConfigChange('organization', 'temperature', parseFloat(e.target.value))}
                  className="temperature-slider"
                />
                <div className="temperature-labels">
                  <span>{t('ai.functionConfig.temperatureConservative')}</span>
                  <span>{t('ai.functionConfig.temperatureCreative')}</span>
                </div>
                <small className="form-hint">
                  {t('ai.functionConfig.organizationTemperatureHint')}
                </small>
              </div>

              {/* 最大令牌数 */}
              <div className="form-group">
                <label>{t('ai.functionConfig.maxTokens')}</label>
                <input
                  type="number"
                  min="500"
                  max="8000"
                  step="100"
                  value={functionConfig.organization.maxTokens}
                  onChange={(e) => handleFunctionConfigChange('organization', 'maxTokens', parseInt(e.target.value))}
                />
                <small className="form-hint">
                  {t('ai.functionConfig.maxTokensHint')}
                </small>
              </div>

              {/* 执行前打开配置选项 */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={functionConfig.organization.openConfigBeforeExecution}
                    onChange={(e) => handleFunctionConfigChange('organization', 'openConfigBeforeExecution', e.target.checked)}
                  />
                  {t('ai.functionConfig.openConfigBeforeExecution')}
                </label>
                <small className="form-hint">
                  {t('ai.functionConfig.openConfigBeforeExecutionHint')}
                </small>
              </div>

              <div className="function-action-buttons">
                <button
                  className="btn btn-secondary reset-function-btn"
                  onClick={() => handleResetFunctionConfig('organization')}
                >
                  {t('ai.functionConfig.resetFunction')}
                </button>
                <button
                  className="btn btn-primary immediate-action-btn"
                  onClick={handleImmediateOrganization}
                  disabled={status.isLoading}
                >
                  {status.isLoading ? t('common.loading') : t('ai.functionConfig.immediateOrganization')}
                </button>
                <button
                  className="btn btn-primary immediate-action-btn"
                  onClick={handleImmediateLogicOrganization}
                  disabled={status.isLoading}
                >
                  {status.isLoading ? t('common.loading') : t('ai.functions.logicOrganization.button')}
                </button>
              </div>
            </div>
          )}


        </div>

        {/* 保存API配置表单 */}
        {isSavingApiConfig && (
          <div className="save-api-config-form-footer">
            <h4>{t('ai.config.saveCurrentAsNew')}</h4>
            <div className="form-group">
              <label>{t('ai.config.configName')}</label>
              <input
                type="text"
                placeholder={t('ai.config.configNamePlaceholder')}
                value={saveApiConfigName}
                onChange={(e) => setSaveApiConfigName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}

        <div className="modal-footer">
          <div className="footer-left">
            <button
              className="btn btn-secondary"
              onClick={testConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? t('common.loading') : t('ai.config.testConnection')}
            </button>
            <button className="btn btn-secondary" onClick={handleOpenSettings}>
              {t('ai.settings.title')}
            </button>
            <button className="btn btn-danger" onClick={handleClear}>
              {t('ai.config.clearConfig')}
            </button>
          </div>
          <div className="footer-center">
            {/* 保存API配置为新配置按钮 */}
            {activeTab === 'connection' && !isSavingApiConfig && hasValidApiConfig() && (
              <button
                className="btn btn-primary"
                onClick={() => setIsSavingApiConfig(true)}
              >
                {t('ai.config.saveAsNew')}
              </button>
            )}
            {/* 保存API配置操作按钮 */}
            {isSavingApiConfig && (
              <div className="save-actions">
                <button className="btn btn-secondary" onClick={handleCancelSaveApiConfig}>
                  {t('common.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveApiConfig}
                  disabled={!canSaveApiConfig()}
                >
                  {t('common.save')}
                </button>
              </div>
            )}
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
