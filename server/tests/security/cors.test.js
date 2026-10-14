describe('CORS Logic Verification', () => {
    const createOriginValidator = (allowedOriginsRaw) => {
        const allowedOrigins = allowedOriginsRaw.split(',').map(o => o.trim());
        return (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        };
    };

    it('should allow requests with no origin', (done) => {
        const validateOrigin = createOriginValidator('http://localhost:5173');

        validateOrigin(undefined, (err, allow) => {
            expect(err).toBeNull();
            expect(allow).toBe(true);
            done();
        });
    });

    it('should allow requests from allowed origins (including trimmed ones)', (done) => {
        const validateOrigin = createOriginValidator('http://localhost:5173, https://myapp.com ');

        validateOrigin('http://localhost:5173', (err, allow) => {
            expect(err).toBeNull();
            expect(allow).toBe(true);

            validateOrigin('https://myapp.com', (err2, allow2) => {
                expect(err2).toBeNull();
                expect(allow2).toBe(true);
                done();
            });
        });
    });

    it('should block requests from disallowed origins', (done) => {
        const validateOrigin = createOriginValidator('http://localhost:5173');

        validateOrigin('http://malicious.com', (err, allow) => {
            expect(err).not.toBeNull();
            expect(err.message).toBe('Not allowed by CORS');
            done();
        });
    });
});
