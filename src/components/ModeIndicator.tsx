import React from 'react';
import { useUIStore } from '../store/UIStore';
import { useCardStore } from '../store/cardStore';
import { useConnectionStore } from '../store/connectionStore';
import { useFreeConnectionStore } from '../store/freeConnectionStore';
import '../styles/ModeIndicator.css';

const ModeIndicator: React.FC = () => {
  const { interactionMode } = useUIStore();
  const { editingCardId } = useCardStore();
  const { editingConnectionId, connectionMode } = useConnectionStore();
  const { freeConnectionMode } = useFreeConnectionStore();
  
  let modeText = '';
  let modeClass = '';

  if (editingCardId || editingConnectionId) {
    modeText = '编辑模式';
    modeClass = 'editing-mode';
  } else if (freeConnectionMode) {
    modeText = '绘制连线';
    modeClass = 'free-connection-mode';
  } else if (connectionMode) {
    modeText = '键盘连线';
    modeClass = 'keyboard-connection-mode';
  } else {
    switch (interactionMode) {
      case 'cardSelection':
        modeText = '卡片选择';
        modeClass = 'card-selection';
        break;
      case 'cardMovement':
        modeText = '卡片移动';
        modeClass = 'card-movement';
        break;
      case 'connectionSelection':
        modeText = '线条选择';
        modeClass = 'connection-selection';
        break;
      default:
        modeText = '选择模式';
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
