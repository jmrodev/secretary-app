import { describe, it, expect } from 'vitest';
import {
    GEMINI_VALID_MODELS,
    DEFAULT_AI_MODELS,
    AI_PROVIDERS,
    GEMINI_API_VERSIONS,
    normalizeGeminiModel
} from '@/constants/aiModels';

describe('aiModels constants', () => {
    it('offers only the valid Gemini models (no dead 1.5/2.0/2.5 prefixes)', () => {
        expect(GEMINI_VALID_MODELS).toEqual(['gemini-3.6-flash', 'gemini-3.5-flash']);
        expect(GEMINI_VALID_MODELS.some((m) => /^gemini-(?:1\.5|2\.0|2\.5)/.test(m))).toBe(false);
    });

    it('defines one built-in default model per provider', () => {
        expect(DEFAULT_AI_MODELS).toEqual({
            ollama: 'llama3.2',
            groq: 'llama-3.3-70b-versatile',
            gemini: 'gemini-3.6-flash'
        });
    });

    it('lists the three selectable providers', () => {
        expect(AI_PROVIDERS).toEqual(['ollama', 'groq', 'gemini']);
    });

    it('exposes the supported Gemini API versions', () => {
        expect(GEMINI_API_VERSIONS).toEqual(['v1', 'v1beta']);
    });
});

describe('normalizeGeminiModel', () => {
    it.each([
        ['gemini-1.5-flash', 'gemini-3.6-flash'],
        ['gemini-2.0-flash', 'gemini-3.6-flash'],
        ['gemini-2.5-flash', 'gemini-3.6-flash'],
        ['gemini-3.6-flash', 'gemini-3.6-flash'],
        ['gemini-3.5-flash', 'gemini-3.5-flash'],
        ['gemini-3.6-pro', 'gemini-3.6-pro']
    ])('normalizes dead prefix %s to %s at read time', (input, expected) => {
        expect(normalizeGeminiModel(input)).toBe(expected);
    });

    it('leaves non-string inputs and empty strings untouched', () => {
        expect(normalizeGeminiModel(undefined)).toBe(undefined);
        expect(normalizeGeminiModel(null)).toBe(null);
        expect(normalizeGeminiModel('')).toBe('');
    });
});
