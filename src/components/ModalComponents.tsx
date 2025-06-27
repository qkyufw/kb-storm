import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/modals/ModalStyles.css';
import { useExportImportStore } from '../store/exportImportStore';
import { showLocalizedAlert, generateFileName } from '../i18n/utils';

// MarkdownExportModal 组件
interface MarkdownExportModalProps {
  markdownContent: string;
  onClose: () => void;
}

const MarkdownExportModalComponent: React.FC<MarkdownExportModalProps> = ({ markdownContent, onClose }) => {
  const { t } = useTranslation();
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
            .then(() => showLocalizedAlert(t, 'messages.clipboard.copied'))
            .catch(err => {
              console.error('无法复制: ', err);
              // 回退到旧方法
              document.execCommand('copy');
              showLocalizedAlert(t, 'messages.clipboard.copied');
            });
        } else {
          // 回退到旧方法
          const successful = document.execCommand('copy');
          if (successful) {
            showLocalizedAlert(t, 'messages.clipboard.copied');
          } else {
            showLocalizedAlert(t, 'messages.clipboard.copyFailed');
          }
        }
      } catch (err) {
        console.error('复制过程中发生错误:', err);
        showLocalizedAlert(t, 'messages.clipboard.copyFailed');
      }
    }
  };

  const handleDownloadClick = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    // 使用本地化的文件名
    a.download = generateFileName(t, undefined, t('files.extensions.markdown'));

    a.href = url;
    document.body.appendChild(a);
    a.click();
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="markdown-export-modal-overlay" onClick={onClose}>
      <div className="markdown-export-modal" onClick={e => e.stopPropagation()}>
        <h2>{t('modals.markdownExport.title')}</h2>
        <p className="markdown-export-instruction">
          {t('modals.markdownExport.instruction')}
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
            {t('modals.markdownExport.copyContent')}
          </button>
          <button className="save-button" onClick={handleDownloadClick}>
            {t('modals.markdownExport.saveFile')}
          </button>
          <button className="close-button" onClick={onClose}>
            {t('common.close')}
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
  const { t } = useTranslation();
  const [mermaidCode, setMermaidCode] = useState('');

  // 建议使用示例
  const exampleCode = `graph LR
  A[${t('common.start', '开始')}] --> B[${t('common.process', '处理')}]
  B --> C[${t('common.end', '结束')}]`;

  // 使用最简化的处理方式，改为受控组件
  const handleImport = () => {
    if (!mermaidCode.trim()) {
      showLocalizedAlert(t, 'messages.import.invalidMermaid');
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
        <h2>{t('modals.mermaidImport.title')}</h2>

        <div className="mermaid-input-container">
          <textarea
            className="mermaid-code-input"
            value={mermaidCode}
            onChange={(e) => setMermaidCode(e.target.value)}
            placeholder={t('modals.mermaidImport.placeholder')}
            rows={10}
          />
        </div>

        <div className="import-options">
          <p>{t('modals.mermaidImport.pasteHelp')}</p>
          <div className="option-buttons">
            <label className="file-input-label">
              {t('modals.mermaidImport.fromFile')}
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
              {t('modals.mermaidImport.useExample')}
            </button>
          </div>
        </div>

        <div className="mermaid-example">
          <h3>{t('common.example', '示例代码')}:</h3>
          <pre>{exampleCode}</pre>
        </div>

        <div className="mermaid-import-actions">
          <button onClick={onClose} className="cancel-button">{t('common.cancel')}</button>
          <button onClick={handleImport} className="import-button">{t('common.import')}</button>
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
  const { t } = useTranslation();
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
            .then(() => showLocalizedAlert(t, 'messages.clipboard.copied'))
            .catch(err => {
              console.error('无法复制: ', err);
              // 回退到旧方法
              document.execCommand('copy');
              showLocalizedAlert(t, 'messages.clipboard.copied');
            });
        } else {
          // 回退到旧方法
          const successful = document.execCommand('copy');
          if (successful) {
            showLocalizedAlert(t, 'messages.clipboard.copied');
          } else {
            showLocalizedAlert(t, 'messages.clipboard.copyFailed');
          }
        }
      } catch (err) {
        console.error('复制过程中发生错误:', err);
        showLocalizedAlert(t, 'messages.clipboard.copyFailed');
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
        <h2>{t('modals.mermaidExport.title')}</h2>
        <p className="mermaid-export-instruction">{t('modals.mermaidExport.instruction')}</p>
        
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
            {t('modals.mermaidExport.copyCode')}
          </button>
          <button className="close-button" onClick={onClose}>
            {t('common.close')}
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
  const { t } = useTranslation();
  const [markdownContent, setMarkdownContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImport = () => {
    if (!markdownContent.trim()) {
      showLocalizedAlert(t, 'messages.import.markdownFailed');
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
        <h2>{t('modals.markdownImport.title')}</h2>
        <p className="markdown-import-instruction">
          {t('modals.markdownImport.instruction')}
          <br/>
          1. <strong>{t('modals.markdownImport.mode1')}</strong>
          <br/>
          2. <strong>{t('modals.markdownImport.mode2')}</strong>
        </p>
        
        <div className="markdown-input-container">
          <textarea
            className="markdown-code-input"
            value={markdownContent}
            onChange={(e) => setMarkdownContent(e.target.value)}
            placeholder={t('modals.markdownImport.placeholder')}
            rows={15}
          />
        </div>
        
        <div className="markdown-import-options">
          <button 
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
          >
            {t('modals.markdownImport.uploadFile')}
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
          <button onClick={onClose} className="cancel-button">{t('common.cancel')}</button>
          <button onClick={handleImport} className="import-button">{t('common.import')}</button>
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