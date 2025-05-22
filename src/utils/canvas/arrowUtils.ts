import { ArrowType } from '../../types/CoreTypes';

/**
 * 获取箭头类型的显示名称
 */
export function getArrowTypeName(arrowType?: ArrowType): string {
  switch(arrowType) {
    case ArrowType.NONE: return '无箭头';
    case ArrowType.START: return '起点箭头';
    case ArrowType.END: return '终点箭头';
    case ArrowType.BOTH: return '双向箭头';
    default: return '无箭头';
  }
}
