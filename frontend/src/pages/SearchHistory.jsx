import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, TrendingUp, ExternalLink, Image as ImageIcon, DollarSign, Calendar, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SearchHistory = () => {
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSearchHistory();
  }, []);

  const fetchSearchHistory = async () => {
    try {
      const response = await fetch('/api/search');
      if (response.ok) {
        const data = await response.json();
        setSearches(data);
      }
    } catch (error) {
      console.error('Failed to fetch search history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (location) => {
    navigate('/analyze', { state: { query: location } });
  };

  const getRiskColor = (score) => {
    if (!score) return 'text-gray-400';
    if (score > 70) return 'text-red-500';
    if (score > 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskBadge = (score) => {
    if (!score) return { text: 'N/A', bg: 'bg-gray-100 dark:bg-gray-800' };
    if (score > 70) return { text: 'High Risk', bg: 'bg-red-100 dark:bg-red-900/20 text-red-600' };
    if (score > 40) return { text: 'Medium Risk', bg: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600' };
    return { text: 'Low Risk', bg: 'bg-green-100 dark:bg-green-900/20 text-green-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-brand-primary/10 rounded-xl">
              <Clock className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-text-primary">Search History</h1>
              <p className="text-sm text-text-secondary">View your past property searches and analysis</p>
            </div>
          </div>
        </div>

        {/* Search Grid */}
        {searches.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="h-16 w-16 text-text-secondary/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No Search History</h3>
            <p className="text-text-secondary mb-6">Start analyzing properties to build your search history</p>
            <button
              onClick={() => navigate('/analyze')}
              className="px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all"
            >
              Start Analyzing
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searches.map((search, index) => {
              const riskBadge = getRiskBadge(search.risk_score);
              const searchData = search.search_data || {};
              
              return (
                <motion.div
                  key={search.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-xl hover:border-brand-primary/40 transition-all group"
                >
                  {/* Image/Thumbnail */}
                  <div className="relative h-48 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 overflow-hidden">
                    {searchData.image ? (
                      <img 
                        src={searchData.image} 
                        alt={search.location_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ImageIcon className="h-16 w-16 text-text-secondary/20" />
                      </div>
                    )}
                    
                    {/* Risk Badge Overlay */}
                    {search.risk_score && (
                      <div className="absolute top-3 right-3">
                        <div className={`px-3 py-1.5 rounded-lg ${riskBadge.bg} backdrop-blur-sm text-xs font-bold`}>
                          {search.risk_score}% Risk
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Location */}
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="h-5 w-5 text-brand-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-text-primary text-lg truncate">
                          {search.location_name || 'Unknown Location'}
                        </h3>
                        {(search.city || search.state) && (
                          <p className="text-xs text-text-secondary">
                            {[search.city, search.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {/* Land Value */}
                      {searchData.land_value && (
                        <div className="flex items-center gap-2 p-2 bg-surface-elevated rounded-lg">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-xs text-text-secondary">Value</p>
                            <p className="text-sm font-bold text-text-primary">{searchData.land_value}</p>
                          </div>
                        </div>
                      )}

                      {/* Risk Status */}
                      <div className="flex items-center gap-2 p-2 bg-surface-elevated rounded-lg">
                        <TrendingUp className={`h-4 w-4 ${getRiskColor(search.risk_score)}`} />
                        <div>
                          <p className="text-xs text-text-secondary">Status</p>
                          <p className="text-sm font-bold text-text-primary">{riskBadge.text}</p>
                        </div>
                      </div>
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-text-secondary mb-4">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {search.created_at 
                          ? new Date(search.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Unknown date'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(search.location_name)}
                        className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-bold hover:bg-brand-primary/90 transition-all flex items-center justify-center gap-2"
                      >
                        View Analysis
                        <ExternalLink className="h-3 w-3" />
                      </button>
                      
                      {searchData.website && (
                        <a
                          href={searchData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-surface-elevated border border-border rounded-lg text-sm font-bold text-brand-primary hover:bg-brand-primary/10 transition-all flex items-center gap-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>

                    {/* Additional Data Preview */}
                    {searchData.notes && (
                      <div className="mt-3 p-3 bg-surface-elevated rounded-lg">
                        <p className="text-xs text-text-secondary line-clamp-2">
                          {searchData.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchHistory;
