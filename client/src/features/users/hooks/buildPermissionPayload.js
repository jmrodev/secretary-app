/**
 * Pure helper: builds the POST body for the secretary permissions endpoint.
 * secretaryIds is included only when non-empty; flags default to false.
 */
export const buildPermissionPayload = ({ secretaryIds = [], grantToAll = false, revoke = false } = {}) => {
    const payload = {
        grantToAll: Boolean(grantToAll),
        revoke: Boolean(revoke)
    };
    if (Array.isArray(secretaryIds) && secretaryIds.length > 0) {
        payload.secretaryIds = secretaryIds;
    }
    return payload;
};