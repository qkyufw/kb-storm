import React from 'react';

interface MindMapFeedbackProps {
  connectionMode: boolean;
  showUndoMessage: boolean;
  showRedoMessage: boolean;
  selectedCardIds: string[];
  selectedConnectionIds: string[];
}

/**
 * 负责显示操作反馈信息的组件
 */
const MindMapFeedback: React.FC<MindMapFeedbackProps> = ({
  connectionMode,
  showUndoMessage,
  showRedoMessage,
  selectedCardIds,
  selectedConnectionIds
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
      
      {/* 选择反馈，只显示一个，优先显示详细信息 */}
      {(selectedCardIds.length > 0 || selectedConnectionIds.length > 0) ? (
        <div className="action-feedback selection">
          已选择 {selectedCardIds.length} 张卡片和 {selectedConnectionIds.length} 条连接线
        </div>
      ) : null}
    </>
  );
};

export default MindMapFeedback;
