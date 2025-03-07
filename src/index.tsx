import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// 创建样式文件夹如果不存在
try {
  require('./styles/MindMap.css');
  require('./styles/Card.css');
  require('./styles/Connection.css');
  require('./styles/HelpModal.css');
} catch (e) {
  console.warn('样式文件可能不存在，请确保创建了相应的CSS文件');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
