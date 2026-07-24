import React, { useState } from 'react';
import { SearchContext } from './SearchContext';

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
