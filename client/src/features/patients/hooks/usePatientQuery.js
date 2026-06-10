import React, { useState, useEffect, useCallback } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useSearch } from '@/hooks/useSearch';

/**
 * ECC-Pattern: Optimized Server-Side Pagination & Search
 */
export const usePatientQuery = (options = {}) => {
    const { 
        doctorId = null, 
        limit = 50, 
        useGlobalSearch = false,
        minChars = 2,
        debounceMs = 400
    } = options;

    const { searchTerm: globalSearch, setSearchTerm: setGlobalSearch } = useSearch();
    const [localSearch, setLocalSearch] = useState('');
    const searchTerm = useGlobalSearch ? globalSearch : localSearch;
    const setSearchTerm = useGlobalSearch ? setGlobalSearch : setLocalSearch;

    const [queryState, dispatchQuery] = React.useReducer((s, a) => ({ ...s, ...a }), {
        debouncedSearch: searchTerm,
        currentPage: 1
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatchQuery({ debouncedSearch: searchTerm, currentPage: 1 });
        }, debounceMs);
        return () => clearTimeout(timer);
    }, [searchTerm, debounceMs]);

    const { debouncedSearch, currentPage } = queryState;
    const shouldSearch = debouncedSearch.length >= minChars || debouncedSearch.length === 0;

    const { data: response, loading, refetch } = useFetch('/users/patients', {
        initialData: { success: true, data: [], meta: { totalCount: 0 } },
        params: {
            page: currentPage,
            limit: limit,
            search: debouncedSearch,
            doctor_id: doctorId
        },
        immediate: shouldSearch
    });

    // Unpack ECC envelope
    const patients = response?.data || [];
    const meta = response?.meta || {};
    const totalCount = meta.totalCount || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            dispatchQuery({ currentPage: newPage });
        }
    }, [totalPages]);

    return {
        patients,
        totalCount,
        totalPages,
        currentPage,
        loading,
        searchTerm,
        setSearchTerm,
        handlePageChange,
        refetch
    };
};
