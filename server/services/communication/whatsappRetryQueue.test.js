// Fast, deterministic backoff for tests (lazy-read by the module).
process.env.WHATSAPP_QUEUE_BACKOFF_MS = '1';
process.env.WHATSAPP_QUEUE_MAX_ATTEMPTS = '3';

const whatsappRetryQueue = require('./whatsappRetryQueue');
const axios = require('axios');
const whatsappRepository = require('../../repositories/communication/whatsappRepository');

jest.mock('axios');
jest.mock('../../repositories/communication/whatsappRepository');

describe('whatsappRetryQueue', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        whatsappRetryQueue.clear();
    });

    describe('enqueue', () => {
        it('throws when to or message is missing', () => {
            expect(() => whatsappRetryQueue.enqueue({ to: '123', message: '' })).toThrow();
            expect(() => whatsappRetryQueue.enqueue({ to: '', message: 'hi' })).toThrow();
        });

        it('accepts a valid item and reports size', () => {
            whatsappRetryQueue.enqueue({ to: '123', message: 'hi', patientId: 5 });
            expect(whatsappRetryQueue.size()).toBe(1);
        });
    });

    describe('flush', () => {
        it('dequeues FIFO and persists sent on 200', async () => {
            axios.post.mockResolvedValue({ status: 200, data: {} });

            whatsappRetryQueue.enqueue({ to: '111', message: 'first', patientId: 1 });
            whatsappRetryQueue.enqueue({ to: '222', message: 'second', patientId: 2 });

            await whatsappRetryQueue.flush();

            expect(whatsappRetryQueue.size()).toBe(0);
            // FIFO: first message persisted before second
            expect(whatsappRepository.createMessage).toHaveBeenNthCalledWith(
                1, 1, 'outbound', 'first', null, 'sent'
            );
            expect(whatsappRepository.createMessage).toHaveBeenNthCalledWith(
                2, 2, 'outbound', 'second', null, 'sent'
            );
            expect(axios.post).toHaveBeenCalledTimes(2);
        });

        it('retries on 401 then succeeds (keeps real cause)', async () => {
            let calls = 0;
            axios.post.mockImplementation(() => {
                calls += 1;
                if (calls === 1) return Promise.reject({ response: { status: 401 } });
                return Promise.resolve({ status: 200, data: {} });
            });

            whatsappRetryQueue.enqueue({ to: '333', message: 'retry', patientId: 3 });
            await whatsappRetryQueue.flush();

            expect(axios.post).toHaveBeenCalledTimes(2);
            expect(whatsappRetryQueue.size()).toBe(0);
            expect(whatsappRepository.createMessage).toHaveBeenCalledWith(3, 'outbound', 'retry', null, 'sent');
        });

        it('marks failed after max attempts and persists failure', async () => {
            axios.post.mockRejectedValue({ response: { status: 503 } });

            whatsappRetryQueue.enqueue({ to: '444', message: 'never', patientId: 4 });
            await whatsappRetryQueue.flush();

            // max attempts = 3 -> 3 axios calls
            expect(axios.post).toHaveBeenCalledTimes(3);
            expect(whatsappRetryQueue.size()).toBe(0);
            expect(whatsappRepository.createMessage).toHaveBeenCalledWith(4, 'outbound', 'never', null, 'failed');
        });

        it('is a no-op when already running (guarded)', async () => {
            axios.post.mockResolvedValue({ status: 200, data: {} });
            whatsappRetryQueue.enqueue({ to: '555', message: 'one', patientId: 5 });

            const p1 = whatsappRetryQueue.flush();
            const p2 = whatsappRetryQueue.flush(); // concurrent, should be ignored
            await Promise.all([p1, p2]);

            expect(axios.post).toHaveBeenCalledTimes(1);
        });
    });
});
