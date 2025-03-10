import React from 'react';
import Toolbar from './Toolbar';
import { LayoutAlgorithm, LayoutOptions } from '../../utils/layoutUtils';
import { IKeyBindings } from '../../types';

interface MindMapHeaderProps {
  onCreateCard: () => void;
  onSave: () => void;
  onLoad: () => void;
  onShowHelp: () => void;
  onShowKeyBindings: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  keyBindings: IKeyBindings;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  currentLayout: {
    algorithm: LayoutAlgorithm;
    options: LayoutOptions;
  };
  onLayoutChange: (algorithm: LayoutAlgorithm, options?: LayoutOptions) => void;
  hasSelection: boolean;
}

const MindMapHeader: React.FC<MindMapHeaderProps> = ({
  onCreateCard,
  onSave,
  onLoad,
  onShowHelp,
  onShowKeyBindings,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  keyBindings,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  currentLayout,
  onLayoutChange,
  hasSelection
}) => {
  return (
    <div className="fixed-header">
      <Toolbar
        onCreateCard={onCreateCard}
        onSave={onSave}
        onLoad={onLoad}
        onShowHelp={onShowHelp}
        onShowKeyBindings={onShowKeyBindings}
        onCopy={onCopy}
        onCut={onCut}
        onPaste={onPaste}
        onDelete={onDelete}
        keyBindings={keyBindings}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
        currentLayout={currentLayout}
        onLayoutChange={onLayoutChange}
        hasSelection={hasSelection}
      />
    </div>
  );
};

export default MindMapHeader;
