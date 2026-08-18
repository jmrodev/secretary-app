/**
 * Safe JSON serialization helpers for BigInt values.
 *
 * The mariadb driver returns BIGINT columns as BigInt. Express responses and
 * direct JSON.stringify calls need a serializer that never mutates the global
 * BigInt prototype (immutability rule in AGENTS.md).
 */

const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER);

/**
 * Replacer for JSON.stringify: converts BigInt to a JSON-safe value.
 * Numbers within the safe range keep numeric type; larger values become
 * strings to avoid silent truncation.
 */
function safeJsonReplacer(key, value) {
    if (typeof value === 'bigint') {
        return value <= MAX_SAFE ? Number(value) : value.toString();
    }
    return value;
}

/** JSON.stringify with the safe BigInt replacer. */
function safeJsonStringify(value, space) {
    return JSON.stringify(value, safeJsonReplacer, space);
}

module.exports = { safeJsonReplacer, safeJsonStringify };