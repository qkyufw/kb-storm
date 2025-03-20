import React from 'react';

interface MindMapFeedbackProps {
  connectionMode: boolean;
  showUndoMessage: boolean;
  showRedoMessage: boolean;
  // 移除了 selectedCardIds 和 selectedConnectionIds
}

/**
 * 负责显示操作反馈信息的组件
 */
const MindMapFeedback: React.FC<MindMapFeedbackProps> = ({
  connectionMode,
  showUndoMessage,
  showRedoMessage
}) => {
  return (
    <>
      {connectionMode && (
        <div className="connection-mode-indicator">
          连线模式: 请选择目标卡片，ESC取消
        </div>
      )}
      
      {showUndoMessage && (
        <div className="action-feedback undo">
          已撤销操作
        </div>
      )}
      
      {showRedoMessage && (
        <div className="action-feedback redo">
          已重做操作
        </div>
      )}
      
      {/* 移除了选择状态提示 */}
    </>
  );
};

export default MindMapFeedback;
