import { ReportHandler } from 'web-vitals';

// 收集性能指标
const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry); // 页面内容意外移动的频率
      getFID(onPerfEntry); // 衡量用户交互延迟
      getFCP(onPerfEntry); // 加载性能
      getLCP(onPerfEntry); // 加载性能
      getTTFB(onPerfEntry); // 衡量服务器响应时间
    });
  }
};

export default reportWebVitals;
