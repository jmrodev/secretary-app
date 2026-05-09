import React, { createContext, useContext, useState } from 'react';

const SearchContext = createContext();

/**
 * SearchProvider Context.
 * Centralizes the global search state to be used across the header and feature pages.
 */
export const SearchProvider = ({ children }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const value = React.useMemo(() => ({
        searchTerm,
        setSearchTerm
    }), [searchTerm]);

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
};
