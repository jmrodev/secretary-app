import '@testing-library/jest-dom';

// Node 25 + jsdom 29 do not expose localStorage in the vitest environment
// (window.localStorage is undefined). Components that read it at render time
// (e.g. LanguageProvider) need a working storage object in tests.
if (typeof window !== 'undefined' && !window.localStorage) {
    const store = new Map();
    const localStorageMock = {
        getItem: (key) => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => store.set(key, String(value)),
        removeItem: (key) => store.delete(key),
        clear: () => store.clear(),
        key: (index) => [...store.keys()][index] ?? null,
        get length() {
            return store.size;
        }
    };
    window.localStorage = localStorageMock;
    globalThis.localStorage = localStorageMock;
}
