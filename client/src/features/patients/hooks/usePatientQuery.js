import React, { useState, useCallback, useEffect } from 'react';
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
    } = options;

    const { searchTerm: globalSearch, setSearchTerm: setGlobalSearch } = useSearch();
    const [localSearch, setLocalSearch] = useState('');
    const searchTerm = useGlobalSearch ? globalSearch : localSearch;
    const setSearchTerm = useGlobalSearch ? setGlobalSearch : setLocalSearch;

    const [executedSearch, setExecutedSearch] = useState(searchTerm);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

    const executeSearch = useCallback((overrideTerm) => {
        const termToUse = overrideTerm !== undefined ? overrideTerm : searchTerm;
        setExecutedSearch(termToUse);
        setCurrentPage(1);
    }, [searchTerm]);

    const shouldSearch = executedSearch.length >= minChars || executedSearch.length === 0;

    const { data: response, loading, refetch } = useFetch('/users/patients', {
        initialData: { success: true, data: [], meta: { totalCount: 0 } },
        params: {
            page: currentPage,
            limit: limit,
            search: executedSearch,
            doctor_id: doctorId
        },
        immediate: shouldSearch
    });

    useEffect(() => {
        if (!loading && response) {
            setHasFetchedOnce(true);
        }
    }, [loading, response]);

    const patients = Array.isArray(response?.data) ? response.data : [];
    const meta = response?.meta ?? {};
    const totalCount = (meta.totalCount !== undefined && meta.totalCount !== null) ? Number(meta.totalCount) : patients.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

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
        hasFetchedOnce,
        searchTerm,
        setSearchTerm,
        executeSearch,
        handlePageChange,
        refetch
    };
};
