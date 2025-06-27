import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// 初始化i18n
import './i18n';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <div className="App">
      <App />
    </div>
  </React.StrictMode>
);