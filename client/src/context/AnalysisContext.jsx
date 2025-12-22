import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

const AnalysisContext = createContext();

export const AnalysisProvider = ({ children }) => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [analysisState, setAnalysisState] = useState({
        location: '',
        riskData: null,
        loading: false,
        chatTrigger: null // { message: string, timestamp: number }
    });

    const userIdRef = useRef(user?.id);

    useEffect(() => {
        userIdRef.current = user?.id;
    }, [user?.id]);

    const updateAnalysis = (data) => {
        setAnalysisState(prev => ({ ...prev, ...data }));
    };

    const triggerChat = (message) => {
        setAnalysisState(prev => ({
            ...prev,
            chatTrigger: { message, timestamp: Date.now() }
        }));
    };

    const fetchHistory = useCallback(async () => {
        const currentUserId = userIdRef.current;
        if (!currentUserId) {
            setHistory([]);
            setHistoryLoading(false);
            return;
        }

        setHistoryLoading(true);

        try {
            const { data, error } = await supabase
                .from('search_history')
                .select('*')
                .eq('user_id', currentUserId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) {
                console.error("Supabase History Fetch Error:", error);
                return;
            }

            if (data) {
                // Deduplicate on client side to be safe
                const seen = new Set();
                const uniqueData = data.filter(item => {
                    const normalized = item.location_name.toLowerCase().trim();
                    if (seen.has(normalized)) return false;
                    seen.add(normalized);
                    return true;
                });
                setHistory(uniqueData);
            }
        } catch (err) {
            console.error("Critical History Fetch Error:", err);
        } finally {
            setHistoryLoading(false);
        }
    }, []);

    // Initial and periodic sync
    useEffect(() => {
        if (user?.id) {
            fetchHistory();
        } else {
            setHistory([]);
        }
    }, [user?.id, fetchHistory]);

    const addToHistory = async (locationName, riskScore = null) => {
        const currentUserId = userIdRef.current;
        if (!currentUserId || !locationName) return;

        try {
            const validRiskScore = typeof riskScore === 'number' ? Math.round(riskScore) : null;
            // Normalize: lowercase, trim, and collapse multiple spaces to single space
            const normalizedLocation = locationName.toLowerCase().trim().replace(/\s+/g, ' ');

            // 1. Remove existing entry for this location (using ilike for case-insensitivity)
            const { error: deleteError } = await supabase
                .from('search_history')
                .delete()
                .eq('user_id', currentUserId)
                .ilike('location_name', normalizedLocation);

            if (deleteError) console.warn("Error deleting duplicate:", deleteError);

            // 2. Insert new entry (store as proper case if original had it, or just normalized? 
            // Better to store 'locationName' trimmed but use normalized for dup check? 
            // Actually, for history consistency, let's store the clean version but maybe Capitalized?
            // For now, let's store the user's input trimmed/cleaned.
            const cleanLocationName = locationName.trim().replace(/\s+/g, ' ');

            const { error } = await supabase.from('search_history').insert([{
                location_name: cleanLocationName,
                user_id: currentUserId,
                risk_score: validRiskScore
            }]);

            if (error) {
                console.error("Supabase Insert Error:", error);
                return;
            }

            fetchHistory();
        } catch (err) {
            console.error("Critical History Insert Error:", err);
        }
    };

    const clearHistory = async () => {
        const currentUserId = userIdRef.current;
        if (!currentUserId) return;

        try {
            const { error } = await supabase
                .from('search_history')
                .delete()
                .eq('user_id', currentUserId);

            if (error) throw error;
            setHistory([]);
        } catch (err) {
            console.error("Error clearing history:", err);
        }
    };

    return (
        <AnalysisContext.Provider value={{
            analysisState,
            updateAnalysis,
            triggerChat,
            history,
            fetchHistory,
            addToHistory,
            clearHistory,
            historyLoading
        }}>
            {children}
        </AnalysisContext.Provider>
    );
};

export const useAnalysis = () => useContext(AnalysisContext);
