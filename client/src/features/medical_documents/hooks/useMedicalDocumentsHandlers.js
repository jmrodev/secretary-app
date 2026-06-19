import { useRequestHandlers } from './useRequestHandlers';
import { useFileHandlers } from './useFileHandlers';
import { useHistoryHandlers } from './useHistoryHandlers';
import { useNavigationHandlers } from './useNavigationHandlers';

/**
 * useMedicalDocumentsHandlers Hook (Orchestrator).
 * Composes specialized hooks for managing medical documents.
 */
export const useMedicalDocumentsHandlers = (props) => {
    const requestHandlers = useRequestHandlers(props);
    const fileHandlers = useFileHandlers(props);
    
    const historyHandlers = useHistoryHandlers({
        ...props,
        handleDeleteRequest: requestHandlers.handleDeleteRequest
    });

    const navigationHandlers = useNavigationHandlers(props);

    return {
        // Request Actions
        ...requestHandlers,

        // File Actions
        ...fileHandlers,

        // History Actions
        ...historyHandlers,

        // Navigation & Modal UI
        ...navigationHandlers,

        // Composite / Legacy
        fetchRequests: props.fetchRequests,
        filterItem: props.filterItem,
        handlePrintPrescriptions: navigationHandlers.handlePrintPrescriptions,
        handleSelectMedication: historyHandlers.handleSelectMedication,
    };
};
