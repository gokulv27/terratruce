import React, { createContext, useContext, useState } from 'react';

const AnalysisContext = createContext();

export const AnalysisProvider = ({ children }) => {
    const [analysisState, setAnalysisState] = useState({
        location: '',
        riskData: null,
        loading: false,
        chatTrigger: null // { message: string, timestamp: number }
    });

    const updateAnalysis = (data) => {
        setAnalysisState(prev => ({ ...prev, ...data }));
    };

    const triggerChat = (message) => {
        setAnalysisState(prev => ({
            ...prev,
            chatTrigger: { message, timestamp: Date.now() }
        }));
    };

    return (
        <AnalysisContext.Provider value={{ analysisState, updateAnalysis, triggerChat }}>
            {children}
        </AnalysisContext.Provider>
    );
};

export const useAnalysis = () => useContext(AnalysisContext);
