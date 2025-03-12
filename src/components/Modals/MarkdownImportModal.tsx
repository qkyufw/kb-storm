import React, { useState, useRef } from 'react';
import '../../styles/MarkdownImportModal.css';

interface MarkdownImportModalProps {
  onImport: (markdown: string) => void;
  onClose: () => void;
}

const MarkdownImportModal: React.FC<MarkdownImportModalProps> = ({ onImport, onClose }) => {
  const [markdownContent, setMarkdownContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImport = () => {
    if (!markdownContent.trim()) {
      alert('请输入或上传有效的Markdown内容');
      return;
    }
    onImport(markdownContent);
    onClose();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setMarkdownContent(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="markdown-import-modal-overlay" onClick={onClose}>
      <div className="markdown-import-modal" onClick={e => e.stopPropagation()}>
        <h2>导入Markdown</h2>
        <p className="markdown-import-instruction">
          请输入或上传包含思维导图元数据的Markdown文件。
          <br/>
          注意：只有使用本应用导出的带有元数据的Markdown文件才能正确导入。
        </p>
        
        <div className="markdown-input-container">
          <textarea
            className="markdown-code-input"
            value={markdownContent}
            onChange={(e) => setMarkdownContent(e.target.value)}
            placeholder="请粘贴Markdown内容或使用下方按钮上传文件..."
            rows={15}
          />
        </div>
        
        <div className="markdown-import-options">
          <button 
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
          >
            选择Markdown文件
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
        
        <div className="markdown-import-actions">
          <button onClick={onClose} className="cancel-button">取消</button>
          <button onClick={handleImport} className="import-button">导入</button>
        </div>
      </div>
    </div>
  );
};

export default MarkdownImportModal;
