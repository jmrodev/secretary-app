import React, { useState, useEffect, useCallback } from 'react';
import { useFetch } from '@/hooks/useFetch';
import { useSearch } from '@/hooks/useSearch';

/**
 * usePatientQuery
 * Centralized hook for fetching patients with pagination and search.
 * @param {Object} options - { doctorId, limit, useGlobalSearch }
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

    // Atomic state management for search and pagination
    const [queryState, dispatchQuery] = React.useReducer((s, a) => ({ ...s, ...a }), {
        debouncedSearch: searchTerm,
        currentPage: 1
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatchQuery({
                debouncedSearch: searchTerm,
                currentPage: 1
            });
        }, debounceMs);
        return () => clearTimeout(timer);
    }, [searchTerm, debounceMs]);

    const { debouncedSearch } = queryState;

    // Synchronize currentPage with handlePageChange
    const setCurrentPage = (newPage) => dispatchQuery({ currentPage: newPage });
    const currentPage = queryState.currentPage;

    const shouldSearch = debouncedSearch.length >= minChars || debouncedSearch.length === 0;

    const { 
        data, 
        loading, 
        refetch 
    } = useFetch('/users/patients', {
        initialData: { patients: [], totalCount: 0 },
        params: {
            page: currentPage,
            limit: limit,
            search: debouncedSearch,
            doctor_id: doctorId
        },
        immediate: shouldSearch
    });

    const patients = data?.patients || [];
    const totalCount = data?.totalCount || 0;
    const totalPages = Math.ceil(totalCount / limit);

    const handlePageChange = useCallback((newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
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
