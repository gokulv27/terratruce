// Base currency is USD ($)
export const EXCHANGE_RATES = {
    '$': 1,
    'USD': 1,
    '₹': 84.5,
    'INR': 84.5,
    '€': 0.92,
    'EUR': 0.92,
    '£': 0.76,
    'GBP': 0.76
};

export const SYMBOLS = {
    'USD': '$',
    '$': '$',
    'INR': '₹',
    '₹': '₹',
    'EUR': '€',
    '€': '€',
    'GBP': '£',
    '£': '£'
};

/**
 * Convert an amount from one currency to another using USD as base.
 * @param {number} amount - The amount to convert.
 * @param {string} fromCurrency - The symbol or code of the source currency (e.g., '$', 'INR').
 * @param {string} toCurrency - The symbol or code of the target currency.
 * @returns {number} The converted amount.
 */
export const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (!amount) return 0;
    const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
    const toRate = EXCHANGE_RATES[toCurrency] || 1;

    // Convert to USD first, then to target
    const amountInUSD = amount / fromRate;
    return amountInUSD * toRate;
};

/**
 * Format a number as a currency string.
 * @param {number} amount - The amount to format.
 * @param {string} currency - The currency symbol or code.
 * @param {boolean} compact - Whether to use compact notation (e.g., 1.2M).
 * @returns {string} The formatted string (e.g., "$1,200.00").
 */
export const formatCurrency = (amount, currency = '$', compact = false) => {
    const symbol = SYMBOLS[currency] || currency;
    const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD', // Not really used for symbol, just for formatting style
        notation: compact ? 'compact' : 'standard',
        minimumFractionDigits: compact ? 1 : 0,
        maximumFractionDigits: compact ? 1 : 0,
    });

    // Strip the default USD symbol and prepend ours manually to be safe across locales
    // Or just use basic number formatting if Intl currency is tricky with custom symbols
    const numStr = formatter.format(amount).replace('$', '').trim();

    // Better Approach: Use standard number format and prepend symbol
    const standardFormatter = new Intl.NumberFormat('en-US', {
        notation: compact ? 'compact' : 'standard',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    return `${symbol}${standardFormatter.format(amount)}`;
};

/**
 * Format large numbers with appropriate suffixes (k, M, B, Cr, L).
 * Handles INR specific formatting (Lakhs/Crores) distinct from International (k/M/B).
 * @param {number} value - The number to format.
 * @param {string} currency - The currency symbol (e.g. '₹', '$').
 * @returns {string} Formatted string.
 */
export const formatLargeCurrency = (value, currency = '$') => {
    if (value === 0) return '0';

    // INR Formatting
    if (currency === '₹' || currency === 'INR') {
        if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
        return `₹${value}`;
    }

    // International Formatting
    const symbol = SYMBOLS[currency] || currency;
    if (value >= 1000000000) return `${symbol}${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${symbol}${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${symbol}${(value / 1000).toFixed(0)}k`;
    return `${symbol}${value}`;
};
