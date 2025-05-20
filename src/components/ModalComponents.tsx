import React, { useRef, useEffect, useState } from 'react';
import '../styles/modals/ModalStyles.css';
import { useExportImportStore } from '../store/exportImportStore';

// MarkdownExportModal 组件
interface MarkdownExportModalProps {
  markdownContent: string;
  onClose: () => void;
}

const MarkdownExportModalComponent: React.FC<MarkdownExportModalProps> = ({ markdownContent, onClose }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
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

// MermaidImportModal 组件
interface MermaidImportModalProps {
  onImport: (code: string) => void;
  onClose: () => void;
}

const MermaidImportModalComponent: React.FC<MermaidImportModalProps> = ({ onImport, onClose }) => {
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

// MermaidExportModal 组件
interface MermaidExportModalProps {
  mermaidCode: string;
  onClose: () => void;
}

const MermaidExportModalComponent: React.FC<MermaidExportModalProps> = ({ mermaidCode, onClose }) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
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

// MarkdownImportModal 组件
interface MarkdownImportModalProps {
  onImport: (markdown: string) => void;
  onClose: () => void;
}

const MarkdownImportModalComponent: React.FC<MarkdownImportModalProps> = ({ onImport, onClose }) => {
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
          请输入或上传Markdown文件。支持两种导入模式：
          <br/>
          1. <strong>带元数据的Markdown</strong>：完全还原思维导图的所有信息
          <br/>
          2. <strong>普通Markdown</strong>：根据分隔符或段落创建独立卡片
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

// 导出所有组件
export const MarkdownExportModal = MarkdownExportModalComponent;
export const MermaidImportModal = MermaidImportModalComponent;
export const MermaidExportModal = MermaidExportModalComponent;
export const MarkdownImportModal = MarkdownImportModalComponent;

// 创建默认导出对象
export default {
  MarkdownExportModal: MarkdownExportModalComponent,
  MermaidImportModal: MermaidImportModalComponent,
  MermaidExportModal: MermaidExportModalComponent,
  MarkdownImportModal: MarkdownImportModalComponent
};

export const RenderModals: React.FC = () => {
  const exportImport = useExportImportStore();
  
  return (
    <>
      {exportImport.showMermaidImportModal && (
        <MermaidImportModal
          onImport={exportImport.handleImportMermaid}
          onClose={exportImport.closeMermaidImportModal}
        />
      )}
      {exportImport.showMermaidExportModal && (
        <MermaidExportModal
          mermaidCode={exportImport.mermaidCode}
          onClose={exportImport.closeMermaidExportModal}
        />
      )}
      {exportImport.showMarkdownExportModal && (
        <MarkdownExportModal
          markdownContent={exportImport.markdownContent}
          onClose={exportImport.closeMarkdownExportModal}
        />
      )}
      {exportImport.showMarkdownImportModal && (
        <MarkdownImportModal
          onImport={exportImport.handleImportMarkdown}
          onClose={exportImport.closeMarkdownImportModal}
        />
      )}
    </>
  );
};