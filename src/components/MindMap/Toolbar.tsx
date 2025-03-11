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
  onCopy?: () => void; // 添加复制功能
  onCut?: () => void; // 添加剪切功能
  onPaste?: () => void; // 添加粘贴功能
  onDelete?: () => void; // 添加删除功能
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
  hasSelection?: boolean; // 是否有选中的元素
}

const Toolbar: React.FC<ToolbarProps> = ({
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
    <div className="toolbar">
      <button onClick={onCreateCard}>
        新建卡片 ({keyBindings.newCard ? `Ctrl+${keyBindings.newCard.toUpperCase()}` : '未设置'})
      </button>
      
      <div className="edit-controls">
        <button onClick={onUndo} disabled={!canUndo} title="撤销 (Ctrl+Z)">撤销</button>
        <button onClick={onRedo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)">重做</button>
      </div>
      
      {/* 添加编辑按钮组 */}
      <div className="edit-controls">
        <button onClick={onCopy} disabled={!hasSelection} title="复制 (Ctrl+C)">复制</button>
        <button onClick={onCut} disabled={!hasSelection} title="剪切 (Ctrl+X)">剪切</button>
        <button onClick={onPaste} title="粘贴 (Ctrl+V)">粘贴</button>
        <button onClick={onDelete} disabled={!hasSelection} title="删除 (Delete)">删除</button>
      </div>
      
      <LayoutSelector 
        currentLayout={currentLayout}
        onLayoutChange={onLayoutChange}
      />
      
      <button onClick={onSave}>
        保存 ({keyBindings.save ? `Ctrl+${keyBindings.save.toUpperCase()}` : '未设置'})
      </button>
      <button onClick={onLoad}>
        加载 ({keyBindings.load ? `Ctrl+${keyBindings.load.toUpperCase()}` : '未设置'})
      </button>
      <button onClick={onShowHelp}>
        帮助 ({keyBindings.help || '未设置'})
      </button>
      <button onClick={onShowKeyBindings}>
        快捷键设置 ({keyBindings.showKeyBindings ? `Ctrl+${keyBindings.showKeyBindings.toUpperCase()}` : '未设置'})
      </button>
    </div>
  );
};

export default Toolbar;
