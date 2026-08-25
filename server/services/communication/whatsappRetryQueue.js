const axios = require('axios');
const whatsappRepository = require('../../repositories/communication/whatsappRepository');

/**
 * In-memory FIFO retry queue for WhatsApp direct messages.
 *
 * When the Go bridge returns 401 (not authenticated) or 503 (unavailable),
 * sendMessageDirect enqueues the message here instead of failing. A guarded
 * flush loop retries each item with exponential backoff (1s -> 30s) and
 * dequeues on a 200. After MAX_ATTEMPTS it marks the item failed and persists
 * it to history so the UI can surface the real cause.
 */

const QUEUE_MAX_ATTEMPTS = () => Number(process.env.WHATSAPP_QUEUE_MAX_ATTEMPTS) || 5;
const QUEUE_BASE_DELAY_MS = () => Number(process.env.WHATSAPP_QUEUE_BACKOFF_MS) || 1000;
const QUEUE_MAX_DELAY_MS = 30000;

class RetryQueue {
    #queue = [];
    #running = false;

    get queue() { return this.#queue; }
    get running() { return this.#running; }
    set running(value) { this.#running = value; }
}

const retryQueue = new RetryQueue();

const normalizePhone = (phone) => {
    if (!phone) return phone;
    const cleanedDigits = phone.toString().replace(/\D/g, '');
    if (cleanedDigits.startsWith('549')) {
        return '54' + cleanedDigits.slice(3);
    }
    return cleanedDigits;
};

const enqueue = ({ to, message, patientId = null }) => {
    if (!to || !message) {
        throw new Error('to and message are required to enqueue a retry');
    }
    retryQueue.queue.push({ to, message, patientId, attempts: 0, status: 'queued', lastError: null });
};

const size = () => retryQueue.queue.length;

const list = () => retryQueue.queue.map((item) => ({ ...item }));

/** Test-only helper to reset module state between cases. */
const clear = () => {
    retryQueue.queue.length = 0;
    retryQueue.running = false;
};

const backoffMs = (attempt) => Math.min(QUEUE_MAX_DELAY_MS, QUEUE_BASE_DELAY_MS() * 2 ** (attempt - 1));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendOnce = async (item) => {
    const recipient = normalizePhone(item.to);
    const bridgeUrl = process.env.WHATSAPP_BRIDGE_URL || 'http://127.0.0.1:8090/api/send';
    return axios.post(bridgeUrl, { recipient, message: item.message });
};

const persist = async (item, status) => {
    try {
        if (item.patientId) {
            await whatsappRepository.createMessage(item.patientId, 'outbound', item.message, null, status);
        } else {
            await whatsappRepository.createMessage(null, 'outbound', item.message, null, status, item.to);
        }
    } catch (dbErr) {
        console.error('[WhatsApp RetryQueue] Failed to persist message:', dbErr);
    }
};

/**
 * Guarded flush: processes the head of the queue (FIFO) until empty.
 * Safe to call fire-and-forget; concurrent calls are ignored while running.
 */
const flush = async () => {
    if (retryQueue.running) return;
    retryQueue.running = true;
    try {
        while (retryQueue.queue.length > 0) {
            const item = retryQueue.queue[0];
            item.attempts += 1;
            try {
                const response = await sendOnce(item);
                if (response.status === 200) {
                    await persist(item, 'sent');
                    retryQueue.queue.shift();
                    continue;
                }
                throw new Error(`Bridge responded ${response.status}`);
            } catch (error) {
                const status = error.response?.status;
                const retriable = status === 401 || status === 503;
                item.lastError = error.response?.data || error.message;
                if (retriable && item.attempts < QUEUE_MAX_ATTEMPTS()) {
                    await sleep(backoffMs(item.attempts));
                    continue;
                }
                await persist(item, 'failed');
                retryQueue.queue.shift();
            }
        }
    } finally {
        retryQueue.running = false;
    }
};

module.exports = { enqueue, size, list, flush, clear, normalizePhone };
