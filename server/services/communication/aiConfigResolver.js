/**
 * aiConfigResolver — pure AI provider/model resolution for WhatsApp suggestions.
 *
 * ZERO imports by design: the module is a deterministic function of its inputs
 * ({ settings, doctor, env }), which makes it trivially testable and keeps the
 * service layer repository-free.
 *
 * Precedence (spec: communication — Routing):
 * - Provider: `ai_provider` setting > env-derived > built-in default ('groq').
 * - Model per provider: doctor `gemini_model` (Gemini only) > global setting
 *   (`ai_ollama_model` / `ai_groq_model` / `gemini_global_model`) > env
 *   (`OLLAMA_MODEL` / `AI_MODEL`) > built-in default.
 *
 * Dead Gemini prefixes (`gemini-1.5*`, `gemini-2.0*`, `gemini-2.5*`) are
 * remapped to `gemini-3.6-flash` at READ time only — stored values are never
 * mutated (no DB migration).
 */

/** Fixed fallback order tried after the primary provider fails. */
const FALLBACK_CHAIN = ['ollama', 'groq', 'gemini'];

/** Built-in model defaults per provider, used when no setting/env overrides. */
const DEFAULT_MODELS = {
    ollama: 'llama3.2',
    groq: 'llama-3.3-70b-versatile',
    gemini: 'gemini-3.6-flash'
};

/** System-settings keys the controller must read to build the aiSettings map. */
const AI_SETTING_KEYS = ['ai_provider', 'ai_ollama_model', 'ai_groq_model', 'gemini_global_model'];

/** Models matching any of these dead prefixes are remapped at read time. */
const DEAD_GEMINI_PREFIX_RE = /^gemini-(?:1\.5|2\.0|2\.5)/;

/** Model to use for any stored model carrying a dead Gemini prefix. */
const CURRENT_GEMINI_MODEL = 'gemini-3.6-flash';

/** Global-setting key per provider (index must align with FALLBACK_CHAIN). */
const MODEL_SETTING_KEY = {
    ollama: 'ai_ollama_model',
    groq: 'ai_groq_model',
    gemini: 'gemini_global_model'
};

/**
 * Remaps dead Gemini prefixes to the current flash model at read time.
 * Non-dead models (and non-string inputs) are returned unchanged.
 *
 * @param {string|undefined|null} model
 * @returns {string|undefined|null}
 */
function normalizeGeminiModel(model) {
    if (typeof model !== 'string') return model;
    return DEAD_GEMINI_PREFIX_RE.test(model) ? CURRENT_GEMINI_MODEL : model;
}

/**
 * Derives the primary provider: `ai_provider` setting wins; otherwise the env
 * decides (OLLAMA_BASE_URL -> ollama, only-GEMINI_API_KEY -> gemini, else
 * groq); with no signal at all the built-in default is groq.
 *
 * @param {object} settings
 * @param {object} env
 * @returns {string} one of FALLBACK_CHAIN
 */
function resolveProvider(settings, env) {
    const configured = settings.ai_provider;
    if (FALLBACK_CHAIN.includes(configured)) return configured;
    if (env.OLLAMA_BASE_URL) return 'ollama';
    if (env.GEMINI_API_KEY && !env.GROQ_API_KEY) return 'gemini';
    return 'groq';
}

/**
 * Resolves a provider's model by precedence:
 * doctor (gemini only) > global setting > env > built-in default.
 *
 * @param {string} provider one of FALLBACK_CHAIN
 * @param {object} settings
 * @param {object|null} doctor
 * @param {object} env
 * @returns {string}
 */
function resolveModel(provider, settings, doctor, env) {
    if (provider === 'gemini' && doctor?.gemini_model) return doctor.gemini_model;

    const globalSetting = settings[MODEL_SETTING_KEY[provider]];
    if (globalSetting) return globalSetting;

    const envModel = provider === 'ollama'
        ? env.OLLAMA_MODEL || env.AI_MODEL
        : env.AI_MODEL;
    if (envModel) return envModel;

    return DEFAULT_MODELS[provider];
}

/**
 * Resolves the full AI configuration for a suggestion request.
 *
 * @param {object} params
 * @param {object} [params.settings={}]   system-settings map ({key: value})
 * @param {object|null} [params.doctor=null] doctor record (gemini fields only)
 * @param {object} [params.env=process.env] environment (for tests)
 * @returns {{provider: string, models: object, geminiApiVersion: string}}
 *   models = { ollama, groq, gemini } fully resolved (fallbacks included);
 *   geminiApiVersion = doctor override or 'v1beta'.
 */
function resolveAiConfig({ settings = {}, doctor = null, env = process.env } = {}) {
    const provider = resolveProvider(settings, env);

    const models = {};
    for (const p of FALLBACK_CHAIN) {
        models[p] = resolveModel(p, settings, doctor, env);
    }
    // Dead-prefix remap at READ time only — stored values stay untouched.
    models.gemini = normalizeGeminiModel(models.gemini);

    const geminiApiVersion = doctor?.gemini_api_version || 'v1beta';

    return { provider, models, geminiApiVersion };
}

module.exports = {
    resolveAiConfig,
    normalizeGeminiModel,
    FALLBACK_CHAIN,
    DEFAULT_MODELS,
    AI_SETTING_KEYS
};
