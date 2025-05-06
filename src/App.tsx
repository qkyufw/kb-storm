import React from 'react';
import './App.css';
import MindMap from './components/MindMapContainer';
import { MindMapProvider } from './context/MindMapContext';

function App() {
  return (
    <div className="App">
      <MindMapProvider>
        <MindMap />
      </MindMapProvider>
    </div>
  );
}

export default App;
