import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center">
        {/* Error Image */}
        <div className="mb-8">
          <img
            src="/404_error.png"
            alt="404 - Property Not Found"
            className="w-full max-w-lg mx-auto"
          />
        </div>

        {/* Error Message */}
        <h1 className="text-4xl md:text-5xl font-black text-text-primary mb-4">
          404 - Page Not Found
        </h1>
        <p className="text-lg text-text-secondary mb-8 max-w-md mx-auto">
          Oops! The property you're looking for doesn't exist. It might have been moved or deleted.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all"
          >
            <Home className="h-5 w-5" />
            Go Home
          </Link>
          <Link
            to="/analyze"
            className="flex items-center gap-2 px-6 py-3 bg-surface border border-border text-text-primary rounded-xl font-bold hover:border-brand-primary hover:bg-brand-primary/5 transition-all"
          >
            <Search className="h-5 w-5" />
            Analyze Property
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-12 p-6 bg-surface border border-border rounded-xl">
          <h3 className="text-sm font-bold text-text-primary mb-2">Need Help?</h3>
          <p className="text-xs text-text-secondary">
            If you believe this is an error, please contact our support team or try searching for
            properties from the home page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
