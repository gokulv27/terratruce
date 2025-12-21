import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, Hospital, ShoppingBag, Trees, Star, MapPin, ChevronDown, ChevronUp, Award } from 'lucide-react';
import { staggerList } from '../../utils/designUtils';

/**
 * Facilities Display Component
 * Shows detailed information about nearby schools, hospitals, shopping, and parks
 * with quality ratings and highlights
 */
const FacilitiesDisplay = ({ amenities }) => {
    const [expandedCategory, setExpandedCategory] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            staggerList(containerRef.current.children, 0.2);
        }
    }, [amenities]);

    if (!amenities || !amenities.nearby) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'Schools': return GraduationCap;
            case 'Hospitals': return Hospital;
            case 'Shopping': return ShoppingBag;
            case 'Parks': return Trees;
            default: return MapPin;
        }
    };

    const getColorScheme = (type) => {
        switch (type) {
            case 'Schools': return {
                bg: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20',
                border: 'border-blue-200 dark:border-blue-700/50',
                icon: 'bg-blue-500',
                text: 'text-blue-700 dark:text-blue-300',
                badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
            };
            case 'Hospitals': return {
                bg: 'from-red-50 to-pink-100 dark:from-red-900/30 dark:to-pink-800/20',
                border: 'border-red-200 dark:border-red-700/50',
                icon: 'bg-red-500',
                text: 'text-red-700 dark:text-red-300',
                badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            };
            case 'Shopping': return {
                bg: 'from-teal-50 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-800/20',
                border: 'border-teal-200 dark:border-teal-700/50',
                icon: 'bg-teal-500',
                text: 'text-teal-700 dark:text-teal-300',
                badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
            };
            case 'Parks': return {
                bg: 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20',
                border: 'border-green-200 dark:border-green-700/50',
                icon: 'bg-green-500',
                text: 'text-green-700 dark:text-green-300',
                badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
            };
            default: return {
                bg: 'from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900',
                border: 'border-gray-200 dark:border-gray-700',
                icon: 'bg-gray-500',
                text: 'text-gray-700 dark:text-gray-300',
                badge: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
            };
        }
    };

    const renderStars = (rating) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-3 w-3 ${star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700'
                            }`}
                    />
                ))}
                <span className="ml-1 text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {rating.toFixed(1)}
                </span>
            </div>
        );
    };

    const getQualityBadge = (quality) => {
        const colors = {
            'Excellent': 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
            'Very Good': 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700',
            'Good': 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700',
            'Fair': 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700',
            'Poor': 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700'
        };

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${colors[quality] || colors['Good']}`}>
                <Award className="h-3 w-3" />
                {quality}
            </span>
        );
    };

    return (
        <div ref={containerRef} className="space-y-4">
            {amenities.nearby.map((category, idx) => {
                const Icon = getIcon(category.type);
                const colors = getColorScheme(category.type);
                const isExpanded = expandedCategory === category.type;
                const hasFacilities = category.facilities && category.facilities.length > 0;

                return (
                    <div
                        key={idx}
                        className={`rounded-xl border-2 bg-gradient-to-br ${colors.bg} ${colors.border} overflow-hidden transition-all duration-300 ${isExpanded ? 'shadow-lg' : 'shadow-sm hover:shadow-md'
                            }`}
                    >
                        {/* Header */}
                        <div
                            className={`p-4 cursor-pointer ${hasFacilities ? 'hover:bg-white/50 dark:hover:bg-white/5' : ''}`}
                            onClick={() => hasFacilities && setExpandedCategory(isExpanded ? null : category.type)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`${colors.icon} p-2.5 rounded-xl shadow-md`}>
                                        <Icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${colors.text}`}>{category.type}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`text-xs font-semibold ${colors.badge} px-2 py-0.5 rounded-full`}>
                                                {category.count} nearby
                                            </span>
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                Closest: {category.closest_distance}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {hasFacilities && (
                                    <button className="p-1.5 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition-colors">
                                        {isExpanded ? (
                                            <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Expanded Facilities List */}
                        {isExpanded && hasFacilities && (
                            <div className="px-4 pb-4 space-y-3 bg-white/40 dark:bg-black/20">
                                {category.facilities.slice(0, 3).map((facility, fIdx) => (
                                    <div
                                        key={fIdx}
                                        className="bg-white dark:bg-surface-elevated p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                                    >
                                        {/* Facility Header */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                                    {facility.name}
                                                </h5>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {facility.distance}
                                                    </span>
                                                    {facility.type && (
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                                                            {facility.type}
                                                        </span>
                                                    )}
                                                    {facility.specialty && (
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                                                            {facility.specialty}
                                                        </span>
                                                    )}
                                                    {facility.size && (
                                                        <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">
                                                            {facility.size}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rating and Quality */}
                                        {facility.rating && (
                                            <div className="flex items-center gap-3 mb-2">
                                                {renderStars(facility.rating)}
                                                {facility.quality && getQualityBadge(facility.quality)}
                                            </div>
                                        )}

                                        {/* Highlights */}
                                        {facility.highlights && facility.highlights.length > 0 && (
                                            <div className="mt-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {facility.highlights.map((highlight, hIdx) => (
                                                        <span
                                                            key={hIdx}
                                                            className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-700/50"
                                                        >
                                                            • {highlight}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {category.facilities.length > 3 && (
                                    <div className="text-center">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                            +{category.facilities.length - 3} more {category.type.toLowerCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
export default FacilitiesDisplay;
