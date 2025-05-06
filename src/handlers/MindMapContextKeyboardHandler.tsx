import React, { useEffect } from 'react';
import { useMindMap } from '../context/MindMapContext';

// 键盘处理器组件 - 使用Context版本
const MindMapContextKeyboardHandler: React.FC = () => {
  const {
    selectedCardId,
    editingCardId,
    editingConnectionId,
    keyBindings,
    tabPressed,
    setTabPressed,
    moveCard,
    setEditingCardId,
    selectNextCard,
    selectNearestCard,
    createConnectedCard,
    startConnectionMode,
    cancelConnectionMode,
    deleteCards,
    handleConnectionsDelete,
    handlePaste,
    handleUndo,
    handleRedo,
    setZoomLevel,
    setPan,
    saveMindMap,
    loadMindMap,
    startContinuousMove,
    stopContinuousMove,
    selectedConnectionIds,
    selectNextConnection,
    updateConnectionLabel,
    setEditingConnectionId
  } = useMindMap();

  // 处理键盘事件
  useEffect(() => {
    // 如果正在编辑，则不拦截键盘事件
    if (editingCardId !== null || editingConnectionId !== null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 阻止在表单元素中触发快捷键
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      console.log("键盘事件:", e.key, e.ctrlKey, e.metaKey);

      // Tab键处理
      if (e.key === 'Tab') {
        e.preventDefault();
        setTabPressed(true);
        selectNextCard(e.shiftKey);
        return;
      }

      // 处理Enter键 - 进入编辑模式
      if (e.key === 'Enter' && !e.ctrlKey && selectedCardId) {
        e.preventDefault();
        console.log("设置编辑卡片:", selectedCardId);
        setEditingCardId(selectedCardId);
        return;
      }

      // 处理Del键 - 删除
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedCardId) {
          deleteCards(selectedCardId);
        } else if (selectedConnectionIds.length > 0) {
          handleConnectionsDelete({ selected: true });
        }
        return;
      }

      // 方向键移动卡片
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedCardId) {
        const step = e.shiftKey ? 10 : 1;
        let deltaX = 0;
        let deltaY = 0;
        
        if (e.ctrlKey || e.metaKey) {
          // 选择方向卡片
          e.preventDefault();
          if (e.key === 'ArrowUp') selectNearestCard('up');
          if (e.key === 'ArrowDown') selectNearestCard('down');
          if (e.key === 'ArrowLeft') selectNearestCard('left');
          if (e.key === 'ArrowRight') selectNearestCard('right');
          return;
        }
        
        if (e.altKey) {
          // 创建连接的卡片
          e.preventDefault();
          if (e.key === 'ArrowUp') createConnectedCard('up');
          if (e.key === 'ArrowDown') createConnectedCard('down');
          if (e.key === 'ArrowLeft') createConnectedCard('left');
          if (e.key === 'ArrowRight') createConnectedCard('right');
          return;
        }
        
        // 普通方向键移动卡片
        e.preventDefault();
        if (e.key === 'ArrowUp') deltaY = -step;
        if (e.key === 'ArrowDown') deltaY = step;
        if (e.key === 'ArrowLeft') deltaX = -step;
        if (e.key === 'ArrowRight') deltaX = step;
        
        // 开始连续移动
        if (deltaX !== 0 || deltaY !== 0) {
          startContinuousMove(deltaX, deltaY, e.shiftKey);
        }
        return;
      }

      // 处理复制粘贴和其他快捷键
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            return;
          case 'y':
            e.preventDefault();
            handleRedo();
            return;
          case 'v':
            // 粘贴由浏览器自身的事件处理，这里不需要特殊处理
            return;
          case 's':
            e.preventDefault();
            saveMindMap();
            return;
          case 'o':
            e.preventDefault();
            loadMindMap();
            return;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setTabPressed(false);
      }
      
      // 停止连续移动
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        stopContinuousMove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    selectedCardId, 
    editingCardId, 
    editingConnectionId,
    setEditingCardId,
    moveCard,
    selectNextCard,
    selectNearestCard,
    startContinuousMove,
    stopContinuousMove,
    createConnectedCard,
    tabPressed,
    setTabPressed,
    selectedConnectionIds,
    deleteCards,
    handleConnectionsDelete,
    handleUndo,
    handleRedo,
    saveMindMap,
    loadMindMap
  ]);

  return null; // 这是一个逻辑组件，不渲染任何内容
};

export default MindMapContextKeyboardHandler;
