import { RefObject } from 'react';

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

export enum ArrowType {
  NONE = 'none',
  END = 'end',
  START = 'start',
  BOTH = 'both'
}

// 更新连接线类型，添加箭头类型
export interface IConnection {
  id: string;
  startCardId: string;
  endCardId: string;
  label?: string;
  arrowType?: ArrowType; // 新增箭头类型属性
}

export interface IKeyBindings {
  newCard: string;
  editCard: string;
  deleteCards: string;
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
  showKeyBindings: string;
  copy: string;       // 添加复制
  cut: string;        // 添加剪切
  paste: string;      // 添加粘贴
  undo: string;       // 添加撤销
  redo: string;       // 添加重做
  selectAll: string;  // 添加全选
  // 可以在这里添加新的快捷键定义
}

export type CanvasRef = RefObject<HTMLDivElement | null>;

export interface CanvasProps {
  canvasRef: CanvasRef;
  zoomLevel: number;
  pan: { x: number; y: number };
  cards: ICard[];
}

/**
 * 思维导图数据结构
 * 统一的数据类型定义，避免在多个文件中重复定义
 */
export interface MindMapData {
  cards: ICard[];
  connections: IConnection[];
}
