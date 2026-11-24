/* ═══════════════════════════════════════════════════════════════════════════════
   URL State Engine — client-side shareable links with compression
   Uses built-in btoa/atob + JSON (no external dependencies)
   Stores state in window.location.hash to avoid server routing issues
   ═════════════════════════════════════════════════════════════════════════════════════ */

// Maximum URL hash length (browser limit ~2000 chars, leave margin)
const MAX_HASH_LENGTH = 1800;

/**
 * Compress state object to URL-safe base64 string
 * @param {Object} state - The state to compress
 * @returns {string} Compressed base64 string
 */
export function compressState(state) {
  try {
    const json = JSON.stringify(state);
    // Use built-in btoa for base64 encoding
    const compressed = btoa(json);
    return compressed;
  } catch (e) {
    console.error('Failed to compress state:', e);
    return '';
  }
}

/**
 * Decompress state from URL-safe base64 string
 * @param {string} hash - The hash string (without #)
 * @returns {Object|null} Decompressed state or null if invalid
 */
export function decompressState(hash) {
  if (!hash || hash.length === 0) return null;
  
  try {
    // Remove any leading # if present
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const json = atob(cleanHash);
    const state = JSON.parse(json);
    
    // Validate required fields
    if (!state || typeof state !== 'object') return null;
    
    // Ensure defaults for missing fields
    return {
      recipientName: state.recipientName || 'Mali',
      customMessage: state.customMessage || '',
      stages: state.stages || [],
      createdAt: state.createdAt || Date.now(),
      ...state
    };
  } catch (e) {
    console.warn('Failed to decompress state from hash:', hash, e);
    return null;
  }
}

/**
 * Get the shareable URL for current state
 * @param {Object} state - The state to encode
 * @returns {string} Full shareable URL
 */
export function getShareableUrl(state) {
  const compressed = compressState(state);
  if (!compressed) return window.location.origin + window.location.pathname;
  
  const hash = '#' + compressed;
  
  // Check length
  if (hash.length > MAX_HASH_LENGTH) {
    console.warn('Share URL hash exceeds safe length, truncating stages');
    // Try truncating stages array
    const truncatedState = { ...state, stages: state.stages?.slice(0, 5) || [] };
    const truncatedCompressed = compressState(truncatedState);
    if (truncatedCompressed) {
      return window.location.origin + window.location.pathname + '#' + truncatedCompressed;
    }
    // Fallback: minimal state
    const minimalState = { recipientName: state.recipientName, customMessage: state.customMessage };
    const minimalCompressed = compressState(minimalState);
    if (minimalCompressed) {
      return window.location.origin + window.location.pathname + '#' + minimalCompressed;
    }
  }
  
  return window.location.origin + window.location.pathname + hash;
}

/**
 * Parse current URL hash for state
 * @returns {Object|null} Decompressed state or null
 */
export function parseUrlState() {
  const hash = window.location.hash;
  return decompressState(hash);
}

/**
 * Update URL hash without page reload
 * @param {Object} state - The state to encode
 */
export function updateUrlState(state) {
  const url = getShareableUrl(state);
  const hash = url.split('#')[1] || '';
  window.history.replaceState(null, '', '#' + hash);
}

/**
 * Default game state for fallback
 */
export const DEFAULT_STATE = {
  recipientName: 'Mali',
  customMessage: "You cracked all 7 — blue shirt, road kiss and all 👑💜",
  stages: [
    { id: 1, type: 'scramble', targetWord: 'MALI', clue: "Who's the Birthday Star?" },
    { id: 2, type: 'year', clue: "What year was Mali born?", answerRange: [1980, 2010] },
    { id: 3, type: 'emoji', emojis: '🌟 👑 🎉', question: 'What do these emojis represent?', options: ['Party Animal', 'Birthday Queen', 'Music Lover', 'Night Owl'], correctIndex: 1 },
    { id: 4, type: 'memory', sequence: ['🩷', '💜', '💛'] },
    { id: 5, type: 'runaway' },
    { id: 6, type: 'quiz', headline: "Test Your Memory 👀", emojiClue: '👕 🎨 💭', question: "What color was my shirt on our very first date?", options: ['Red', 'Blue', 'Black', 'White'], correctIndex: 1, successMsg: "💙 That blue shirt... it looked good, right?", wrongMsg: "Come on, you definitely remember! 😄" },
    { id: 7, type: 'quiz', headline: "Never Forget This One 💋", emojiClue: '💋 📍 🌙', question: "Where did we share our very first kiss?", options: ['At a restaurant', 'At home', 'On the road', 'At school'], correctIndex: 2, successMsg: "🛣️ On the road... best spontaneous moment ever 💋", wrongMsg: "Think back to that night... 🌙" }
  ],
  createdAt: Date.now()
};