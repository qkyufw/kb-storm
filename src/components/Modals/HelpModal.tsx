import React from 'react';
import '../../styles/HelpModal.css';

interface HelpItem {
  key: string;
  desc: string;
}

interface HelpModalProps {
  helpItems: HelpItem[];
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ helpItems, onClose }) => {
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
              {helpItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.key}</td>
                  <td>{item.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="close-button" onClick={onClose}>关闭</button>
      </div>
    </div>
  );
};

export default HelpModal;
