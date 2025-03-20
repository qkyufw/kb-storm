import React, { useState } from 'react';
import { LayoutAlgorithm, LayoutOptions } from '../../utils/layoutUtils';
import '../../styles/toolbar/LayoutSelector.css';

interface LayoutSelectorProps {
  currentLayout: {
    algorithm: LayoutAlgorithm;
    options: LayoutOptions;
  };
  onLayoutChange: (algorithm: LayoutAlgorithm, options?: LayoutOptions) => void;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ currentLayout, onLayoutChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [spacing, setSpacing] = useState(currentLayout.options.spacing || 180);
  const [jitter, setJitter] = useState(currentLayout.options.jitter || 10);
  
  // 布局算法定义与预览图示 - 已移除树形布局
  const layouts: { id: LayoutAlgorithm, name: string, description: string, preview: string }[] = [
    { 
      id: 'random', 
      name: '随机布局', 
      description: '卡片在当前视图范围内随机分布，自动避免重叠', 
      preview: '⟿ ⤧ ⟿'
    },
    { 
      id: 'grid', 
      name: '网格布局', 
      description: '卡片按整齐的矩阵形式排列', 
      preview: '□ □ □'
    },
    { 
      id: 'spiral', 
      name: '螺旋布局', 
      description: '卡片按黄金螺旋方式向外扩展', 
      preview: '↺ ↺ ↺'
    },
    { 
      id: 'circular', 
      name: '环形布局', 
      description: '卡片围绕中心点按同心圆均匀排列', 
      preview: '○ ○ ○'
    }
  ];
  
  const handleLayoutSelect = (algorithm: LayoutAlgorithm) => {
    onLayoutChange(algorithm, { 
      spacing: spacing, 
      jitter: jitter 
    });
    setIsOpen(false);
  };
  
  return (
    <div className="layout-selector">
      <button 
        className="layout-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        布局: {layouts.find(l => l.id === currentLayout.algorithm)?.name || '随机布局'}
      </button>
      
      {isOpen && (
        <div className="layout-dropdown">
          <div className="layout-options">
            <h3>选择布局方式</h3>
            
            <div className="layout-list">
              {layouts.map(layout => (
                <div 
                  key={layout.id}
                  className={`layout-item ${currentLayout.algorithm === layout.id ? 'active' : ''}`}
                  onClick={() => handleLayoutSelect(layout.id)}
                >
                  <div className="layout-preview">{layout.preview}</div>
                  <div>
                    <div className="layout-name">{layout.name}</div>
                    <div className="layout-description">{layout.description}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="layout-settings">
              <h4>布局设置</h4>
              
              <div className="setting-item">
                <label>间距:</label>
                <input 
                  type="range" 
                  min="120" 
                  max="300" 
                  value={spacing}
                  onChange={(e) => setSpacing(parseInt(e.target.value))}
                />
                <span>{spacing}px</span>
              </div>
              
              <div className="setting-item">
                <label>随机性:</label>
                <input 
                  type="range" 
                  min="0" 
                  max="30" 
                  value={jitter}
                  onChange={(e) => setJitter(parseInt(e.target.value))}
                />
                <span>{jitter}px</span>
              </div>
              
              <div className="layout-actions">
                <button onClick={() => setIsOpen(false)}>关闭</button>
                <button 
                  onClick={() => onLayoutChange(currentLayout.algorithm, { spacing, jitter })}
                  className="apply-button"
                >
                  应用设置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutSelector;
