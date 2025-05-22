import { ICard } from '../../types/CoreTypes';

/**
 * 计算两个卡片之间的连接线端点坐标（在卡片边缘）
 */
export function calculateConnectionPoints(startCard: ICard, endCard: ICard) {
  // 获取卡片中心点
  const startCenterX = startCard.x + startCard.width / 2;
  const startCenterY = startCard.y + startCard.height / 2;
  const endCenterX = endCard.x + endCard.width / 2;
  const endCenterY = endCard.y + endCard.height / 2;
  
  // 计算方向向量
  const dx = endCenterX - startCenterX;
  const dy = endCenterY - startCenterY;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length < 0.001) {
    return {
      startX: startCenterX,
      startY: startCenterY,
      endX: endCenterX,
      endY: endCenterY
    };
  }
  const unitDx = dx / length;
  const unitDy = dy / length;

  // 偏移量，单位像素，建议1.5~2，保证端点视觉上更贴合边缘
  const edgeOffset = 2;

  // 起点卡片的边缘交点
  let startX, startY;
  if (Math.abs(unitDx) * startCard.height > Math.abs(unitDy) * startCard.width) {
    startX = startCenterX + (unitDx > 0 ? 1 : -1) * (startCard.width / 2 + edgeOffset);
    startY = startCenterY + unitDy * (Math.abs(startCard.width / 2 + edgeOffset) / Math.abs(unitDx));
  } else {
    startY = startCenterY + (unitDy > 0 ? 1 : -1) * (startCard.height / 2 + edgeOffset);
    startX = startCenterX + unitDx * (Math.abs(startCard.height / 2 + edgeOffset) / Math.abs(unitDy));
  }

  // 终点卡片的边缘交点
  let endX, endY;
  if (Math.abs(unitDx) * endCard.height > Math.abs(unitDy) * endCard.width) {
    endX = endCenterX + (unitDx < 0 ? 1 : -1) * (endCard.width / 2 + edgeOffset);
    endY = endCenterY + unitDy * (-Math.abs(endCard.width / 2 + edgeOffset) / Math.abs(unitDx));
  } else {
    endY = endCenterY + (unitDy < 0 ? 1 : -1) * (endCard.height / 2 + edgeOffset);
    endX = endCenterX + unitDx * (-Math.abs(endCard.height / 2 + edgeOffset) / Math.abs(unitDy));
  }

  return {
    startX,
    startY,
    endX,
    endY
  };
}

/**
 * 计算两点之间的贝塞尔曲线路径
 */
export function calculateBezierPath(startX: number, startY: number, endX: number, endY: number) {
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // 控制点偏移量 - 距离越远，曲线越平滑
  // const curveFactor = distance * 0.2; // 这个因子可以调整曲线的弯曲程度
  
  // 确定控制点 - 采用水平方向控制点
  const cp1x = startX + dx * 0.3;
  const cp1y = startY + dy * 0.1;
  const cp2x = endX - dx * 0.3;
  const cp2y = endY - dy * 0.1;
  
  // 生成贝塞尔曲线路径
  return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;
}
