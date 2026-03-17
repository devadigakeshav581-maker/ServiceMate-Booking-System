import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-text p-6 text-center font-epilogue">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="font-syne text-3xl font-bold mb-2 text-error">Something went wrong</h1>
          <p className="text-muted mb-6 max-w-md">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          {this.state.error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 max-w-2xl overflow-auto text-left w-full">
              <p className="text-error font-bold text-sm mb-1">Error Details:</p>
              <code className="text-red-400 text-xs font-mono break-all whitespace-pre-wrap">
                {this.state.error.toString()}
              </code>
            </div>
          )}
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-accent text-white rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-accent/20"
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;