import React, { useRef, useEffect } from 'react';
import '../../styles/MermaidExportModal.css';

interface MermaidExportModalProps {
  mermaidCode: string;
  onClose: () => void;
}

const MermaidExportModal: React.FC<MermaidExportModalProps> = ({ mermaidCode, onClose }) => {
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
        // 尝试使用新的剪贴板API
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(mermaidCode)
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

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Escape键关闭模态框
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
    
    // Ctrl+C已经由浏览器处理，不需要额外处理
  };

  return (
    <div className="mermaid-export-modal-overlay" onClick={onClose}>
      <div className="mermaid-export-modal" onClick={e => e.stopPropagation()}>
        <h2>Mermaid 代码</h2>
        <p className="mermaid-export-instruction">以下代码可以用在支持 Mermaid 的平台上，如 GitHub、GitLab、Notion 等</p>
        
        <div className="mermaid-code-container">
          <textarea 
            ref={textAreaRef} 
            className="mermaid-code-output" 
            value={mermaidCode} 
            readOnly
            onKeyDown={handleKeyDown}
            rows={15}
          />
        </div>
        
        <div className="mermaid-export-actions">
          <button className="copy-button" onClick={handleCopyClick}>
            复制代码
          </button>
          <button className="close-button" onClick={onClose}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};

export default MermaidExportModal;
