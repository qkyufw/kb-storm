# kb-storm(键盘风暴) - 键盘驱动的智能思维画布

kb-storm (keyboard storm 取自于 brainstorm）是一个注重键盘操作的思维导图和白板工具，让您通过高效的快捷键和直观的界面，轻松组织思想、创建连接并可视化您的想法。无论是头脑风暴、项目规划还是知识管理，kb-storm 都能助您实现高效思考和协作。

本项目由代码基本由 AI 生成，作者对 React 并不太**了解**，错漏很多，主要使用工具包括 vscode（copilot），trae，trae cn，cursor。如果您对本项目有兴趣，欢迎联系 qkyufw@foxmail.com

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm start
```

## 📖 用户手册

查看 [用户手册](./MANUAL.md) 了解详细的使用说明。

## 🔧 技术栈

- React
- TypeScript
- CSS3
- HTML5

## 📖文件目录

### 1. components/

包含应用的 React UI 组件。

- **Toolbar.tsx** - 顶部工具栏
- **Card.tsx** - 思维导图卡片
- **Connection.tsx** - 连接线
- **MindMapContent.tsx** - 主画布内容
- **ModeIndicator.tsx** - 模式指示器
- **ZoomControls.tsx** - 缩放控制
- **ModalComponents.tsx** - 各种模态框组件

### 2. hooks/

自定义 React Hooks，按功能细分：

- **canvas/** - 画布相关逻辑 (useCanvas, useCanvasState, useCanvasSelection 等)
- **interaction/** - 交互相关逻辑 (useKeyboardShortcuts 等)
- **io/** - 导入/导出相关逻辑 (useMapExportImport)

### 3. store/

使用 Zustand 管理全局状态：

- **cardStore.tsx** - 卡片相关状态
- **connectionStore.tsx** - 连接线相关状态
- **UIStore.tsx** - UI 状态 (缩放、平移等)
- **historyStore.tsx** - 历史记录状态
- **clipboardStore.tsx** - 剪贴板操作
- **freeConnectionStore.tsx** - 自由连接线状态
- **exportImportStore.tsx** - 导入导出状态

### 4. styles/

CSS 样式文件，按功能区分：

- **canvas/** - 画布元素样式
- **modals/** - 模态框样式
- **toolbar/** - 工具栏样式

### 5. types/

TypeScript 类型定义：

- **CoreTypes.ts** - 核心数据类型

### 6. utils/

工具函数：

- **canvas/** - 画布相关工具 (backgroundUtils 等)
- **interactions/** - 交互工具
- **ui/** - UI 相关工具 (colors 等)
- **exportImport.ts** - 导入导出功能
- **storageUtils.ts** - 本地存储功能
- **layoutUtils.ts** - 布局算法
- **cardPositioning.ts** - 卡片定位计算

## 📄 许可证

[MIT](./LICENSE)
