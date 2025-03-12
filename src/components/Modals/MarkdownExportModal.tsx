import React, { useRef, useEffect } from 'react';
import '../../styles/MarkdownExportModal.css';

interface MarkdownExportModalProps {
  markdownContent: string;
  onClose: () => void;
}

const MarkdownExportModal: React.FC<MarkdownExportModalProps> = ({ markdownContent, onClose }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // 组件挂载时自动选中所有文本，方便用户直接复制
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
      textAreaRef.current.select();
    }
  }, []);

  const handleCopyClick = () => {
    if (textAreaRef.current) {
      textAreaRef.current.select();
      
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(markdownContent)
            .then(() => alert('已复制到剪贴板'))
            .catch(err => {
              console.error('无法复制: ', err);
              // 回退到旧方法
              document.execCommand('copy');
              alert('已复制到剪贴板');
            });
        } else {
          // 回退到旧方法
          const successful = document.execCommand('copy');
          if (successful) {
            alert('已复制到剪贴板');
          } else {
            alert('复制失败，请手动选择并复制');
          }
        }
      } catch (err) {
        console.error('复制过程中发生错误:', err);
        alert('复制失败，请手动选择并复制');
      }
    }
  };

  const handleSaveClick = () => {
    // 创建Blob对象
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="markdown-export-modal-overlay" onClick={onClose}>
      <div className="markdown-export-modal" onClick={e => e.stopPropagation()}>
        <h2>Markdown 导出</h2>
        <p className="markdown-export-instruction">
          以下是思维导图的 Markdown 格式内容，可以复制到任何支持 Markdown 的编辑器中使用。
          元数据已保存在文档末尾，用于后续导入。
        </p>
        
        <div className="markdown-code-container">
          <textarea 
            ref={textAreaRef} 
            className="markdown-code-output" 
            value={markdownContent} 
            readOnly
            rows={15}
          />
        </div>
        
        <div className="markdown-export-actions">
          <button className="copy-button" onClick={handleCopyClick}>
            复制内容
          </button>
          <button className="save-button" onClick={handleSaveClick}>
            保存文件
          </button>
          <button className="close-button" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkdownExportModal;
