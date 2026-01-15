import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-3xl w-full text-center">
            {/* Error Image */}
            <div className="mb-8">
              <img
                src="/general_error.png"
                alt="Something went wrong"
                className="w-full max-w-lg mx-auto"
              />
            </div>

            {/* Error Message */}
            <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-4">
              Oops! Something Went Wrong
            </h1>
            <p className="text-lg text-text-secondary mb-8 max-w-md mx-auto">
              The application encountered an unexpected error. Don't worry, we've logged this issue.
            </p>

            {/* Error Details (Collapsible) */}
            <details className="mb-8 text-left">
              <summary className="cursor-pointer text-sm font-bold text-text-secondary hover:text-text-primary transition-colors mb-4">
                Show Technical Details
              </summary>
              <div className="bg-surface border border-border p-4 rounded-xl overflow-auto max-h-60 text-sm font-mono">
                <p className="font-bold text-red-500 dark:text-red-400 mb-2">
                  {this.state.error?.toString()}
                </p>
                <pre className="text-text-secondary whitespace-pre-wrap text-xs">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            </details>

            {/* Action Button */}
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2 mx-auto"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reload Application
            </button>

            {/* Help Text */}
            <div className="mt-8 p-4 bg-surface border border-border rounded-xl">
              <p className="text-xs text-text-secondary">
                If this problem persists, try clearing your browser cache or contact support.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
