import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { compressState, decompressState, getShareableUrl, parseUrlState, updateUrlState } from '../src/urlState.js';

const RECIPIENT = 'Humph';
const MESSAGE = "You cracked all 7 — blue shirt, road kiss and all 👑💜";

const makeFakeWindow = (hash = '') => ({
  location: {
    origin: 'https://example.com',
    pathname: '/diana-birthday/',
    hash,
  },
  history: {
    replaceState: (...args) => args,
  },
});

// --- install / restore fake window globals around each test ---
let origWindow;
beforeEach(() => {
  origWindow = globalThis.window;
  globalThis.window = makeFakeWindow();
});
afterEach(() => {
  globalThis.window = origWindow;
});

describe('compressState / decompressState', () => {
  test('round-trips a state object through compression', () => {
    const state = { recipientName: RECIPIENT, customMessage: MESSAGE, stages: [{ id: 1 }], createdAt: 1234567890 };
    const compressed = compressState(state);
    assert.strictEqual(typeof compressed, 'string');
    assert.notEqual(compressed, '');

    const restored = decompressState(compressed);
    assert.deepStrictEqual(restored, state);
  });

  test('preserves unicode / emoji in customMessage', () => {
    const state = { recipientName: 'Humph 💜', customMessage: 'road kiss 👑💋' };
    const restored = decompressState(compressState(state));
    assert.strictEqual(restored.recipientName, 'Humph 💜');
    assert.strictEqual(restored.customMessage, 'road kiss 👑💋');
  });

  test('returns null for empty / invalid hash', () => {
    assert.strictEqual(decompressState('', 1) && decompressState(''), null);
    assert.strictEqual(decompressState('!!!not-base64!!!'), null);
    assert.strictEqual(decompressState(null), null);
  });

  test('applies defaults when fields are missing', () => {
    const restored = decompressState(compressState({ recipientName: 'Ada' }));
    assert.strictEqual(restored.recipientName, 'Ada');
    assert.strictEqual(restored.customMessage, '');
    assert.ok(Array.isArray(restored.stages));
    assert.strictEqual(restored.stages.length, 0);
    assert.strictEqual(typeof restored.createdAt, 'number');
  });

  test('getShareableUrl round-trips state with emoji', () => {
    const state = { recipientName: 'Humph 💜', customMessage: 'road kiss 👑💋' };
    const url = getShareableUrl(state);
    assert.ok(url.startsWith('https://example.com/diana-birthday/#'), url);
    const hash = url.split('#')[1];
    const parsed = decompressState(hash);
    assert.strictEqual(parsed.recipientName, state.recipientName);
    assert.strictEqual(parsed.customMessage, state.customMessage);
  });
});

describe('getShareableUrl', () => {
  test('returns a full URL containing the compressed hash', () => {
    const state = { recipientName: RECIPIENT, customMessage: MESSAGE };
    const url = getShareableUrl(state);
    assert.ok(url.startsWith('https://example.com/diana-birthday/#'), url);
    const hash = url.split('#')[1];
    assert.ok(hash.length > 0);

    // The hash should round-trip back to the same state (decompressState adds defaults)
    const parsed = decompressState(hash);
    assert.strictEqual(parsed.recipientName, state.recipientName);
    assert.strictEqual(parsed.customMessage, state.customMessage);
  });

  test('falls back to origin+pathname when compression fails', () => {
    const url = getShareableUrl(null);
    assert.ok(url.startsWith('https://example.com/diana-birthday/#'), url);
    assert.ok(decompressState(url.split('#')[1]) === null || typeof decompressState(url.split('#')[1]) === 'object');
  });
});

describe('parseUrlState', () => {
  test('reads state from window.location.hash', () => {
    const state = { recipientName: RECIPIENT, customMessage: MESSAGE };
    const compressed = compressState(state);
    globalThis.window.location.hash = '#' + compressed;

    const parsed = parseUrlState();
    assert.strictEqual(parsed.recipientName, state.recipientName);
    assert.strictEqual(parsed.customMessage, state.customMessage);
  });

  test('returns null when there is no hash', () => {
    globalThis.window.location.hash = '';
    assert.strictEqual(parseUrlState(), null);
  });

  test('handles hash with or without leading #', () => {
    const state = { recipientName: 'Ada' };
    const compressed = compressState(state);
    globalThis.window.location.hash = compressed; // no leading #
    const parsed = parseUrlState();
    assert.strictEqual(parsed.recipientName, state.recipientName);
  });
});

describe('updateUrlState', () => {
  test('calls history.replaceState with the hashed url', () => {
    const state = { recipientName: RECIPIENT, customMessage: MESSAGE };
    const calls = [];
    globalThis.window.history.replaceState = (...args) => calls.push(args);

    updateUrlState(state);

    assert.strictEqual(calls.length, 1);
    assert.ok(calls[0][2].includes('#'), calls[0][2]);
    const hashPart = calls[0][2].split('#')[1];
    assert.ok(hashPart, 'hash part should exist');
    const parsed = decompressState(hashPart);
    assert.strictEqual(parsed.recipientName, state.recipientName);
    assert.strictEqual(parsed.customMessage, state.customMessage);
  });
});
