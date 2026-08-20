import { describe, it, expect } from 'vitest';
import { buildPermissionPayload } from './buildPermissionPayload';

describe('buildPermissionPayload', () => {
    it('includes secretaryIds only when non-empty', () => {
        expect(buildPermissionPayload({ secretaryIds: [2, 3], grantToAll: false, revoke: false }))
            .toEqual({ secretaryIds: [2, 3], grantToAll: false, revoke: false });
    });

    it('omits secretaryIds when empty', () => {
        expect(buildPermissionPayload({ secretaryIds: [], grantToAll: true, revoke: false }))
            .toEqual({ grantToAll: true, revoke: false });
    });

    it('carries the revoke flag', () => {
        expect(buildPermissionPayload({ secretaryIds: [2], grantToAll: false, revoke: true }))
            .toEqual({ secretaryIds: [2], grantToAll: false, revoke: true });
    });

    it('defaults flags to false when omitted', () => {
        expect(buildPermissionPayload({ secretaryIds: [2] }))
            .toEqual({ secretaryIds: [2], grantToAll: false, revoke: false });
    });
});