import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';
import { convertCurrency } from '../utils/currencyUtils';

const PortfolioContext = createContext();

export const usePortfolio = () => {
  return useContext(PortfolioContext);
};

export const PortfolioProvider = ({ children }) => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch portfolio on mount or user change
  useEffect(() => {
    if (user) {
      fetchPortfolio();
    } else {
      setPortfolio([]);
      setLoading(false);
    }
  }, [user]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPortfolio(data || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToPortfolio = async (property) => {
    // Allow Guest additions (Local State Only) or Authenticated (DB Saved)
    const newItem = {
      id: user ? undefined : Date.now(), // Temp ID for guests
      user_id: user?.id,
      property_name: property.propertyName,
      location: property.location,
      purchase_price: property.purchasePrice,
      monthly_cash_flow: property.monthlyCashFlow,
      monthly_cost: property.monthlyCost,
      currency: property.currency || '$',
      created_at: new Date().toISOString(),
    };

    // Optimistic Update for UI immediately
    setPortfolio((prev) => [newItem, ...prev]);

    if (user) {
      try {
        // Save to DB if logged in
        const { data, error } = await supabase
          .from('portfolio')
          .insert([
            {
              user_id: user.id,
              property_name: newItem.property_name,
              location: newItem.location,
              purchase_price: newItem.purchase_price,
              monthly_cash_flow: newItem.monthly_cash_flow,
              monthly_cost: newItem.monthly_cost,
              currency: newItem.currency,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Replace temp item with real DB item (mostly for consistent ID)
        setPortfolio((prev) => [data, ...prev.filter((i) => i !== newItem)]);
        return data;
      } catch (error) {
        console.error('Error adding to portfolio:', error);
        // Optionally revert optimistic update here if needed
      }
    }
  };

  const removeFromPortfolio = async (id) => {
    try {
      setPortfolio((prev) => prev.filter((item) => item.id !== id));

      const { error } = await supabase.from('portfolio').delete().eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing from portfolio:', error);
      // Maybe fetchPortfolio() to sync state
    }
  };

  const renameInPortfolio = async (id, newName) => {
    try {
      // Optimistic update
      setPortfolio((prev) =>
        prev.map((item) => (item.id === id ? { ...item, location: newName } : item))
      );

      if (user) {
        const { error } = await supabase
          .from('portfolio')
          .update({ location: newName })
          .eq('id', id);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error renaming portfolio item:', error);
      // Revert on error
      fetchPortfolio();
    }
  };
  const updateVisitData = async (id, date, notes) => {
    try {
      // Optimistic Update
      setPortfolio((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, last_visited: date, visit_notes: notes } : item
        )
      );

      if (user) {
        const { error } = await supabase
          .from('portfolio')
          .update({ last_visited: date, visit_notes: notes })
          .eq('id', id);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error updating visit data:', error);
      fetchPortfolio(); // Revert
    }
  };

  const [globalCurrency, setGlobalCurrency] = useState('$');

  const getPortfolioSummary = () => {
    return portfolio.reduce(
      (acc, item) => {
        const itemCurrency = item.currency || '$';

        // Convert each value to the global display currency
        const price = convertCurrency(
          Number(item.purchase_price) || 0,
          itemCurrency,
          globalCurrency
        );
        const cashFlow = convertCurrency(
          Number(item.monthly_cash_flow) || 0,
          itemCurrency,
          globalCurrency
        );
        const cost = convertCurrency(Number(item.monthly_cost) || 0, itemCurrency, globalCurrency);

        acc.totalAssets += price;
        acc.monthlyCashFlow += cashFlow;
        acc.monthlyCost += cost;
        return acc;
      },
      { totalAssets: 0, monthlyCashFlow: 0, monthlyCost: 0 }
    );
  };

  const value = {
    portfolio,
    loading,
    addToPortfolio,
    removeFromPortfolio,
    renameInPortfolio,
    getPortfolioSummary,
    updateVisitData,
    globalCurrency,
    setGlobalCurrency,
  };

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
};
