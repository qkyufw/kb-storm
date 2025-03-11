// 基础类型定义
export interface IPosition {
  x: number;
  y: number;
}

export interface ISize {
  width: number;
  height: number;
}

export interface ICard {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface IConnection {
  id: string;
  startCardId: string;
  endCardId: string;
  label?: string;
}

export interface IKeyBindings {
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
  copy: string;       // 添加复制
  cut: string;        // 添加剪切
  paste: string;      // 添加粘贴
  undo: string;       // 添加撤销
  redo: string;       // 添加重做
  selectAll: string;  // 添加全选
  // 可以在这里添加新的快捷键定义
}
