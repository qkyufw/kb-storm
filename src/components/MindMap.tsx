import React, { useState, useEffect, useRef } from 'react';
import '../styles/MindMap.css';

// 导入组件，确保与实际文件名匹配
import Card from './Card';
import Connection from './Connection';
import HelpModal from './HelpModal';
import KeyBindingModal from './KeyBindingModal';

// 定义快捷键配置接口
interface IKeyBindings {
  newCard: string;
  editCard: string;
  deleteCard: string;
  startConnection: string;
  nextCard: string;
  prevCard: string;
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
  zoomIn: string;
  zoomOut: string;
  resetView: string;
  save: string;
  load: string;
  help: string;
  showKeyBindings: string;
}

// 定义卡片和连线的接口
interface ICard {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface IConnection {
  id: string;
  startCardId: string;
  endCardId: string;
  label?: string;
}

const MindMap: React.FC = () => {
  // 状态管理
  const [cards, setCards] = useState<ICard[]>([]);
  const [connections, setConnections] = useState<IConnection[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<boolean>(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [showKeyBindings, setShowKeyBindings] = useState<boolean>(false);
  
  // 默认快捷键绑定
  const [keyBindings, setKeyBindings] = useState<IKeyBindings>({
    newCard: 'n',          // Ctrl + N
    editCard: 'Enter',
    deleteCard: 'Delete',
    startConnection: 'c',
    nextCard: 'Tab',
    prevCard: 'Tab',       // Shift + Tab
    moveUp: 'ArrowUp',
    moveDown: 'ArrowDown',
    moveLeft: 'ArrowLeft',
    moveRight: 'ArrowRight',
    zoomIn: '+',           // Ctrl + +
    zoomOut: '-',          // Ctrl + -
    resetView: ' ',        // Ctrl + Space
    save: 's',             // Ctrl + S
    load: 'o',             // Ctrl + O
    help: '?',
    showKeyBindings: 'k'   // Ctrl + K
  });
  
  // 加载保存的快捷键配置
  useEffect(() => {
    const savedBindings = localStorage.getItem('mindmap-keybindings');
    if (savedBindings) {
      try {
        setKeyBindings(JSON.parse(savedBindings));
      } catch (e) {
        console.warn('无法解析已保存的快捷键配置');
      }
    }
  }, []);
  
  // 保存快捷键配置
  const saveKeyBindings = (newBindings: IKeyBindings) => {
    setKeyBindings(newBindings);
    localStorage.setItem('mindmap-keybindings', JSON.stringify(newBindings));
  };
  
  const mapRef = useRef<HTMLDivElement>(null);
  
  // 新增状态用于记录卡片位置布局
  const [lastCardPosition, setLastCardPosition] = useState<{ x: number, y: number }>({ x: 100, y: 100 });

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 显示帮助
      if (event.key === keyBindings.help) {
        setShowHelp(prev => !prev);
        return;
      }
      
      // 显示快捷键设置
      if (event.key === keyBindings.showKeyBindings && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        setShowKeyBindings(prev => !prev);
        return;
      }
      
      // 提升新建卡片的优先级，即使在编辑状态也可以保存并创建新卡片
      if (event.key === keyBindings.newCard && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if (editingCardId) {
          setEditingCardId(null); // 先保存当前编辑
        }
        createNewCard();
        return;
      }
      
      // 如果正在编辑卡片内容，不处理除了上面处理的快捷键以外的其他快捷键
      if (editingCardId) {
        return;
      }
      
      // 如果显示帮助或快捷键设置，不处理除了Escape以外的快捷键
      if ((showHelp || showKeyBindings) && event.key === 'Escape') {
        setShowHelp(false);
        setShowKeyBindings(false);
        return;
      }
      
      // 避免与浏览器冲突的快捷键
      if (
        (event.key === keyBindings.newCard && (event.ctrlKey || event.metaKey)) ||
        (event.key === keyBindings.save && (event.ctrlKey || event.metaKey)) ||
        (event.key === keyBindings.load && (event.ctrlKey || event.metaKey)) ||
        (event.key === keyBindings.resetView && (event.ctrlKey || event.metaKey)) ||
        (event.key === keyBindings.zoomIn && (event.ctrlKey || event.metaKey)) ||
        (event.key === keyBindings.zoomOut && (event.ctrlKey || event.metaKey)) ||
        event.key === keyBindings.nextCard
      ) {
        event.preventDefault();
      }
      
      switch (event.key) {
        // 删除新建卡片的处理，已在上面特殊处理
        
        case keyBindings.editCard: // 编辑选中的卡片
          if (selectedCardId) {
            setEditingCardId(selectedCardId);
          }
          break;
          
        case 'Escape': // 退出编辑模式或连线模式
          if (editingCardId) {
            setEditingCardId(null);
          } else if (connectionMode) {
            setConnectionMode(false);
            setConnectionStart(null);
          } else {
            setSelectedCardId(null);
          }
          break;
          
        case keyBindings.deleteCard: // 删除选中的卡片或连线
        case 'Backspace':
          if (selectedCardId) {
            deleteCard(selectedCardId);
          }
          break;
          
        case keyBindings.startConnection: // 开始连线模式
          if (selectedCardId && !connectionMode) {
            setConnectionMode(true);
            setConnectionStart(selectedCardId);
          }
          break;
          
        case keyBindings.nextCard: // 在卡片之间切换
          if (cards.length > 0) {
            selectNextCard(event.shiftKey);
          }
          break;
          
        // 移动卡片
        case keyBindings.moveUp:
          if (selectedCardId) {
            event.preventDefault(); // 防止页面滚动
            startContinuousMove(0, -1, event.shiftKey);
          }
          break;
        case keyBindings.moveDown:
          if (selectedCardId) {
            event.preventDefault();
            startContinuousMove(0, 1, event.shiftKey);
          }
          break;
        case keyBindings.moveLeft:
          if (selectedCardId) {
            event.preventDefault();
            startContinuousMove(-1, 0, event.shiftKey);
          }
          break;
        case keyBindings.moveRight:
          if (selectedCardId) {
            event.preventDefault();
            startContinuousMove(1, 0, event.shiftKey);
          }
          break;
          
        // 缩放
        case keyBindings.zoomIn:
          if (event.ctrlKey || event.metaKey) {
            setZoomLevel(prev => Math.min(prev + 0.1, 2));
          }
          break;
        case keyBindings.zoomOut:
          if (event.ctrlKey || event.metaKey) {
            setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
          }
          break;
        
        // 其他辅助按键
        case keyBindings.resetView: // 空格开始平移模式
          if (event.ctrlKey || event.metaKey) {
            // 此处可以实现平移功能或者恢复视图
            setPan({ x: 0, y: 0 });
          }
          break;
          
        case keyBindings.save: // 保存
          if (event.ctrlKey || event.metaKey) {
            saveMindMap();
          }
          break;
          
        case keyBindings.load: // 打开
          if (event.ctrlKey || event.metaKey) {
            loadMindMap();
          }
          break;
      }
    };
    
    // 添加按键抬起事件处理
    const handleKeyUp = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        stopContinuousMove();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      stopContinuousMove(); // 清理定时器
    };
  }, [selectedCardId, editingCardId, cards, connectionMode, connectionStart, keyBindings, showHelp, showKeyBindings]);
  
  // 创建新卡片
  const createNewCard = () => {
    // 计算新卡片的位置，避免堆叠
    // 在画布可视区域内以网格方式布局
    const gridSize = 180; // 网格大小
    const mapWidth = mapRef.current?.clientWidth || 800;
    const mapHeight = mapRef.current?.clientHeight || 600;
    
    // 计算可以放置多少列
    const columns = Math.floor(mapWidth / gridSize);
    
    let { x, y } = lastCardPosition;
    
    // 移动到下一个网格位置
    x += gridSize;
    
    // 如果到达边界，换行
    if (x > mapWidth - gridSize) {
      x = 100;
      y += gridSize;
    }
    
    // 如果已经填满了可视区域，重新从左上角开始
    if (y > mapHeight - gridSize) {
      x = 100;
      y = 100;
    }
    
    // 生成一个随机偏移，让卡片看起来不那么规则
    const offsetX = Math.random() * 30 - 15;
    const offsetY = Math.random() * 30 - 15;
    
    // 更新最后一张卡片的位置
    setLastCardPosition({ x, y });
    
    const newCard: ICard = {
      id: `card-${Date.now()}`,
      content: '新建卡片',
      x: x + offsetX,
      y: y + offsetY,
      width: 160, // 增加默认宽度
      height: 80, // 增加默认高度
      color: getRandomColor(),
    };
    
    setCards(prev => [...prev, newCard]);
    setSelectedCardId(newCard.id);
    setEditingCardId(newCard.id);
  };
  
  // 删除卡片
  const deleteCard = (cardId: string) => {
    setCards(prev => prev.filter(card => card.id !== cardId));
    setConnections(prev => prev.filter(
      conn => conn.startCardId !== cardId && conn.endCardId !== cardId
    ));
    if (selectedCardId === cardId) {
      setSelectedCardId(null);
    }
  };
  
  // 移动选中的卡片 - 修复方向键问题并优化大幅移动
  const moveSelectedCard = (deltaX: number, deltaY: number, isLargeStep: boolean) => {
    // 设置更大的步长，使移动更平滑
    const step = isLargeStep ? 30 : 10;
    
    setCards(prev => prev.map(card => {
      if (card.id === selectedCardId) {
        return {
          ...card,
          x: card.x + (deltaX * step), // 直接使用方向和步长相乘
          y: card.y + (deltaY * step)  // 直接使用方向和步长相乘
        };
      }
      return card;
    }));
  };
  
  // 添加平滑移动功能
  const [moveInterval, setMoveInterval] = useState<NodeJS.Timeout | null>(null);
  
  // 开始持续移动
  const startContinuousMove = (deltaX: number, deltaY: number, isLargeStep: boolean) => {
    // 先清除可能存在的定时器
    if (moveInterval) {
      clearInterval(moveInterval);
    }
    
    // 首先执行一次移动，避免延迟感
    moveSelectedCard(deltaX, deltaY, isLargeStep);
    
    // 设置连续移动
    const interval = setInterval(() => {
      moveSelectedCard(deltaX, deltaY, isLargeStep);
    }, 100); // 每100ms移动一次
    
    setMoveInterval(interval);
  };
  
  // 停止持续移动
  const stopContinuousMove = () => {
    if (moveInterval) {
      clearInterval(moveInterval);
      setMoveInterval(null);
    }
  };
  
  // 选择下一个卡片
  const selectNextCard = (reverse: boolean = false) => {
    if (cards.length === 0) return;
    
    const currentIndex = selectedCardId 
      ? cards.findIndex(card => card.id === selectedCardId) 
      : -1;
    
    let nextIndex;
    if (reverse) {
      nextIndex = currentIndex <= 0 ? cards.length - 1 : currentIndex - 1;
    } else {
      nextIndex = (currentIndex + 1) % cards.length;
    }
    
    setSelectedCardId(cards[nextIndex].id);
  };
  
  // 创建连线
  const createConnection = (endCardId: string) => {
    if (!connectionStart || connectionStart === endCardId) return;
    
    const newConnection: IConnection = {
      id: `conn-${Date.now()}`,
      startCardId: connectionStart,
      endCardId: endCardId,
    };
    
    setConnections(prev => [...prev, newConnection]);
    setConnectionMode(false);
    setConnectionStart(null);
  };
  
  // 保存思维导图
  const saveMindMap = () => {
    const data = { cards, connections };
    localStorage.setItem('mindmap-data', JSON.stringify(data));
    alert('思维导图已保存');
  };
  
  // 加载思维导图
  const loadMindMap = () => {
    const savedData = localStorage.getItem('mindmap-data');
    if (savedData) {
      const data = JSON.parse(savedData);
      setCards(data.cards || []);
      setConnections(data.connections || []);
      setSelectedCardId(null);
      alert('思维导图已加载');
    } else {
      alert('未找到已保存的思维导图');
    }
  };
  
  // 辅助函数：生成随机颜色
  const getRandomColor = () => {
    const colors = ['#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff', '#ccffff'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // 帮助信息生成函数
  const getHelpText = () => {
    return [
      { key: `Ctrl+${keyBindings.newCard.toUpperCase()}`, desc: '创建新卡片' },
      { key: keyBindings.editCard, desc: '编辑选中的卡片' },
      { key: 'Ctrl+Enter', desc: '完成编辑' },
      { key: 'Esc', desc: '取消编辑/连线/取消选择' },
      { key: keyBindings.nextCard, desc: '在卡片间切换' },
      { key: `Shift+${keyBindings.nextCard}`, desc: '反向切换卡片' },
      { key: '方向键', desc: '移动选中的卡片' },
      { key: 'Shift+方向键', desc: '大幅移动选中的卡片' },
      { key: keyBindings.deleteCard, desc: '删除选中的卡片' },
      { key: keyBindings.startConnection, desc: '开始连线模式' },
      { key: `Ctrl+${keyBindings.zoomIn}`, desc: '放大视图' },
      { key: `Ctrl+${keyBindings.zoomOut}`, desc: '缩小视图' },
      { key: `Ctrl+${keyBindings.resetView}`, desc: '重置视图位置' },
      { key: `Ctrl+${keyBindings.save}`, desc: '保存思维导图' },
      { key: `Ctrl+${keyBindings.load}`, desc: '加载思维导图' },
      { key: keyBindings.help, desc: '显示/隐藏帮助' },
      { key: `Ctrl+${keyBindings.showKeyBindings}`, desc: '自定义快捷键' },
    ];
  };
  
  // 确保组件卸载时清除定时器
  useEffect(() => {
    return () => {
      stopContinuousMove();
    };
  }, []);
  
  return (
    <div className="mind-map-container">
      <div className="toolbar">
        <button onClick={createNewCard}>新建卡片 (Ctrl+{keyBindings.newCard.toUpperCase()})</button>
        <button onClick={saveMindMap}>保存 (Ctrl+{keyBindings.save.toUpperCase()})</button>
        <button onClick={loadMindMap}>加载 (Ctrl+{keyBindings.load.toUpperCase()})</button>
        <button onClick={() => setShowHelp(true)}>帮助 ({keyBindings.help})</button>
        <button onClick={() => setShowKeyBindings(true)}>快捷键设置 (Ctrl+{keyBindings.showKeyBindings.toUpperCase()})</button>
        <div className="zoom-controls">
          <button onClick={() => setZoomLevel(prev => Math.max(prev - 0.1, 0.5))}>-</button>
          <span>{Math.round(zoomLevel * 100)}%</span>
          <button onClick={() => setZoomLevel(prev => Math.min(prev + 0.1, 2))}>+</button>
        </div>
      </div>
      
      <div 
        ref={mapRef}
        className="mind-map"
        style={{
          transform: `scale(${zoomLevel}) translate(${pan.x}px, ${pan.y}px)`,
        }}
      >
        {connections.map(connection => (
          <Connection
            key={connection.id}
            connection={connection}
            cards={cards}
          />
        ))}
        
        {cards.map(card => (
          <Card
            key={card.id}
            card={card}
            isSelected={selectedCardId === card.id}
            isEditing={editingCardId === card.id}
            onClick={() => {
              if (connectionMode) {
                createConnection(card.id);
              } else {
                setSelectedCardId(card.id);
              }
            }}
            onContentChange={(content: string) => {
              setCards(prev => prev.map(c => 
                c.id === card.id ? { ...c, content } : c
              ));
            }}
            onEditComplete={() => setEditingCardId(null)}
          />
        ))}
      </div>
      
      {showHelp && <HelpModal helpItems={getHelpText()} onClose={() => setShowHelp(false)} />}
      
      {showKeyBindings && (
        <KeyBindingModal
          keyBindings={keyBindings}
          onSave={saveKeyBindings}
          onClose={() => setShowKeyBindings(false)}
        />
      )}
      
      {connectionMode && (
        <div className="connection-mode-indicator">
          连线模式: 请选择目标卡片，ESC取消
        </div>
      )}
    </div>
  );
};

export default MindMap;
