import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUIStore } from '../store/UIStore';
import { useCardStore } from '../store/cardStore';
import { useConnectionStore } from '../store/connectionStore';
import { useFreeConnectionStore } from '../store/freeConnectionStore';
import '../styles/ModeIndicator.css';

const ModeIndicator: React.FC = () => {
  const { t } = useTranslation();
  const { interactionMode } = useUIStore();
  const { editingCardId } = useCardStore();
  const { editingConnectionId, connectionMode } = useConnectionStore();
  const { freeConnectionMode } = useFreeConnectionStore();

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
      default:
        modeText = t('modes.selection');
        modeClass = 'selection';
    }
  }
  
  return (
    <div className={`mode-indicator ${modeClass}`}>
      <div className="mode-indicator-content">
        <span className="mode-icon"></span>
        <span className="mode-text">{modeText}</span>
      </div>
    </div>
  );
};

export default ModeIndicator;
