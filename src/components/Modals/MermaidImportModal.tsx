import React, { useState, useRef } from 'react';
import '../../styles/MermaidImportModal.css';

interface MermaidImportModalProps {
  onImport: (code: string) => void;
  onClose: () => void;
}

const MermaidImportModal: React.FC<MermaidImportModalProps> = ({ onImport, onClose }) => {
  const [mermaidCode, setMermaidCode] = useState('');
  
  // 建议使用示例
  const exampleCode = `graph LR
  A[开始] --> B[处理]
  B --> C[结束]`;

  // 使用最简化的处理方式，改为受控组件
  const handleImport = () => {
    if (!mermaidCode.trim()) {
      alert('请输入有效的Mermaid代码');
      return;
    }
    onImport(mermaidCode);
    onClose();
  };

  // 解决粘贴问题的关键是使用文件输入
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setMermaidCode(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mermaid-import-modal-overlay" onClick={onClose}>
      <div className="mermaid-import-modal" onClick={e => e.stopPropagation()}>
        <h2>导入Mermaid流程图</h2>
        
        <div className="mermaid-input-container">
          <textarea
            className="mermaid-code-input"
            value={mermaidCode}
            onChange={(e) => setMermaidCode(e.target.value)}
            placeholder="请输入或粘贴Mermaid格式代码..."
            rows={10}
          />
        </div>
        
        <div className="import-options">
          <p>粘贴不成功？尝试以下选项：</p>
          <div className="option-buttons">
            <label className="file-input-label">
              从文件导入
              <input
                type="file"
                accept=".md,.mmd,.txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            <button 
              className="use-example-button"
              onClick={() => setMermaidCode(exampleCode)}
            >
              使用示例
            </button>
          </div>
        </div>
        
        <div className="mermaid-example">
          <h3>示例代码:</h3>
          <pre>{exampleCode}</pre>
        </div>
        
        <div className="mermaid-import-actions">
          <button onClick={onClose} className="cancel-button">取消</button>
          <button onClick={handleImport} className="import-button">导入</button>
        </div>
      </div>
    </div>
  );
};

export default MermaidImportModal;
