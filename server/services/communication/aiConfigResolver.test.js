/**
 * Unit tests for the pure AI config resolver (server/services/communication/aiConfigResolver.js).
 *
 * Covers spec scenarios (communication Domain):
 * - Provider precedence: ai_provider setting > env-derived > built-in default groq.
 * - Model precedence: doctor gemini_model (Gemini only) > global setting >
 *   env (OLLAMA_MODEL / AI_MODEL) > built-in default.
 * - Dead-prefix remap (gemini-1.5*, gemini-2.0*, gemini-2.5* -> gemini-3.6-flash)
 *   applied at READ time only.
 * - geminiApiVersion defaults to 'v1beta'; doctor override wins.
 *
 * Pure function calls — no mocks.
 */
const {
    resolveAiConfig,
    normalizeGeminiModel,
    FALLBACK_CHAIN,
    DEFAULT_MODELS,
    AI_SETTING_KEYS
} = require('./aiConfigResolver');

describe('aiConfigResolver', () => {
    describe('module exports', () => {
        it('exposes the fixed fallback chain, built-in defaults and settings keys', () => {
            expect(FALLBACK_CHAIN).toEqual(['ollama', 'groq', 'gemini']);
            expect(DEFAULT_MODELS).toEqual({
                ollama: 'llama3.2',
                groq: 'llama-3.3-70b-versatile',
                gemini: 'gemini-3.6-flash'
            });
            expect(AI_SETTING_KEYS).toEqual([
                'ai_provider',
                'ai_ollama_model',
                'ai_groq_model',
                'gemini_global_model'
            ]);
        });
    });

    describe('provider precedence', () => {
        it('uses the ai_provider setting when it is a valid chain value', () => {
            const result = resolveAiConfig({
                settings: { ai_provider: 'ollama' },
                doctor: null,
                env: { GEMINI_API_KEY: 'g', GROQ_API_KEY: 'q' }
            });
            expect(result.provider).toBe('ollama');
        });

        it('derives ollama from env when no ai_provider and OLLAMA_BASE_URL is set', () => {
            const result = resolveAiConfig({
                settings: {},
                doctor: null,
                env: { OLLAMA_BASE_URL: 'http://localhost:11434' }
            });
            expect(result.provider).toBe('ollama');
        });

        it('derives gemini from env when only GEMINI_API_KEY is present', () => {
            const result = resolveAiConfig({
                settings: {},
                doctor: null,
                env: { GEMINI_API_KEY: 'mock-gemini' }
            });
            expect(result.provider).toBe('gemini');
        });

        it('derives groq when both GEMINI_API_KEY and GROQ_API_KEY are present (env tie-break)', () => {
            const result = resolveAiConfig({
                settings: {},
                doctor: null,
                env: { GEMINI_API_KEY: 'g', GROQ_API_KEY: 'q' }
            });
            expect(result.provider).toBe('groq');
        });

        it('defaults to groq when no provider signal exists', () => {
            const result = resolveAiConfig({ settings: {}, doctor: null, env: {} });
            expect(result.provider).toBe('groq');
        });

        it('falls back to env derivation when ai_provider is not a valid chain value', () => {
            const result = resolveAiConfig({
                settings: { ai_provider: 'claude' },
                doctor: null,
                env: { GEMINI_API_KEY: 'g' }
            });
            expect(result.provider).toBe('gemini');
        });
    });

    describe('model precedence', () => {
        it('prefers the doctor gemini_model over global setting, env and default (gemini only)', () => {
            const result = resolveAiConfig({
                settings: { gemini_global_model: 'gemini-3.6-flash' },
                doctor: { gemini_model: 'gemini-3.5-flash' },
                env: { AI_MODEL: 'gemini-2.5-flash' }
            });
            expect(result.models.gemini).toBe('gemini-3.5-flash');
        });

        it('does not apply the doctor gemini_model to non-gemini providers', () => {
            const result = resolveAiConfig({
                settings: {},
                doctor: { gemini_model: 'gemini-3.5-flash' },
                env: {}
            });
            expect(result.models.ollama).toBe('llama3.2');
            expect(result.models.groq).toBe('llama-3.3-70b-versatile');
        });

        it('uses each global model setting before env and default', () => {
            const result = resolveAiConfig({
                settings: {
                    ai_ollama_model: 'llama3.1',
                    ai_groq_model: 'llama-3.1-8b-instant',
                    gemini_global_model: 'gemini-3.5-flash'
                },
                doctor: null,
                env: { AI_MODEL: 'env-model', OLLAMA_MODEL: 'env-ollama' }
            });
            expect(result.models.ollama).toBe('llama3.1');
            expect(result.models.groq).toBe('llama-3.1-8b-instant');
            expect(result.models.gemini).toBe('gemini-3.5-flash');
        });

        it('uses the env model before the built-in default', () => {
            const result = resolveAiConfig({
                settings: {},
                doctor: null,
                env: { AI_MODEL: 'llama-3.1-8b-instant', OLLAMA_MODEL: 'llama3.1' }
            });
            expect(result.models.ollama).toBe('llama3.1');
            expect(result.models.groq).toBe('llama-3.1-8b-instant');
            expect(result.models.gemini).toBe('llama-3.1-8b-instant');
        });

        it('falls back to built-in defaults when nothing else is configured', () => {
            const result = resolveAiConfig({ settings: {}, doctor: null, env: {} });
            expect(result.models.ollama).toBe('llama3.2');
            expect(result.models.groq).toBe('llama-3.3-70b-versatile');
            expect(result.models.gemini).toBe('gemini-3.6-flash');
        });

        it('resolves env AI_MODEL for ollama when OLLAMA_MODEL is not set', () => {
            const result = resolveAiConfig({
                settings: {},
                doctor: null,
                env: { AI_MODEL: 'llama3.1' }
            });
            expect(result.models.ollama).toBe('llama3.1');
        });
    });

    describe('normalizeGeminiModel', () => {
        it.each([
            ['gemini-1.5-flash', 'gemini-3.6-flash'],
            ['gemini-2.0-flash', 'gemini-3.6-flash'],
            ['gemini-2.5-flash', 'gemini-3.6-flash'],
            ['gemini-2.5-pro', 'gemini-3.6-flash'],
            ['gemini-3.6-flash', 'gemini-3.6-flash'],
            ['gemini-3.5-flash', 'gemini-3.5-flash'],
            ['llama-3.3-70b-versatile', 'llama-3.3-70b-versatile']
        ])('remaps %s -> %s', (input, expected) => {
            expect(normalizeGeminiModel(input)).toBe(expected);
        });

        it('leaves non-string values untouched', () => {
            expect(normalizeGeminiModel(undefined)).toBeUndefined();
            expect(normalizeGeminiModel(null)).toBeNull();
        });
    });

    describe('dead-model remap at READ time only', () => {
        it('remaps a dead global setting without mutating the stored settings object', () => {
            const settings = { gemini_global_model: 'gemini-2.5-flash' };
            const result = resolveAiConfig({ settings, doctor: null, env: {} });
            expect(result.models.gemini).toBe('gemini-3.6-flash');
            expect(settings.gemini_global_model).toBe('gemini-2.5-flash');
        });

        it('remaps a dead doctor gemini_model', () => {
            const result = resolveAiConfig({
                settings: {},
                doctor: { gemini_model: 'gemini-1.5-flash' },
                env: {}
            });
            expect(result.models.gemini).toBe('gemini-3.6-flash');
        });
    });

    describe('geminiApiVersion', () => {
        it('defaults to v1beta', () => {
            const result = resolveAiConfig({ settings: {}, doctor: null, env: {} });
            expect(result.geminiApiVersion).toBe('v1beta');
        });

        it('uses the doctor gemini_api_version when present', () => {
            const result = resolveAiConfig({
                settings: {},
                doctor: { gemini_api_version: 'v1' },
                env: {}
            });
            expect(result.geminiApiVersion).toBe('v1');
        });
    });
});
