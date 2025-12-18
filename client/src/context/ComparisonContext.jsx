import React, { createContext, useContext, useState, useEffect } from 'react';

const ComparisonContext = createContext();

export const useComparison = () => {
    const context = useContext(ComparisonContext);
    if (!context) {
        throw new Error('useComparison must be used within a ComparisonProvider');
    }
    return context;
};

export const ComparisonProvider = ({ children }) => {
    const [comparedProperties, setComparedProperties] = useState(() => {
        const saved = localStorage.getItem('terra-truce-comparison');
        return saved ? JSON.parse(saved) : [];
    });

    // UI state for comparison drawer/modal
    const [isCompareVisible, setIsCompareVisible] = useState(false);

    useEffect(() => {
        localStorage.setItem('terra-truce-comparison', JSON.stringify(comparedProperties));
    }, [comparedProperties]);

    const addToCompare = (property) => {
        // REMOVED: Limit check. User requested "many locations".
        // if (comparedProperties.length >= 3) { ... }

        // Avoid duplicates
        const exists = comparedProperties.some(p => p.location_info.formatted_address === property.location_info.formatted_address);
        if (exists) {
            alert("This property is already in your comparison list.");
            return;
        }

        setComparedProperties(prev => [...prev, property]);
        setIsCompareVisible(true);
    };

    const removeFromCompare = (address) => {
        setComparedProperties(prev => prev.filter(p => p.location_info.formatted_address !== address));
    };

    const clearComparison = () => {
        setComparedProperties([]);
        setIsCompareVisible(false);
    };

    const toggleCompareVisibility = () => {
        setIsCompareVisible(prev => !prev);
    };

    return (
        <ComparisonContext.Provider value={{
            comparedProperties,
            addToCompare,
            removeFromCompare,
            clearComparison,
            isCompareVisible,
            setIsCompareVisible,
            toggleCompareVisibility
        }}>
            {children}
        </ComparisonContext.Provider>
    );
};
