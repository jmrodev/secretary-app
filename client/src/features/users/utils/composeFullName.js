/**
 * Compose the legacy `full_name` from granular name parts.
 * Falls back to the existing `full_name` when either part is missing,
 * preserving backward compatibility with rows that only have `full_name`.
 *
 * Pure function so the composition rule is unit-testable (spec REQ-02).
 */
export const composeFullName = (formData = {}) => {
    const { first_name, last_name, full_name } = formData;
    return first_name && last_name
        ? `${first_name} ${last_name}`
        : full_name;
};
