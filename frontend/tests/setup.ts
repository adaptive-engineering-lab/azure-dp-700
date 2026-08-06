import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node 22+ exposes an experimental `localStorage` global that stays undefined
// unless the process is started with --localstorage-file. It shadows the jsdom
// instance vitest would otherwise install, so window.localStorage lands as
// undefined and every test touching storage dies in the hooks below.
//
// Reinstate a working Storage backed by jsdom's own Storage.prototype, so the
// specs that spy on Storage.prototype (see unit/storage-adapter.test.ts) still
// intercept these calls. Each instance gets its own map — localStorage and
// sessionStorage must not share state.
if (typeof window !== 'undefined' && !window.localStorage) {
  const stores = new WeakMap<Storage, Map<string, string>>();
  const storeFor = (s: Storage): Map<string, string> => {
    let m = stores.get(s);
    if (!m) {
      m = new Map();
      stores.set(s, m);
    }
    return m;
  };

  Object.assign(Storage.prototype, {
    getItem(this: Storage, key: string): string | null {
      const m = storeFor(this);
      return m.has(String(key)) ? m.get(String(key))! : null;
    },
    setItem(this: Storage, key: string, value: string): void {
      storeFor(this).set(String(key), String(value));
    },
    removeItem(this: Storage, key: string): void {
      storeFor(this).delete(String(key));
    },
    clear(this: Storage): void {
      storeFor(this).clear();
    },
    key(this: Storage, index: number): string | null {
      return Array.from(storeFor(this).keys())[index] ?? null;
    },
  });
  Object.defineProperty(Storage.prototype, 'length', {
    get(this: Storage) {
      return storeFor(this).size;
    },
    configurable: true,
  });

  for (const name of ['localStorage', 'sessionStorage'] as const) {
    const instance = Object.create(Storage.prototype) as Storage;
    Object.defineProperty(window, name, { value: instance, configurable: true, writable: true });
    Object.defineProperty(globalThis, name, { value: instance, configurable: true, writable: true });
  }
}

// Tests run without a real Vite build, so Vite env vars are undefined.
// Provide dummy values so the env validator and the Supabase client factory
// don't throw at import time. Tests that actually exercise Supabase mock it.
vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:54321');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
