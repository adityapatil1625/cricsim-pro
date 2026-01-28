import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/shared/ErrorBoundary';
import SocketStatus from './components/shared/SocketStatus';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <SocketStatus />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
