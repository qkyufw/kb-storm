import { IKeyBindings } from '../../types/CoreTypes';

interface HelpItem {
  key: string;
  desc: string;
}

// 根据当前键绑定生成帮助文本
export const generateHelpText = (keyBindings: IKeyBindings): HelpItem[] => {
  return [
    { key: `Ctrl+${keyBindings.newCard ? keyBindings.newCard.toUpperCase() : '未设置'}`, desc: '创建新卡片' }, // 修改为 Ctrl+D
    { key: keyBindings.editCard || '未设置', desc: '编辑选中的卡片' },
    { key: 'Ctrl+Enter', desc: '完成编辑' },
    { key: 'Esc', desc: '取消编辑/连线/取消选择' },
    { key: keyBindings.nextCard || '未设置', desc: '在卡片间切换' },
    { key: `Shift+${keyBindings.nextCard || '未设置'}`, desc: '反向切换卡片' },
    { key: `Tab+方向键`, desc: '按方向选择最近的卡片' },
    { key: keyBindings.moveUp || '未设置', desc: '向上移动选中的卡片' },
    { key: keyBindings.moveDown || '未设置', desc: '向下移动选中的卡片' },
    { key: keyBindings.moveLeft || '未设置', desc: '向左移动选中的卡片' },
    { key: keyBindings.moveRight || '未设置', desc: '向右移动选中的卡片' },
    { key: `Shift+方向键`, desc: '大幅移动选中的卡片' },
    { key: `Ctrl+方向键`, desc: '在指定方向创建连线和卡片' },
    { key: keyBindings.deleteCards || '未设置', desc: '删除选中的卡片' },
    { key: `Ctrl+${keyBindings.startConnection ? keyBindings.startConnection.toUpperCase() : '未设置'}`, desc: '开始连线模式' }, // 修改为 Ctrl+I
    { key: `Ctrl+${keyBindings.zoomIn ? keyBindings.zoomIn.toUpperCase() : '未设置'}`, desc: '放大视图' },
    { key: `Ctrl+${keyBindings.zoomOut ? keyBindings.zoomOut.toUpperCase() : '未设置'}`, desc: '缩小视图' },
    { key: `Ctrl+${keyBindings.resetView ? keyBindings.resetView.toUpperCase() : '未设置'}`, desc: '重置视图位置' },
    { key: `Ctrl+${keyBindings.copy ? keyBindings.copy.toUpperCase() : '未设置'}`, desc: '复制选中内容' },
    { key: `Ctrl+${keyBindings.cut ? keyBindings.cut.toUpperCase() : '未设置'}`, desc: '剪切选中内容' },
    { key: `Ctrl+${keyBindings.paste ? keyBindings.paste.toUpperCase() : '未设置'}`, desc: '粘贴内容' },
    { key: `Ctrl+${keyBindings.undo ? keyBindings.undo.toUpperCase() : '未设置'}`, desc: '撤销' },
    { key: `Ctrl+Shift+${keyBindings.redo ? keyBindings.redo.toUpperCase() : '未设置'}`, desc: '重做' },
    { key: `Ctrl+${keyBindings.selectAll ? keyBindings.selectAll.toUpperCase() : '未设置'}`, desc: '全选' },
    { key: `Ctrl+${keyBindings.save ? keyBindings.save.toUpperCase() : '未设置'}`, desc: '保存思维导图' },
    { key: `Ctrl+${keyBindings.load ? keyBindings.load.toUpperCase() : '未设置'}`, desc: '加载思维导图' },
    { key: keyBindings.help || '未设置', desc: '显示/隐藏帮助' },
    { key: `Ctrl+${keyBindings.showKeyBindings ? keyBindings.showKeyBindings.toUpperCase() : '未设置'}`, desc: '自定义快捷键' },
    { key: 'Tab+空格', desc: '切换卡片/连接线选择模式' },
  ];
};

// 分组帮助文本
export const groupHelpItems = (helpItems: HelpItem[]): Record<string, HelpItem[]> => {
  const groups: Record<string, HelpItem[]> = {
    '卡片操作': [],
    '导航': [],
    '编辑': [],
    '视图': [],
    '其他': []
  };
  
  helpItems.forEach(item => {
    if (item.desc.includes('创建') || item.desc.includes('删除') || item.desc.includes('编辑')) {
      groups['卡片操作'].push(item);
    } else if (item.desc.includes('选择') || item.desc.includes('切换') || item.desc.includes('移动')) {
      groups['导航'].push(item);
    } else if (item.desc.includes('撤销') || item.desc.includes('重做') || item.desc.includes('保存') || item.desc.includes('加载')) {
      groups['编辑'].push(item);
    } else if (item.desc.includes('放大') || item.desc.includes('缩小') || item.desc.includes('视图')) {
      groups['视图'].push(item);
    } else {
      groups['其他'].push(item);
    }
  });
  
  return groups;
};

export default { generateHelpText, groupHelpItems };
