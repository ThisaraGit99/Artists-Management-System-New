import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css'; // Updated Ant Design CSS import
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import App from './App';

// Add Font Awesome for icons
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
document.head.appendChild(link);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 