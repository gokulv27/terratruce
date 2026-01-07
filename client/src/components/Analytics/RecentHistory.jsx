import React, { useState } from 'react';
import { Clock, MapPin, ArrowRight, Trash2, Search, Sparkles } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useAnalysis } from '../../context/AnalysisContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const RecentHistory = ({ fullWidth = false }) => {
  const { user } = useAuth();
  const { history, clearHistory: contextClearHistory, historyLoading } = useAnalysis();
  const navigate = useNavigate();

  const handleHistoryClick = (item) => {
    navigate('/analyze', { state: { query: item.location_name } });
  };

  const handleClearHistory = async () => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to clear your search history?')) return;
    await contextClearHistory();
  };

  if (!user) return null;

  return (
    <div className={`${fullWidth ? 'w-full' : 'max-w-7xl mx-auto px-4 md:px-8'} mt-8 mb-8`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary">Search History</h3>
            <p className="text-xs text-text-secondary">
              Your recent property analyses and locations
            </p>
          </div>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear All
          </button>
        )}
      </div>

      {historyLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-surface-elevated animate-pulse rounded-2xl border border-border"
            />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="bg-surface border border-border border-dashed rounded-2xl p-12 text-center">
          <div className="h-12 w-12 bg-surface-elevated rounded-xl flex items-center justify-center mx-auto mb-4 text-text-secondary/50">
            <Search className="h-6 w-6" />
          </div>
          <p className="text-text-primary font-medium">No history yet</p>
          <p className="text-sm text-text-secondary mb-6">Search for a location to see it here.</p>
          <button
            onClick={() => navigate('/analyze')}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            Start Analyzing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {history.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleHistoryClick(item)}
                className="group bg-surface border border-border rounded-2xl p-4 hover:border-brand-primary hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-brand-primary" />
                </div>

                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${item.risk_score ? 'bg-brand-primary/10 text-brand-primary' : 'bg-surface-elevated text-text-secondary'}`}
                  >
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-text-primary truncate mb-1 pr-4">
                      {item.location_name}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-text-secondary">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      {item.risk_score !== null && (
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[10px] font-bold ${item.risk_score > 70 ? 'text-red-500' : item.risk_score > 40 ? 'text-yellow-500' : 'text-green-500'}`}
                          >
                            {item.risk_score}% Risk
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Decorator for premium feel */}
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default RecentHistory;
