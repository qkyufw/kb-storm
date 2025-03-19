const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 确保必要的依赖已安装
try {
  console.log('正在检查依赖...');
  execSync('npm list dependency-cruiser', { stdio: 'ignore' });
} catch (e) {
  console.log('正在安装 dependency-cruiser...');
  execSync('npm install --save-dev dependency-cruiser', { stdio: 'inherit' });
}

// 生成依赖配置文件
const depcruiseConfig = {
  forbidden: [],
  options: {
    doNotFollow: {
      path: 'node_modules',
      dependencyTypes: [
        'npm',
        'npm-dev',
        'npm-optional',
        'npm-peer',
        'npm-bundled',
        'npm-no-pkg'
      ]
    },
    includeOnly: '^src',
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts']
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
        theme: {
          graph: { rankdir: 'LR', splines: 'true', overlap: 'false' },
          modules: [
            { criteria: { source: '\\.tsx?$' }, attributes: { fillcolor: '#ffcccc' } },
            { criteria: { source: '\\.jsx?$' }, attributes: { fillcolor: '#ccffcc' } },
          ]
        }
      }
    }
  }
};

// 写入临时配置文件
fs.writeFileSync(
  path.join(__dirname, 'dependency-cruiser.config.js'),
  `module.exports = ${JSON.stringify(depcruiseConfig, null, 2)};`
);

// 定义输出目录
const outputDir = path.join(__dirname, '../docs');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成依赖图
console.log('正在生成依赖关系图...');
try {
  execSync(
    `npx depcruise src --include-only "^src" --config tools/dependency-cruiser.config.js --output-type dot | dot -T svg > ${path.join(outputDir, 'dependency-graph.svg')}`,
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  );
  
  // 生成简化版依赖图（仅组件和hooks）
  execSync(
    `npx depcruise src/components src/hooks --include-only "^src" --config tools/dependency-cruiser.config.js --output-type dot | dot -T svg > ${path.join(outputDir, 'components-hooks-graph.svg')}`,
    { stdio: 'inherit', cwd: path.join(__dirname, '..') }
  );

  console.log('依赖图已生成！');
  console.log(`文件位置: ${path.join(outputDir, 'dependency-graph.svg')}`);
  console.log(`简化版文件位置: ${path.join(outputDir, 'components-hooks-graph.svg')}`);
} catch (error) {
  console.error('生成依赖图时出错:', error.message);
  console.log('请确保已安装Graphviz (dot命令)。安装说明:');
  console.log('- Windows: 下载并安装 https://graphviz.org/download/');
  console.log('- macOS: brew install graphviz');
  console.log('- Linux: apt-get install graphviz 或 yum install graphviz');
}

// 清理临时配置文件
fs.unlinkSync(path.join(__dirname, 'dependency-cruiser.config.js'));
