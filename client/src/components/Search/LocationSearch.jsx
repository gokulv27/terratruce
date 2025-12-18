import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader, X } from 'lucide-react';

/**
 * Enhanced Location Search with Google-like Predictions
 * Shows suggestions after typing 5+ characters using OpenCage API
 */
const LocationSearch = ({ onLocationSelect, loading }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const searchRef = useRef(null);

    // Fetch real suggestions from OpenCage API
    useEffect(() => {
        if (query.length >= 5) {
            setLoadingSuggestions(true);

            const timer = setTimeout(async () => {
                try {
                    const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
                    const response = await fetch(
                        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=8&no_annotations=1`
                    );
                    const data = await response.json();

                    if (data.results) {
                        const formattedSuggestions = data.results.map(result => ({
                            name: result.formatted,
                            type: result.components._type || 'location',
                            lat: result.geometry.lat,
                            lng: result.geometry.lng
                        }));
                        setSuggestions(formattedSuggestions);
                        setShowSuggestions(true);
                    }
                } catch (error) {
                    console.error('Error fetching suggestions:', error);
                } finally {
                    setLoadingSuggestions(false);
                }
            }, 300);

            return () => clearTimeout(timer);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    }, [query]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectSuggestion = (location) => {
        setQuery(location.name);
        setShowSuggestions(false);
        onLocationSelect(location.name, { lat: location.lat, lng: location.lng });
    };

    const handleSearch = () => {
        if (query.trim()) {
            setShowSuggestions(false);
            onLocationSelect(query);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const clearSearch = () => {
        setQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <div ref={searchRef} className="relative w-full">
            {/* Search Input */}
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-32 py-4 bg-surface/80 border-2 border-border rounded-xl leading-5 text-text-primary placeholder-text-secondary focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 sm:text-sm transition-all shadow-lg backdrop-blur-sm hover:border-brand-primary/50"
                    placeholder="Search location (minimum 5 characters for suggestions)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                    onFocus={() => query.length >= 5 && setShowSuggestions(true)}
                />

                {/* Clear button */}
                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-24 top-1/2 -translate-y-1/2 p-2 hover:bg-surface-elevated rounded-lg transition-colors"
                    >
                        <X className="h-4 w-4 text-text-secondary hover:text-text-primary" />
                    </button>
                )}

                <button
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader className="h-4 w-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        'Analyze'
                    )}
                </button>
            </div>

            {/* Autocomplete Suggestions */}
            {showSuggestions && (suggestions.length > 0 || loadingSuggestions) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface/90 backdrop-blur-xl border-2 border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-slideDown">
                    <div className="p-2 max-h-80 overflow-y-auto custom-scrollbar">
                        {loadingSuggestions ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader className="h-5 w-5 text-brand-primary animate-spin" />
                                <span className="ml-2 text-sm text-text-secondary">Finding locations...</span>
                            </div>
                        ) : (
                            <>
                                <div className="px-3 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    Suggested Locations ({suggestions.length})
                                </div>
                                {suggestions.map((location, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectSuggestion(location)}
                                        className="w-full flex items-center gap-3 px-3 py-3 hover:bg-brand-primary/10 rounded-lg transition-colors text-left group"
                                    >
                                        <div className="p-2 bg-brand-primary/10 rounded-lg group-hover:bg-brand-primary/20 transition-colors flex-shrink-0">
                                            <MapPin className="h-4 w-4 text-brand-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-text-primary truncate">{location.name}</div>
                                            <div className="text-xs text-text-secondary capitalize">{location.type}</div>
                                        </div>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}

            <style jsx="true">{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(168, 85, 247, 0.5);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(168, 85, 247, 0.8);
        }
      `}</style>
        </div>
    );
};

export default LocationSearch;
