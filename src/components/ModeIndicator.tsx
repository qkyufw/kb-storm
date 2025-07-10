import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore, InteractionMode } from '../store/UIStore';
import { useCardStore } from '../store/cardStore';
import { useConnectionStore } from '../store/connectionStore';
import { useFreeConnectionStore } from '../store/freeConnectionStore';
import '../styles/ModeIndicator.css';

const ModeIndicator: React.FC = () => {
  const { t } = useTranslation();
  const { interactionMode, setInteractionMode } = useUIStore();
  const { editingCardId } = useCardStore();
  const { editingConnectionId, connectionMode } = useConnectionStore();
  const { freeConnectionMode } = useFreeConnectionStore();
  const [showModeMenu, setShowModeMenu] = useState(false);

  let modeText = '';
  let modeClass = '';

  if (editingCardId || editingConnectionId) {
    modeText = t('modes.editing');
    modeClass = 'editing-mode';
  } else if (freeConnectionMode) {
    modeText = t('modes.freeConnection');
    modeClass = 'free-connection-mode';
  } else if (connectionMode) {
    modeText = t('modes.keyboardConnection');
    modeClass = 'keyboard-connection-mode';
  } else {
    switch (interactionMode) {
      case 'cardSelection':
        modeText = t('modes.cardSelection');
        modeClass = 'card-selection';
        break;
      case 'cardMovement':
        modeText = t('modes.cardMovement');
        modeClass = 'card-movement';
        break;
      case 'connectionSelection':
        modeText = t('modes.connectionSelection');
        modeClass = 'connection-selection';
        break;
      case 'canvasDrag':
        modeText = t('modes.canvasDrag');
        modeClass = 'canvas-drag';
        break;
      default:
        modeText = t('modes.selection');
        modeClass = 'selection';
    }
  }

  // 模式选项定义
  const modeOptions: { mode: InteractionMode; key: string; label: string }[] = [
    { mode: 'cardSelection', key: '1', label: t('modes.cardSelection') },
    { mode: 'cardMovement', key: '2', label: t('modes.cardMovement') },
    { mode: 'connectionSelection', key: '3', label: t('modes.connectionSelection') },
    { mode: 'canvasDrag', key: '4', label: t('modes.canvasDrag') }
  ];

  // 处理模式切换
  const handleModeChange = (mode: InteractionMode) => {
    setInteractionMode(mode);
    setShowModeMenu(false);
  };

  // 处理点击外部关闭菜单
  const handleClickOutside = useCallback((e: MouseEvent) => {
    const target = e.target as Element;
    const modeIndicator = document.querySelector('.mode-indicator');

    // 检查点击是否在模式指示器外部
    if (modeIndicator && !modeIndicator.contains(target)) {
      setShowModeMenu(false);
    }
  }, []);

  // 处理Escape键关闭菜单
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowModeMenu(false);
    }
  }, []);

  // 添加全局事件监听器
  useEffect(() => {
    if (showModeMenu) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showModeMenu, handleClickOutside, handleKeyDown]);

  // 如果在编辑模式或连线模式，不显示下拉菜单
  const canShowMenu = !editingCardId && !editingConnectionId && !freeConnectionMode && !connectionMode;

  return (
    <div className={`mode-indicator ${modeClass} ${canShowMenu ? 'clickable' : ''}`}
         onClick={canShowMenu ? (e) => {
           e.stopPropagation();
           setShowModeMenu(!showModeMenu);
         } : undefined}>
      <div className="mode-indicator-content">
        <span className="mode-icon"></span>
        <span className="mode-text">{modeText}</span>
        {canShowMenu && <span className="mode-dropdown-arrow">▼</span>}
      </div>

      {showModeMenu && canShowMenu && (
        <div className="mode-menu" onClick={(e) => e.stopPropagation()}>
          {modeOptions.map(option => (
            <div
              key={option.mode}
              className={`mode-menu-item ${interactionMode === option.mode ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleModeChange(option.mode);
              }}
            >
              <span className="mode-key">{option.key}</span>
              <span className="mode-label">{option.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModeIndicator;
