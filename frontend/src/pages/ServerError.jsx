import React from 'react';
import { Link } from 'react-router-dom';
import { Home, RefreshCw, AlertTriangle } from 'lucide-react';

const ServerError = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* Error Image */}
        <div className="mb-8">
          <img src="/500_error.png" alt="500 - Server Error" className="w-full max-w-lg mx-auto" />
        </div>

        {/* Error Message */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl md:text-5xl font-black text-text-primary">500 - Server Error</h1>
        </div>
        <p className="text-lg text-text-secondary mb-8 max-w-md mx-auto">
          We're experiencing technical difficulties. Our team has been notified and is working to
          fix the issue.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleRetry}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
          >
            <RefreshCw className="h-5 w-5" />
            Retry
          </button>
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-surface border border-border text-text-primary rounded-xl font-bold hover:border-brand-primary hover:bg-brand-primary/5 transition-all"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
        </div>

        {/* Status Information */}
        <div className="mt-12 p-6 bg-surface border border-border rounded-xl text-left">
          <h3 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            What happened?
          </h3>
          <ul className="text-xs text-text-secondary space-y-2">
            <li>• The server encountered an unexpected condition</li>
            <li>• This could be a temporary issue - try refreshing the page</li>
            <li>• If the problem persists, our team is already investigating</li>
          </ul>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-text-secondary">
              <span className="font-bold">Error Code:</span> 500 Internal Server Error
            </p>
            <p className="text-xs text-text-secondary mt-1">
              <span className="font-bold">Time:</span> {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
