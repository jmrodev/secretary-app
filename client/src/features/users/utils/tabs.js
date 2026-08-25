export const AVAILABLE_TABS = ['secretaries', 'doctor'];
export const DEFAULT_TAB = 'secretaries';

/**
 * Pure helper: resolves the active tab from the ?tab= search param,
 * falling back to the default 'secretaries' tab.
 */
export const resolveTab = (searchParam, availableTabs = AVAILABLE_TABS) =>
    availableTabs.includes(searchParam) ? searchParam : DEFAULT_TAB;