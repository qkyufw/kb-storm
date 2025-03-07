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
      
      // 如果正在编辑卡片内容，不处理除了Escape以外的快捷键
      if (editingCardId && event.key !== 'Escape') {
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
        case keyBindings.newCard: // 新建卡片
          if (event.ctrlKey || event.metaKey) {
            createNewCard();
          }
          break;
          
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
          if (selectedCardId) moveSelectedCard(0, -10, event.shiftKey);
          break;
        case keyBindings.moveDown:
          if (selectedCardId) moveSelectedCard(0, 10, event.shiftKey);
          break;
        case keyBindings.moveLeft:
          if (selectedCardId) moveSelectedCard(-10, 0, event.shiftKey);
          break;
        case keyBindings.moveRight:
          if (selectedCardId) moveSelectedCard(10, 0, event.shiftKey);
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
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCardId, editingCardId, cards, connectionMode, connectionStart, keyBindings, showHelp, showKeyBindings]);
  
  // 创建新卡片
  const createNewCard = () => {
    const newCard: ICard = {
      id: `card-${Date.now()}`,
      content: '新建卡片',
      x: 100 + Math.random() * 100,
      y: 100 + Math.random() * 100,
      width: 120,
      height: 50,
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
  
  // 移动选中的卡片
  const moveSelectedCard = (deltaX: number, deltaY: number, isLargeStep: boolean) => {
    const step = isLargeStep ? 20 : 5;
    setCards(prev => prev.map(card => {
      if (card.id === selectedCardId) {
        return {
          ...card,
          x: card.x + deltaX * (deltaX ? step / deltaX : 0),
          y: card.y + deltaY * (deltaY ? step / deltaY : 0)
        };
      }
      return card;
    }));
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
