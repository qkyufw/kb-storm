import React from 'react';
import '../styles/HelpModal.css';

interface HelpModalProps {
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={(e) => e.stopPropagation()}>
        <h2>键盘快捷键指南</h2>
        <div className="help-content">
          <table>
            <thead>
              <tr>
                <th>快捷键</th>
                <th>功能</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ctrl+N</td>
                <td>创建新卡片</td>
              </tr>
              <tr>
                <td>Enter</td>
                <td>编辑选中的卡片</td>
              </tr>
              <tr>
                <td>Ctrl+Enter</td>
                <td>完成编辑</td>
              </tr>
              <tr>
                <td>Esc</td>
                <td>取消编辑/连线/取消选择</td>
              </tr>
              <tr>
                <td>Tab / Shift+Tab</td>
                <td>在卡片间切换</td>
              </tr>
              <tr>
                <td>方向键</td>
                <td>移动选中的卡片</td>
              </tr>
              <tr>
                <td>Shift+方向键</td>
                <td>大幅移动选中的卡片</td>
              </tr>
              <tr>
                <td>Delete / Backspace</td>
                <td>删除选中的卡片</td>
              </tr>
              <tr>
                <td>C</td>
                <td>开始连线模式</td>
              </tr>
              <tr>
                <td>Ctrl++ / Ctrl+-</td>
                <td>放大/缩小视图</td>
              </tr>
              <tr>
                <td>Ctrl+空格</td>
                <td>重置视图位置</td>
              </tr>
              <tr>
                <td>Ctrl+S</td>
                <td>保存思维导图</td>
              </tr>
              <tr>
                <td>Ctrl+O</td>
                <td>加载思维导图</td>
              </tr>
              <tr>
                <td>?</td>
                <td>显示/隐藏帮助</td>
              </tr>
            </tbody>
          </table>
        </div>
        <button className="close-button" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
};

export default HelpModal;
