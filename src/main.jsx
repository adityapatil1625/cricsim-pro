import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import AuthPage from './pages/AuthPage';
import UserProfile from './pages/UserProfile';
import ErrorBoundary from './components/shared/ErrorBoundary';
import SocketStatus from './components/shared/SocketStatus';
import authService from './services/authService';
import './index.css';

/**
 * ProtectedRoute - Ensures only authenticated users can access certain routes
 */
const ProtectedRoute = ({ children }) => {
  const user = authService.getCurrentUser();
  return user ? children : <Navigate to="/auth" replace />;
};

/**
 * Root App with Authentication Integration
 */
const RootApp = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/auth" element={<AuthPage />} />
      
      {/* Protected routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      
      {/* Main app routes - protected */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <RootApp />
        <SocketStatus />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
