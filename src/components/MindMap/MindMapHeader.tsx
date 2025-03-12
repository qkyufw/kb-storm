import React from 'react';
import Toolbar from './Toolbar';
import { LayoutAlgorithm, LayoutOptions } from '../../utils/layoutUtils';
import { IKeyBindings } from '../../types';
import '../../styles/MindMapHeader.css';

interface MindMapHeaderProps {
  onCreateCard: () => void;
  onExportPNG?: () => void;
  onExportMermaid?: () => void;
  onExportMarkdown?: () => void; // 添加Markdown导出方法
  onImportMermaid?: () => void;
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
  onExportPNG,
  onExportMermaid,
  onExportMarkdown, // 解构导出方法
  onImportMermaid,
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
    <div className="mind-map-header">
      <Toolbar
        onCreateCard={onCreateCard}
        onExportPNG={onExportPNG}
        onExportMermaid={onExportMermaid}
        onExportMarkdown={onExportMarkdown} // 传递到Toolbar
        onImportMermaid={onImportMermaid}
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
