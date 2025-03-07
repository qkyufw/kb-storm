import React from 'react';
import { IKeyBindings } from '../../types';
import { LayoutAlgorithm, LayoutOptions } from '../../utils/layoutUtils';
import LayoutSelector from './LayoutSelector';

interface ToolbarProps {
  onCreateCard: () => void;
  onSave: () => void;
  onLoad: () => void;
  onShowHelp: () => void;
  onShowKeyBindings: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
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
}

const Toolbar: React.FC<ToolbarProps> = ({
  onCreateCard,
  onSave,
  onLoad,
  onShowHelp,
  onShowKeyBindings,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  keyBindings,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  currentLayout,
  onLayoutChange
}) => {
  return (
    <div className="toolbar">
      <button onClick={onCreateCard}>新建卡片 (Ctrl+{keyBindings.newCard.toUpperCase()})</button>
      <div className="edit-controls">
        <button onClick={onUndo} disabled={!canUndo} title="撤销 (Ctrl+Z)">撤销</button>
        <button onClick={onRedo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)">重做</button>
      </div>
      <LayoutSelector 
        currentLayout={currentLayout}
        onLayoutChange={onLayoutChange}
      />
      <button onClick={onSave}>保存 (Ctrl+{keyBindings.save.toUpperCase()})</button>
      <button onClick={onLoad}>加载 (Ctrl+{keyBindings.load.toUpperCase()})</button>
      <button onClick={onShowHelp}>帮助 ({keyBindings.help})</button>
      <button onClick={onShowKeyBindings}>快捷键设置 (Ctrl+{keyBindings.showKeyBindings.toUpperCase()})</button>
      <div className="zoom-controls">
        <button onClick={onZoomOut}>-</button>
        <span>{Math.round(zoomLevel * 100)}%</span>
        <button onClick={onZoomIn}>+</button>
      </div>
    </div>
  );
};

export default Toolbar;
