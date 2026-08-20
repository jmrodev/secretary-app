const httpMocks = require('node-mocks-http');
const validate = require('./validationMiddleware');

describe('validationMiddleware - array and boolean types', () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
    });

    describe('array type', () => {
        const schema = { secretaryIds: { type: 'array', items: { type: 'integer' } } };

        it('passes an array of integers', () => {
            req.body = { secretaryIds: [2, 3, 4] };

            validate(schema)(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.statusCode).toBe(200);
        });

        it('rejects an array containing a non-integer item', () => {
            req.body = { secretaryIds: [2, 'abc'] };

            validate(schema)(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.statusCode).toBe(400);
        });

        it('passes when the field is absent (optional array)', () => {
            req.body = { grantToAll: true };

            validate(schema)(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
        });
    });

    describe('boolean type', () => {
        const schema = { revoke: { type: 'boolean' } };

        it('passes a real boolean', () => {
            req.body = { revoke: false };

            validate(schema)(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
        });

        it('rejects a string where a boolean is expected', () => {
            req.body = { revoke: 'yes' };

            validate(schema)(req, res, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.statusCode).toBe(400);
        });
    });
});