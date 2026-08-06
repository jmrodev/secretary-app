/**
 * aiModels — shared AI model constants and read-time normalization for the client.
 *
 * Mirrors the server's aiConfigResolver (per-provider defaults + dead-prefix
 * remap) so the UI offers the same valid models and never displays dead ones.
 * Stored values are never mutated: normalization happens at READ time only.
 */

/** Gemini models the UI may offer (dead 1.5/2.0/2.5 prefixes excluded). */
export const GEMINI_VALID_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash'];

/** Built-in model defaults per provider, used when no setting is stored. */
export const DEFAULT_AI_MODELS = {
    ollama: 'llama3.2',
    groq: 'llama-3.3-70b-versatile',
    gemini: 'gemini-3.6-flash'
};

/** Primary-provider options exposed by the settings UI. */
export const AI_PROVIDERS = ['ollama', 'groq', 'gemini'];

/** Gemini API versions the doctor edit modal may select. */
export const GEMINI_API_VERSIONS = ['v1', 'v1beta'];

/** Models matching any of these dead prefixes are remapped at read time. */
const DEAD_GEMINI_PREFIX_RE = /^gemini-(?:1\.5|2\.0|2\.5)/;

/** Model to use for any stored model carrying a dead Gemini prefix. */
const CURRENT_GEMINI_MODEL = 'gemini-3.6-flash';

/**
 * Remaps dead Gemini prefixes to the current flash model at read time.
 * Non-dead models (and non-string inputs) are returned unchanged.
 *
 * @param {string|undefined|null} model
 * @returns {string|undefined|null}
 */
export function normalizeGeminiModel(model) {
    if (typeof model !== 'string') return model;
    return DEAD_GEMINI_PREFIX_RE.test(model) ? CURRENT_GEMINI_MODEL : model;
}
