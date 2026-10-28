const httpMocks = require('node-mocks-http');
const {
    validateWebhook,
    validateAiSuggestion,
    validateSendMessage,
    validateSendDirect,
    validateBroadcast,
    validateSuggestAlternative,
    validatePendingId,
    validateHistory,
    validateDeleteConversation,
    validateTestConnection,
    validateBroadcastDirect,
    validateBroadcastPreview,
    verifyBridgeSecret
} = require('./validateWhatsapp');

describe('validateWhatsapp middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();
    });

    describe('validateWebhook', () => {
        it('accepts sender with WhatsApp JID format', () => {
            req.body = { sender: '5492494251686@s.whatsapp.net', message: 'Hola' };
            validateWebhook(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.statusCode).toBe(200);
        });

        it('accepts sender with plain phone number format (from Go bridge)', () => {
            req.body = { sender: '5492494251686', message: 'Hola doctor' };
            validateWebhook(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.statusCode).toBe(200);
        });

        it('accepts sender with international + format', () => {
            req.body = { sender: '+5491112345678', message: 'Consulta' };
            validateWebhook(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.statusCode).toBe(200);
        });

        it('rejects missing sender or message', () => {
            req.body = { sender: '5492494251686' };
            validateWebhook(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ error: 'sender and message are required and must be strings' });
        });

        it('rejects invalid sender format that is neither phone nor JID', () => {
            req.body = { sender: 'invalid-sender-abc', message: 'Hola' };
            validateWebhook(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ error: 'Invalid sender format' });
        });
    });

    describe('validateAiSuggestion', () => {
        it('passes when patientId is present', () => {
            req.body = { patientId: 10 };
            validateAiSuggestion(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('passes when phone is present', () => {
            req.body = { phone: '5491112345678' };
            validateAiSuggestion(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('rejects when both are missing', () => {
            req.body = {};
            validateAiSuggestion(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.statusCode).toBe(400);
            expect(res._getJSONData()).toEqual({ error: 'patientId or phone is required' });
        });
    });

    describe('other validators', () => {
        it('validates validateSendMessage', () => {
            req.body = { to: '123' };
            validateSendMessage(req, res, next);
            expect(res.statusCode).toBe(400);

            req.body = { to: '123', templateName: 'tmpl' };
            validateSendMessage(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('validates validateSendDirect', () => {
            req.body = { to: '123' };
            validateSendDirect(req, res, next);
            expect(res.statusCode).toBe(400);

            req.body = { to: '123', message: 'hello' };
            validateSendDirect(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('validates validateBroadcast', () => {
            req.body = { contacts: [] };
            validateBroadcast(req, res, next);
            expect(res.statusCode).toBe(400);

            req.body = { contacts: ['123'], templateName: 'tmpl' };
            validateBroadcast(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('validates validateSuggestAlternative', () => {
            req.body = {};
            validateSuggestAlternative(req, res, next);
            expect(res.statusCode).toBe(400);

            req.body = { alternative_slot_iso: '2026-10-28T10:00:00' };
            validateSuggestAlternative(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('validates validatePendingId', () => {
            req.params = { id: 'abc' };
            validatePendingId(req, res, next);
            expect(res.statusCode).toBe(400);

            req.params = { id: '12' };
            validatePendingId(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('validates validateHistory and validateDeleteConversation', () => {
            req.body = {};
            validateHistory(req, res, next);
            expect(res.statusCode).toBe(400);

            req.body = { phone: '123' };
            validateHistory(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);

            req.body = {};
            validateDeleteConversation(req, res, next);
            expect(res.statusCode).toBe(400);

            req.body = { patientId: 1 };
            validateDeleteConversation(req, res, next);
            expect(next).toHaveBeenCalledTimes(2);
        });

        it('validates validateTestConnection', () => {
            req.body = {};
            validateTestConnection(req, res, next);
            expect(res.statusCode).toBe(400);

            req.body = { to: '123' };
            validateTestConnection(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('validates validateBroadcastDirect', () => {
            req.body = {};
            validateBroadcastDirect(req, res, next);
            expect(res.statusCode).toBe(400);

            req.body = { message: 'hello' };
            validateBroadcastDirect(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });

        it('validates validateBroadcastPreview', () => {
            req.body = { filter: 'invalid' };
            validateBroadcastPreview(req, res, next);
            expect(res.statusCode).toBe(400);

            req.body = { filter: 'last_12_months' };
            validateBroadcastPreview(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });
    });

    describe('verifyBridgeSecret', () => {
        const origSecret = process.env.WHATSAPP_BRIDGE_SECRET;

        afterEach(() => {
            process.env.WHATSAPP_BRIDGE_SECRET = origSecret;
        });

        it('rejects with 500 when WHATSAPP_BRIDGE_SECRET is not configured', () => {
            delete process.env.WHATSAPP_BRIDGE_SECRET;
            verifyBridgeSecret(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.statusCode).toBe(500);
        });

        it('rejects with 401 when X-Bridge-Secret header is missing or incorrect', () => {
            process.env.WHATSAPP_BRIDGE_SECRET = 'secret123';
            req.headers['x-bridge-secret'] = 'wrong';
            verifyBridgeSecret(req, res, next);
            expect(next).not.toHaveBeenCalled();
            expect(res.statusCode).toBe(401);
        });

        it('passes when X-Bridge-Secret matches', () => {
            process.env.WHATSAPP_BRIDGE_SECRET = 'secret123';
            req.headers['x-bridge-secret'] = 'secret123';
            verifyBridgeSecret(req, res, next);
            expect(next).toHaveBeenCalledTimes(1);
        });
    });
});
