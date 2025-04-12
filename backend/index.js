import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../frontend/src/App';
import '../frontend/src/styles.css';

const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);