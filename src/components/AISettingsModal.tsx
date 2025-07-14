import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAIConfigStore } from '../store/aiConfigStore';
import { AIRole, AIOutputStyle } from '../types/AITypes';
import '../styles/modals/AIConfigModal.css';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const {
    globalRole,
    globalOutputStyle,
    setGlobalRole,
    setGlobalOutputStyle,
    clearGlobalRole,
    clearGlobalOutputStyle,
    resetAllConfig
  } = useAIConfigStore();

  // 折叠状态管理
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try {
      const saved = localStorage.getItem('ai-settings-collapsed-sections');
      return saved ? JSON.parse(saved) : {
        roleConfig: false,
        outputStyleConfig: false
      };
    } catch {
      return {
        roleConfig: false,
        outputStyleConfig: false
      };
    }
  });

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

  // 切换折叠状态
  const toggleCollapse = (section: 'roleConfig' | 'outputStyleConfig') => {
    const newState = {
      ...collapsedSections,
      [section]: !collapsedSections[section]
    };
    setCollapsedSections(newState);
    localStorage.setItem('ai-settings-collapsed-sections', JSON.stringify(newState));
  };

  // 重置所有配置
  const handleResetAll = () => {
    if (window.confirm(t('ai.settings.resetAllConfirm'))) {
      resetAllConfig();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-config-modal-overlay" onClick={onClose}>
      <div className="modal-content ai-config-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('ai.settings.title')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="config-form">
            {/* AI角色设定 - 全局配置 */}
            <div className="form-group ai-role-config">
              <label
                className="collapsible-header"
                onClick={() => toggleCollapse('roleConfig')}
              >
                <span>
                  {t('ai.functionConfig.role.title')}
                  <span className="optional-label">{t('ai.functionConfig.role.optional')}</span>
                </span>
                <div className="header-actions">
                  {globalRole && (
                    <button
                      type="button"
                      className="clear-config-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearGlobalRoleConfig();
                      }}
                      title={t('ai.functionConfig.role.clear')}
                    >
                      ✕
                    </button>
                  )}
                  <span className={`collapse-icon ${collapsedSections.roleConfig ? 'collapsed' : 'expanded'}`}>
                    ▼
                  </span>
                </div>
              </label>

              {!collapsedSections.roleConfig && (
                <div className="collapsible-content">
                  <div className="role-config-fields">
                    <div className="role-field">
                      <label className="role-field-label">{t('ai.functionConfig.role.nameLabel')}</label>
                      <input
                        type="text"
                        placeholder={t('ai.functionConfig.role.namePlaceholder')}
                        value={globalRole?.name || ''}
                        onChange={(e) => handleGlobalRoleConfigChange('name', e.target.value)}
                      />
                    </div>
                    <div className="role-field">
                      <label className="role-field-label">{t('ai.functionConfig.role.descriptionLabel')}</label>
                      <textarea
                        placeholder={t('ai.functionConfig.role.descriptionPlaceholder')}
                        value={globalRole?.description || ''}
                        onChange={(e) => handleGlobalRoleConfigChange('description', e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="role-field">
                      <label className="role-field-label">{t('ai.functionConfig.role.personalityLabel')}</label>
                      <input
                        type="text"
                        placeholder={t('ai.functionConfig.role.personalityPlaceholder')}
                        value={globalRole?.personality || ''}
                        onChange={(e) => handleGlobalRoleConfigChange('personality', e.target.value)}
                      />
                    </div>
                    <div className="role-field">
                      <label className="role-field-label">{t('ai.functionConfig.role.expertiseLabel')}</label>
                      <input
                        type="text"
                        placeholder={t('ai.functionConfig.role.expertisePlaceholder')}
                        value={globalRole?.expertise?.join(', ') || ''}
                        onChange={(e) => handleGlobalRoleConfigChange('expertise', e.target.value)}
                      />
                    </div>
                  </div>
                  <small className="form-hint">
                    {t('ai.functionConfig.role.hint')}
                  </small>
                </div>
              )}
            </div>

            {/* 输出风格配置 - 全局配置 */}
            <div className="form-group ai-output-style-config">
              <label
                className="collapsible-header"
                onClick={() => toggleCollapse('outputStyleConfig')}
              >
                <span>
                  {t('ai.functionConfig.outputStyle.title')}
                  <span className="optional-label">{t('ai.functionConfig.outputStyle.optional')}</span>
                </span>
                <div className="header-actions">
                  {globalOutputStyle && (
                    <button
                      type="button"
                      className="clear-config-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearGlobalOutputStyleConfig();
                      }}
                      title={t('ai.functionConfig.outputStyle.clear')}
                    >
                      ✕
                    </button>
                  )}
                  <span className={`collapse-icon ${collapsedSections.outputStyleConfig ? 'collapsed' : 'expanded'}`}>
                    ▼
                  </span>
                </div>
              </label>

              {!collapsedSections.outputStyleConfig && (
                <div className="collapsible-content">
                  <div className="output-style-fields">
                    <div className="style-field">
                      <label>{t('ai.functionConfig.outputStyle.tone')}</label>
                      <div className="style-input-container">
                        <input
                          type="text"
                          list="tone-presets"
                          placeholder={t('ai.functionConfig.outputStyle.toneCustomPlaceholder')}
                          value={globalOutputStyle?.tone || ''}
                          onChange={(e) => handleGlobalOutputStyleChange('tone', e.target.value)}
                        />
                        <datalist id="tone-presets">
                          <option value={t('ai.functionConfig.outputStyle.tones.formal')} />
                          <option value={t('ai.functionConfig.outputStyle.tones.casual')} />
                          <option value={t('ai.functionConfig.outputStyle.tones.academic')} />
                          <option value={t('ai.functionConfig.outputStyle.tones.creative')} />
                          <option value={t('ai.functionConfig.outputStyle.tones.professional')} />
                          <option value={t('ai.functionConfig.outputStyle.tones.friendly')} />
                        </datalist>
                      </div>
                    </div>
                    <div className="style-field">
                      <label>{t('ai.functionConfig.outputStyle.length')}</label>
                      <div className="style-input-container">
                        <input
                          type="text"
                          list="length-presets"
                          placeholder={t('ai.functionConfig.outputStyle.lengthCustomPlaceholder')}
                          value={globalOutputStyle?.length || ''}
                          onChange={(e) => handleGlobalOutputStyleChange('length', e.target.value)}
                        />
                        <datalist id="length-presets">
                          <option value={t('ai.functionConfig.outputStyle.lengths.concise')} />
                          <option value={t('ai.functionConfig.outputStyle.lengths.detailed')} />
                          <option value={t('ai.functionConfig.outputStyle.lengths.comprehensive')} />
                          <option value={t('ai.functionConfig.outputStyle.lengths.brief')} />
                          <option value={t('ai.functionConfig.outputStyle.lengths.extensive')} />
                        </datalist>
                      </div>
                    </div>
                  </div>
                  <small className="form-hint">
                    {t('ai.functionConfig.outputStyle.customHint')}
                  </small>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            <button className="btn btn-danger" onClick={handleResetAll}>
              {t('ai.settings.resetAll')}
            </button>
          </div>
          <div className="footer-right">
            <button className="btn btn-primary" onClick={onClose}>
              {t('ai.settings.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettingsModal;
