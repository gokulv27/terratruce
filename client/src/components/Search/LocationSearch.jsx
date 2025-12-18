import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Clock, X, Loader2 } from 'lucide-react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { getSuggestions } from '../../services/geocoding';

const LocationSearch = ({ onSearch, history = [], loading }) => {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [apiSuggestions, setApiSuggestions] = useState([]);
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
    const dropdownRef = useRef(null);
    const searchRef = useRef(null);
    const debounceTimeout = useRef(null);

    // Initial load animation for the search bar
    useGSAP(() => {
        gsap.from(searchRef.current, {
            y: -20,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out"
        });
    }, []);

    // Filter local history
    const filteredHistory = query
        ? history.filter(item => item.location_name.toLowerCase().includes(query.toLowerCase()))
        : history;

    // Handle input change
    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setShowSuggestions(true);

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        if (val.length < 3) {
            setApiSuggestions([]);
            setIsSearchingSuggestions(false);
            return;
        }

        setIsSearchingSuggestions(true);
        debounceTimeout.current = setTimeout(async () => {
            const results = await getSuggestions(val);
            setApiSuggestions(results);
            setIsSearchingSuggestions(false);
        }, 500);
    };

    const handleSelectSuggestion = (suggestion, isApi = false) => {
        const name = isApi ? suggestion.label : suggestion.name;
        const locationData = isApi ? {
            name: suggestion.label,
            lat: suggestion.geometry.lat,
            lng: suggestion.geometry.lng
        } : suggestion;

        setQuery(name);
        setShowSuggestions(false);
        onSearch(locationData);
    };

    const handleClear = () => {
        setQuery('');
        setApiSuggestions([]);
        setShowSuggestions(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && query) {
            setShowSuggestions(false);
            onSearch({ name: query, lat: null, lng: null });
        }
    };

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // GSAP Dropdown Animation
    useGSAP(() => {
        if (showSuggestions && dropdownRef.current) {
            gsap.fromTo(dropdownRef.current,
                { opacity: 0, y: -10, scaleY: 0.95 },
                { opacity: 1, y: 0, scaleY: 1, duration: 0.2, ease: "power2.out" }
            );
        }
    }, [showSuggestions]);

    return (
        <div ref={searchRef} className="relative w-full max-w-2xl mx-auto z-50">
            <div className={`relative flex items-center bg-surface border transition-all duration-300 ${showSuggestions ? 'rounded-t-2xl border-brand-primary shadow-lg' : 'rounded-2xl border-border hover:border-brand-primary/50 shadow-sm'}`}>
                <Search className="absolute left-4 h-5 w-5 text-text-secondary" />
                <input
                    type="text"
                    value={query}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search location (e.g., Ambattur, Chennai)..."
                    className="w-full bg-transparent py-4 pl-12 pr-12 text-text-primary placeholder:text-text-secondary/70 focus:outline-none rounded-2xl"
                    disabled={loading}
                />
                {query ? (
                    <button onClick={handleClear} className="absolute right-4 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="h-4 w-4 text-text-secondary" />
                    </button>
                ) : (
                    loading && (
                        <div className="absolute right-4 animate-spin">
                            <Loader2 className="h-4 w-4 text-brand-primary" />
                        </div>
                    )
                )}
            </div>

            {showSuggestions && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 bg-surface border border-t-0 border-border rounded-b-2xl shadow-xl overflow-hidden max-h-[400px] overflow-y-auto custom-scrollbar"
                >
                    {/* API Loading State */}
                    {isSearchingSuggestions && (
                        <div className="p-3 flex items-center gap-2 text-xs text-text-secondary justify-center bg-surface-elevated/50">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Finding locations...
                        </div>
                    )}

                    {/* Live Suggestions */}
                    {apiSuggestions.length > 0 && (
                        <div className="py-2">
                            <div className="px-4 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Suggestions
                            </div>
                            {apiSuggestions.map((item, idx) => (
                                <button
                                    key={`api-${idx}`}
                                    onClick={() => handleSelectSuggestion(item, true)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-primary/5 transition-colors text-left group border-l-2 border-transparent hover:border-brand-primary"
                                >
                                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-white text-text-secondary group-hover:text-brand-primary transition-colors">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <span className="text-sm font-medium text-text-primary group-hover:text-brand-primary transition-colors">
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                            {history.length > 0 && <div className="h-px bg-border my-2 mx-4" />}
                        </div>
                    )}

                    {/* History */}
                    {(filteredHistory.length > 0 || history.length > 0) && (
                        <div className="bg-surface-elevated/30 py-2">
                            <div className="px-4 py-1 text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Recent
                            </div>
                            {(filteredHistory.length > 0 ? filteredHistory : history).map((item, idx) => (
                                <button
                                    key={`hist-${idx}`}
                                    onClick={() => handleSelectSuggestion({ name: item.location_name, lat: null, lng: null })}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-brand-primary/5 transition-colors text-left group"
                                >
                                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-text-secondary group-hover:text-brand-primary transition-colors">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-text-primary truncate">{item.location_name}</div>
                                        <div className="text-[10px] text-text-secondary">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {apiSuggestions.length === 0 && filteredHistory.length === 0 && !isSearchingSuggestions && query.length > 2 && (
                        <div className="p-8 text-center text-text-secondary">
                            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No locations found.</p>
                            <p className="text-xs opacity-70">Try a broader area name.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LocationSearch;
