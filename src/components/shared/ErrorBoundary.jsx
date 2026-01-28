import React from 'react';

/**
 * ErrorBoundary - Catch and handle React errors gracefully
 * Prevents the entire app from crashing when a component error occurs
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // You can also log to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Optionally reload the page or navigate to home
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900/90 backdrop-blur-xl rounded-2xl border-2 border-red-500/30 p-8 shadow-2xl">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg 
                  className="w-12 h-12 text-red-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-3xl font-bold text-white text-center mb-4">
              Oops! Something went wrong
            </h1>
            
            <p className="text-slate-300 text-center mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-purple-500/50"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-all duration-200"
              >
                Go to Home
              </button>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 bg-slate-950/50 rounded-lg p-4 border border-slate-700">
                <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 mb-2">
                  Show Error Details (Dev Mode)
                </summary>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-red-400 mb-1">Error:</p>
                    <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-auto bg-slate-900 p-3 rounded">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <p className="text-xs font-semibold text-red-400 mb-1">Component Stack:</p>
                      <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-auto bg-slate-900 p-3 rounded max-h-64">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
