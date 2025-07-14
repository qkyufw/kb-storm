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
    resetAllConfig,
    roleConfigs,
    currentRoleConfigId,
    addRoleConfig,
    updateRoleConfig,
    deleteRoleConfig,
    switchToRoleConfig,
    getCurrentRoleConfig
  } = useAIConfigStore();

  // 界面状态管理
  const [activeTab, setActiveTab] = useState<'current' | 'manage'>('current');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  const [isSavingCurrent, setIsSavingCurrent] = useState(false);
  const [saveCurrentName, setSaveCurrentName] = useState('');

  // 新建角色配置的表单状态
  const [newConfigForm, setNewConfigForm] = useState({
    name: '',
    role: {
      name: '',
      description: '',
      personality: '',
      expertise: [] as string[]
    } as AIRole,
    outputStyle: {
      tone: '',
      length: ''
    } as AIOutputStyle
  });

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
    // 如果清除了角色配置，也清除当前角色配置ID
    const state = useAIConfigStore.getState();
    if (state.currentRoleConfigId && !state.globalOutputStyle) {
      useAIConfigStore.setState({ currentRoleConfigId: null });
    }
  };

  // 清除全局输出风格配置
  const clearGlobalOutputStyleConfig = () => {
    clearGlobalOutputStyle();
    // 如果清除了输出风格配置，也清除当前角色配置ID
    const state = useAIConfigStore.getState();
    if (state.currentRoleConfigId && !state.globalRole) {
      useAIConfigStore.setState({ currentRoleConfigId: null });
    }
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

  // 保存新角色配置
  const handleSaveNewConfig = () => {
    if (!newConfigForm.name.trim()) {
      alert(t('ai.settings.nameRequired'));
      return;
    }

    const outputStyle = (newConfigForm.outputStyle.tone || newConfigForm.outputStyle.length)
      ? newConfigForm.outputStyle
      : undefined;

    addRoleConfig(newConfigForm.name, newConfigForm.role, outputStyle);

    // 重置表单
    setNewConfigForm({
      name: '',
      role: {
        name: '',
        description: '',
        personality: '',
        expertise: []
      },
      outputStyle: {
        tone: '',
        length: ''
      }
    });
    setIsCreatingNew(false);
  };

  // 取消新建
  const handleCancelNew = () => {
    setIsCreatingNew(false);
    setNewConfigForm({
      name: '',
      role: {
        name: '',
        description: '',
        personality: '',
        expertise: []
      },
      outputStyle: {
        tone: '',
        length: ''
      }
    });
  };

  // 删除角色配置
  const handleDeleteConfig = (id: string) => {
    const config = roleConfigs.find(c => c.id === id);
    if (config && window.confirm(t('ai.settings.deleteConfirm', { name: config.name }))) {
      deleteRoleConfig(id);
    }
  };

  // 切换角色配置
  const handleSwitchConfig = (id: string) => {
    switchToRoleConfig(id);
  };

  // 处理新配置表单变化
  const handleNewConfigChange = (field: string, value: any) => {
    if (field.startsWith('role.')) {
      const roleField = field.substring(5);
      setNewConfigForm(prev => ({
        ...prev,
        role: {
          ...prev.role,
          [roleField]: roleField === 'expertise' && typeof value === 'string'
            ? value.split(',').map(s => s.trim()).filter(s => s.length > 0)
            : value
        }
      }));
    } else if (field.startsWith('outputStyle.')) {
      const styleField = field.substring(12);
      setNewConfigForm(prev => ({
        ...prev,
        outputStyle: {
          ...prev.outputStyle,
          [styleField]: value
        }
      }));
    } else {
      setNewConfigForm(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // 校验是否有有效的当前配置
  const hasValidCurrentConfig = () => {
    // 检查是否有角色配置
    const hasRole = globalRole && (
      globalRole.name?.trim() ||
      globalRole.description?.trim() ||
      globalRole.personality?.trim() ||
      (globalRole.expertise && globalRole.expertise.length > 0)
    );

    // 检查是否有输出风格配置
    const hasOutputStyle = globalOutputStyle && (
      globalOutputStyle.tone?.trim() ||
      globalOutputStyle.length?.trim()
    );

    return hasRole || hasOutputStyle;
  };

  // 校验是否可以保存当前配置
  const canSaveCurrentConfig = () => {
    // 检查配置名称
    if (!saveCurrentName.trim()) {
      return false;
    }

    // 检查配置名称是否已存在
    const nameExists = roleConfigs.some(config =>
      config.name.toLowerCase() === saveCurrentName.trim().toLowerCase()
    );
    if (nameExists) {
      return false;
    }

    // 检查是否有有效配置
    return hasValidCurrentConfig();
  };

  // 保存当前配置为新角色
  const handleSaveCurrentAsNew = () => {
    const trimmedName = saveCurrentName.trim();

    // 校验配置名称
    if (!trimmedName) {
      alert(t('ai.settings.nameRequired'));
      return;
    }

    // 检查名称长度
    if (trimmedName.length > 50) {
      alert(t('ai.settings.nameTooLong'));
      return;
    }

    // 检查名称是否已存在
    const nameExists = roleConfigs.some(config =>
      config.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (nameExists) {
      alert(t('ai.settings.nameExists'));
      return;
    }

    // 校验是否有有效配置
    if (!hasValidCurrentConfig()) {
      alert(t('ai.settings.noValidConfig'));
      return;
    }

    const outputStyle = (globalOutputStyle?.tone || globalOutputStyle?.length)
      ? globalOutputStyle
      : undefined;

    // 确保角色配置至少有一个字段
    const roleToSave = globalRole || {
      name: '',
      description: '',
      personality: '',
      expertise: []
    };

    addRoleConfig(trimmedName, roleToSave, outputStyle);

    // 重置表单
    setSaveCurrentName('');
    setIsSavingCurrent(false);

    // 切换到角色管理标签页显示新保存的配置
    setActiveTab('manage');
  };

  // 取消保存当前配置
  const handleCancelSaveCurrent = () => {
    setIsSavingCurrent(false);
    setSaveCurrentName('');
  };

  // 清除当前配置（包括当前角色配置ID）
  const handleClearCurrentConfig = () => {
    clearGlobalRole();
    clearGlobalOutputStyle();
    // 清除当前角色配置ID，这样"当前使用的角色配置"就会消失
    const state = useAIConfigStore.getState();
    useAIConfigStore.setState({ currentRoleConfigId: null });
  };

  if (!isOpen) return null;

  return (
    <div className="ai-config-modal-overlay" onClick={onClose}>
      <div className="modal-content ai-config-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('ai.settings.title')}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* 标签页导航 */}
        <div className="tab-navigation">
          <button
            className={`tab-button ${activeTab === 'current' ? 'active' : ''}`}
            onClick={() => setActiveTab('current')}
          >
            {t('ai.settings.tabs.current')}
          </button>
          <button
            className={`tab-button ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            {t('ai.settings.tabs.manage')}
          </button>
        </div>

        <div className="modal-body">
          {/* 当前配置标签页 */}
          {activeTab === 'current' && (
            <div className="config-form">
              {/* 当前角色配置显示 */}
              {currentRoleConfigId && getCurrentRoleConfig() && (
                <div className="current-config-info">
                  <h3>{t('ai.settings.currentConfig')}</h3>
                  <p className="config-name">{getCurrentRoleConfig()?.name}</p>
                  <button
                    className="btn btn-secondary"
                    onClick={handleClearCurrentConfig}
                  >
                    {t('ai.settings.clearCurrent')}
                  </button>
                </div>
              )}



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
          )}

          {/* 角色配置管理标签页 */}
          {activeTab === 'manage' && (
            <div className="role-management">
              <div className="role-management-header">
                <h3>{t('ai.settings.roleManagement')}</h3>
                <button
                  className="btn btn-primary"
                  onClick={() => setIsCreatingNew(true)}
                  disabled={isCreatingNew}
                >
                  {t('ai.settings.addRole')}
                </button>
              </div>

              {/* 新建角色配置表单 */}
              {isCreatingNew && (
                <div className="new-role-form">
                  <h4>{t('ai.settings.newRole')}</h4>

                  <div className="form-group">
                    <label>{t('ai.settings.configName')}</label>
                    <input
                      type="text"
                      placeholder={t('ai.settings.configNamePlaceholder')}
                      value={newConfigForm.name}
                      onChange={(e) => handleNewConfigChange('name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('ai.functionConfig.role.nameLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('ai.functionConfig.role.namePlaceholder')}
                      value={newConfigForm.role.name}
                      onChange={(e) => handleNewConfigChange('role.name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('ai.functionConfig.role.descriptionLabel')}</label>
                    <textarea
                      placeholder={t('ai.functionConfig.role.descriptionPlaceholder')}
                      value={newConfigForm.role.description}
                      onChange={(e) => handleNewConfigChange('role.description', e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('ai.functionConfig.role.personalityLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('ai.functionConfig.role.personalityPlaceholder')}
                      value={newConfigForm.role.personality}
                      onChange={(e) => handleNewConfigChange('role.personality', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('ai.functionConfig.role.expertiseLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('ai.functionConfig.role.expertisePlaceholder')}
                      value={newConfigForm.role.expertise.join(', ')}
                      onChange={(e) => handleNewConfigChange('role.expertise', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('ai.functionConfig.outputStyle.tone')}</label>
                    <input
                      type="text"
                      placeholder={t('ai.functionConfig.outputStyle.toneCustomPlaceholder')}
                      value={newConfigForm.outputStyle.tone}
                      onChange={(e) => handleNewConfigChange('outputStyle.tone', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('ai.functionConfig.outputStyle.length')}</label>
                    <input
                      type="text"
                      placeholder={t('ai.functionConfig.outputStyle.lengthCustomPlaceholder')}
                      value={newConfigForm.outputStyle.length}
                      onChange={(e) => handleNewConfigChange('outputStyle.length', e.target.value)}
                    />
                  </div>

                  <div className="form-actions">
                    <button className="btn btn-secondary" onClick={handleCancelNew}>
                      {t('common.cancel')}
                    </button>
                    <button className="btn btn-primary" onClick={handleSaveNewConfig}>
                      {t('common.save')}
                    </button>
                  </div>
                </div>
              )}

              {/* 角色配置列表 */}
              <div className="role-configs-list">
                {roleConfigs.length === 0 ? (
                  <div className="empty-state">
                    <p>{t('ai.settings.noRoles')}</p>
                  </div>
                ) : (
                  roleConfigs.map(config => (
                    <div
                      key={config.id}
                      className={`role-config-item ${currentRoleConfigId === config.id ? 'active' : ''}`}
                    >
                      <div className="role-config-info">
                        <h4>{config.name}</h4>
                        <p className="role-name">{config.role.name}</p>
                        <p className="role-description">{config.role.description}</p>
                        {config.outputStyle && (
                          <div className="output-style-info">
                            {config.outputStyle.tone && <span className="style-tag">{config.outputStyle.tone}</span>}
                            {config.outputStyle.length && <span className="style-tag">{config.outputStyle.length}</span>}
                          </div>
                        )}
                      </div>
                      <div className="role-config-actions">
                        <button
                          className={`btn btn-sm ${currentRoleConfigId === config.id ? 'btn-success' : 'btn-primary'}`}
                          onClick={() => handleSwitchConfig(config.id)}
                          disabled={currentRoleConfigId === config.id}
                        >
                          {currentRoleConfigId === config.id ? t('ai.settings.current') : t('ai.settings.use')}
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteConfig(config.id)}
                        >
                          {t('common.delete')}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 保存当前配置表单 */}
        {isSavingCurrent && (
          <div className="save-current-form-footer">
            <h4>{t('ai.settings.saveCurrentAsNew')}</h4>
            <div className="form-group">
              <label>{t('ai.settings.configName')}</label>
              <input
                type="text"
                placeholder={t('ai.settings.configNamePlaceholder')}
                value={saveCurrentName}
                onChange={(e) => setSaveCurrentName(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        )}

        <div className="modal-footer">
          <div className="footer-left">
            <button className="btn btn-danger" onClick={handleResetAll}>
              {t('ai.settings.resetAll')}
            </button>
          </div>
          <div className="footer-center">
            {/* 保存当前配置为新角色按钮 */}
            {activeTab === 'current' && !isSavingCurrent && hasValidCurrentConfig() && (
              <button
                className="btn btn-primary"
                onClick={() => setIsSavingCurrent(true)}
              >
                {t('ai.settings.saveAsNew')}
              </button>
            )}
            {/* 保存当前配置操作按钮 */}
            {isSavingCurrent && (
              <div className="save-actions">
                <button className="btn btn-secondary" onClick={handleCancelSaveCurrent}>
                  {t('common.cancel')}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSaveCurrentAsNew}
                  disabled={!canSaveCurrentConfig()}
                >
                  {t('common.save')}
                </button>
              </div>
            )}
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
