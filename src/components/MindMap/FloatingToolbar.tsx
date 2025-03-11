import React, { useState, useRef, useEffect } from 'react';
import Toolbar from './Toolbar';
import { LayoutAlgorithm, LayoutOptions } from '../../utils/layoutUtils';
import { IKeyBindings } from '../../types';

interface FloatingToolbarProps {
  onCreateCard: () => void;
  onSave: () => void;
  onLoad: () => void;
  onShowHelp: () => void;
  onShowKeyBindings: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  keyBindings: IKeyBindings;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  currentLayout: {
    algorithm: LayoutAlgorithm;
    options: LayoutOptions;
  };
  onLayoutChange: (algorithm: LayoutAlgorithm, options?: LayoutOptions) => void;
  hasSelection: boolean;
}

// 更新类型定义，添加"custom"作为有效值
type ToolbarPosition = 'top' | 'bottom' | 'left' | 'right' | 'custom';

const FloatingToolbar: React.FC<FloatingToolbarProps> = (props) => {
  // 工具栏位置状态
  const [position, setPosition] = useState<ToolbarPosition>('top');
  
  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef<HTMLDivElement>(null);
  
  // 位置切换函数
  const togglePosition = () => {
    // 只在预设位置间循环，不包含'custom'
    const positions: ToolbarPosition[] = ['top', 'right', 'bottom', 'left'];
    
    // 如果当前是自定义位置，切换到顶部
    if (position === 'custom') {
      setPosition('top');
      
      // 重置工具栏样式以使用预定义位置的CSS
      if (toolbarRef.current) {
        toolbarRef.current.style.transform = '';
        toolbarRef.current.style.left = '';
        toolbarRef.current.style.top = '';
        toolbarRef.current.classList.add('position-top');
      }
      
      localStorage.setItem('toolbar-position', 'top');
      return;
    }
    
    // 在预设位置间循环
    const currentIndex = positions.indexOf(position);
    const nextIndex = (currentIndex + 1) % positions.length;
    setPosition(positions[nextIndex]);
    
    // 保存位置到本地存储
    localStorage.setItem('toolbar-position', positions[nextIndex]);
  };
  
  // 加载保存的位置
  useEffect(() => {
    const savedPosition = localStorage.getItem('toolbar-position') as ToolbarPosition | null;
    if (savedPosition && ['top', 'bottom', 'left', 'right'].includes(savedPosition)) {
      setPosition(savedPosition);
    }
  }, []);

  // 处理拖拽开始
  const handleDragStart = (e: React.MouseEvent) => {
    if (!toolbarRef.current) return;
    
    setIsDragging(true);
    
    const rect = toolbarRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    document.body.style.userSelect = 'none';
  };

  // 添加拖拽事件监听
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !toolbarRef.current) return;
      
      const toolbar = toolbarRef.current;
      const toolbarRect = toolbar.getBoundingClientRect();
      
      // 计算新位置
      let newLeft = e.clientX - dragOffset.x;
      let newTop = e.clientY - dragOffset.y;
      
      // 限制不要拖出屏幕边缘 (至少保留20px可见)
      const minVisible = 50; // 至少保持50px在可见区域内
      newLeft = Math.min(Math.max(newLeft, -toolbarRect.width + minVisible), window.innerWidth - minVisible);
      newTop = Math.min(Math.max(newTop, 0), window.innerHeight - minVisible);
      
      toolbar.style.transform = 'none';
      toolbar.style.left = `${newLeft}px`;
      toolbar.style.top = `${newTop}px`;
      
      // 退出预设位置模式
      toolbar.classList.remove('position-top', 'position-bottom', 'position-left', 'position-right');
      setPosition('custom'); // 现在这里的类型正确
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
    };
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);
  
  return (
    <div 
      ref={toolbarRef}
      className={`toolbar position-${position !== 'custom' ? position : ''} ${isDragging ? 'dragging' : ''}`}
    >
      {/* 改进拖动手柄实现 */}
      <div 
        className="toolbar-drag-handle" 
        onMouseDown={handleDragStart}
        title="拖动工具栏"
      />
      
      <Toolbar {...props} />
      
      <div 
        className="toolbar-position-toggle" 
        onClick={togglePosition}
        title="切换工具栏位置"
      >
        {position === 'top' ? '↓' : 
         position === 'bottom' ? '↑' : 
         position === 'left' ? '→' : 
         position === 'right' ? '←' : '⋮'}
      </div>
    </div>
  );
};

export default FloatingToolbar;
