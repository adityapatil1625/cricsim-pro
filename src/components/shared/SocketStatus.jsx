// src/components/shared/SocketStatus.jsx
import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

/**
 * SocketStatus - Visual indicator for WebSocket connection status
 * Shows connection state, reconnection attempts, and errors
 */
const SocketStatus = () => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setIsReconnecting(false);
      setReconnectAttempt(0);
      setError(null);
    }

    function onDisconnect(reason) {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        setError('Server disconnected. Refresh to reconnect.');
      }
    }

    function onConnectError(err) {
      setError(err.message);
    }

    function onReconnectAttempt(attempt) {
      setIsReconnecting(true);
      setReconnectAttempt(attempt);
    }

    function onReconnect() {
      setIsReconnecting(false);
      setReconnectAttempt(0);
    }

    function onReconnectFailed() {
      setIsReconnecting(false);
      setError('Connection failed. Please refresh the page.');
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect', onReconnect);
    socket.io.on('reconnect_failed', onReconnectFailed);

    // Set initial state
    setIsConnected(socket.connected);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect', onReconnect);
      socket.io.off('reconnect_failed', onReconnectFailed);
    };
  }, []);

  // Don't show anything if connected and no errors
  if (isConnected && !error && !isReconnecting) {
    return null;
  }

  const getStatusColor = () => {
    if (error) return 'bg-red-500';
    if (isReconnecting) return 'bg-yellow-500';
    if (isConnected) return 'bg-green-500';
    return 'bg-gray-500';
  };

  const getStatusText = () => {
    if (error) return 'Connection Error';
    if (isReconnecting) return `Reconnecting... (${reconnectAttempt})`;
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl p-3 min-w-[200px] cursor-pointer hover:scale-105 transition-transform"
        onClick={() => setShowDetails(!showDetails)}
      >
        {/* Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}>
              {isReconnecting && (
                <div className={`absolute inset-0 rounded-full ${getStatusColor()} animate-ping opacity-75`}></div>
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {getStatusText()}
            </p>
            {error && (
              <p className="text-xs text-red-300 mt-1">
                {error}
              </p>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <svg 
            className={`w-4 h-4 text-slate-400 transition-transform ${showDetails ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Detailed Info */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-slate-700">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Socket ID:</span>
                <span className="text-slate-200 font-mono">
                  {socket.id ? socket.id.slice(0, 8) : 'N/A'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Transport:</span>
                <span className="text-slate-200">
                  {socket.io.engine?.transport?.name || 'N/A'}
                </span>
              </div>

              {isReconnecting && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Attempt:</span>
                  <span className="text-yellow-300">
                    {reconnectAttempt} / {socket.io.opts.reconnectionAttempts}
                  </span>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            {error && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.reload();
                }}
                className="mt-3 w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded transition-colors"
              >
                Refresh Page
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocketStatus;
