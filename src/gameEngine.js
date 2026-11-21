// Pure game engine module — all functions are deterministic and testable
// UTF-8 Base64URL encoding/decoding for profile hashes

const _BASE64_URL_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

/**
 * Deterministically scrambles a name (2–14 letters).
 * Guaranteed not identical to original for names with 2+ unique letters.
 * @param {string} name - The name to scramble
 * @returns {string} The scrambled name
 */
export function scrambleName(name) {
  if (!name || typeof name !== 'string') return name

  const clean = name.trim().split('').filter(c => /[a-zA-Z]/.test(c))

  if (clean.length < 2) return clean.join('')

  // Track unique letters (case-insensitive)
  const unique = [...new Set(clean.map(c => c.toLowerCase()))]
  if (unique.length < 2) return clean.join('')

  // Create a repeatable seed from the name for deterministic shuffle
  let seed = 0
  for (let i = 0; i < clean.length; i++) {
    seed = ((seed * 31) + clean[i].toLowerCase().charCodeAt(0)) % 10007
  }

  // Fisher-Yates shuffle using seeded random
  const chars = [...clean]
  for (let i = chars.length - 1; i > 0; i--) {
    // LCG using our seed
    seed = (seed * 1103515245 + 12345) % 2 ** 31
    const j = seed % (i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }

  // If unchanged by shuffle, reverse the name
  if (chars.join('') === clean.join('')) {
    return [...clean].reverse().join('')
  }

  return chars.join('')
}

/**
 * Encodes a profile object to a base64url string in the URL hash.
 * Safe UTF-8 base64url encoding with validation.
 * @param {object} profile - The profile object
 * @returns {string} The base64url hash string (without #play= prefix)
 */
export function encodeProfileToHash(profile) {
  if (!profile || typeof profile !== 'object') {
    // Return a minimal empty profile hash
    const empty = { partner1Name: 'Player', partner2Name: 'Guesser', firstMet: '', favoriteThing: '', guiltyPleasure: '', dreamSpot: '', secretNote: '' }
    return base64urlEncodeProfile(empty)
  }

  const p = {
    partner1Name: profile.partner1Name || 'Player',
    partner2Name: profile.partner2Name || 'Guesser',
    firstMet: profile.firstMet || 'somewhere special',
    favoriteThing: profile.favoriteThing || 'a secret',
    guiltyPleasure: profile.guiltyPleasure || 'chocolate',
    dreamSpot: profile.dreamSpot || 'under the stars',
    secretNote: profile.secretNote || 'a surprise awaits',
  }

  return base64urlEncodeProfile(p)
}

/** Encode a normalized profile to base64url */
function base64urlEncodeProfile(p) {
  const text = JSON.stringify(p)
  const utf8 = new TextEncoder().encode(text)
  let binary = ''
  utf8.forEach(b => binary += String.fromCharCode(b))
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decodes a base64url hash from the URL, validating and applying fallback defaults.
 * Gracefully ignores malformed hashes. Never uses dangerouslySetInnerHTML.
 * @param {string} hash - The URL hash (e.g. "#play=<base64url>" or just the base64url)
 * @returns {object} - Result object with ok flag and profile
 */
export function decodeProfileFromHash(hash) {
  if (!hash || typeof hash !== 'string') {
    return { ok: false, profile: {} }
  }

  try {
    // Extract base64url portion — handle both #play= prefix and bare hash
    let b64 = hash.trim()
    // Remove #play= if present
    if (b64.startsWith('#play=')) {
      b64 = b64.slice(6)
    }
    // Remove leading # if present
    if (b64.startsWith('#')) {
      b64 = b64.slice(1)
    }

    // Validate: base64url chars are [A-Za-z0-9_-]
    if (!/^[A-Za-z0-9_-]+$/.test(b64)) {
      return { ok: false, profile: {} }
    }

    // Decode: reverse base64url
    let s = b64.replace(/[-_]/g, (c) => c === '+' ? '+' : c === '/' ? '/' : '')
    // Pad with = to make length multiple of 4
    while (s.length % 4) s += '='
    const binary = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
    const utf8 = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      utf8[i] = binary.charCodeAt(i)
    }

    const decoder = new TextDecoder('utf-8')
    const text = decoder.decode(utf8)

    const p = JSON.parse(text)

    const profile = {
      partner1Name: p.partner1Name || 'Player',
      partner2Name: p.partner2Name || 'Guesser',
      firstMet: p.firstMet || 'somewhere special',
      favoriteThing: p.favoriteThing || 'a secret',
      guiltyPleasure: p.guiltyPleasure || 'chocolate',
      dreamSpot: p.dreamSpot || 'under the stars',
      secretNote: p.secretNote || 'a surprise awaits',
    }

    return { ok: true, profile }
} catch {
  // Any error during decoding = malformed hash, gracefully ignore
  return { ok: false, profile: {} }
}
}

/**
 * Builds at least 5 personalized quiz rounds for the couple's mind-reader quiz.
 * Mixes the couple's real inputs with fun randomized distractors and couple-trap questions.
 * @param {object} profile - The couple profile {partner1Name, partner2Name, firstMet, favoriteThing, guiltyPleasure, dreamSpot, secretNote}
 * @param {string} path - The current path ('fate' or 'flame')
 * @returns {array} Array of question objects
 */
export function buildMindReaderQuestions(profile, path) {
  const { partner1Name, partner2Name, firstMet, favoriteThing, guiltyPleasure, dreamSpot } = profile

  // Helper: get a random element from an array
  const randomItem = arr => arr[Math.floor(Math.random() * arr.length)]

  // Pools of distractors
  const metLocations = [
    'Westlands coffee shop',
    'Campus library',
    'Rooftop garden',
    'Street tacos stand',
    'Beach bonfire',
    'Art museum',
    'Old movie theater',
    'Rainy bus stop',
  ]
  const favoriteThings = [
    'Blue shirt',
    'Late-night drives',
    'Street tacos',
    'Morning coffee',
    'Vintage vinyl',
    'Rainy walks',
    'Street art',
    'Sunset views',
  ]
  const guiltyPleasures = [
    'Chocolate cake',
    'Pizza at 3am',
    'Late-night gaming',
    'Sparkling water',
    'Midnight ice cream',
    'Romance novels',
    'Coffee binge',
    'Video game marathons',
  ]
  const dreamVibes = [
    'Rooftop party',
    'Beach bonfire',
    'Midnight ski trip',
    'Rooftop dinner',
    'Garden wedding',
    'Cruise under stars',
    'Cozy cabin',
    'Sunset yacht',
  ]

  const _partnerNames = [partner1Name, partner2Name, 'Alex', 'Jordan', 'Casey', 'Riley']

  // Build 5+ questions mixing real inputs with distractors
  const questions = [
    {
      id: 1,
      type: 'multiple-choice',
      question: `What is ${partner1Name}'s favorite thing / weakness?`,
      options: [
        favoriteThing,
        randomItem(favoriteThings),
        randomItem(favoriteThings),
        randomItem(favoriteThings),
      ],
      correctIndex: 0,
      trap: false,
    },
    {
      id: 2,
      type: 'multiple-choice',
      question: `Where did ${partner1Name} and ${partner2Name} first meet?`,
      options: [
        firstMet,
        randomItem(metLocations),
        randomItem(metLocations),
        randomItem(metLocations),
      ],
      correctIndex: 0,
      trap: false,
    },
    {
      id: 3,
      type: 'multiple-choice',
      question: `What is ${partner1Name}'s biggest guilty pleasure / favorite treat?`,
      options: [
        guiltyPleasure,
        randomItem(guiltyPleasures),
        randomItem(guiltyPleasures),
        randomItem(guiltyPleasures),
      ],
      correctIndex: 0,
      trap: false,
    },
    {
      id: 4,
      type: 'multiple-choice',
      question: `What is your dream getaway / party vibe?`,
      options: [
        dreamSpot,
        randomItem(dreamVibes),
        randomItem(dreamVibes),
        randomItem(dreamVibes),
      ],
      correctIndex: 0,
      trap: false,
    },
    {
      id: 5,
      type: 'multiple-choice',
      question: `💜 Couple Trap: Which of these is ${partner1Name}'s secret favorite?`,
      options: [
        `${guiltyPleasure} — the real one!`,
        'Chocolate cake',
        'Late-night drives',
        'Sparkling water',
      ],
      correctIndex: 0,
      trap: true,
      hint: 'Think about what they mentioned first!',
    },
    {
      id: 6,
      type: 'true-false',
      question: `⚡️ True or False: ${partner2Name} can read ${partner1Name}'s mind about ${favoriteThing}.`,
      correct: false,
      trap: true,
      explanation: 'Maybe... but not yet! 😏',
    },
    {
      id: 7,
      type: 'multiple-choice',
      question: `🔥 Fate vs. Flame: If you chose "Follow Fate" at the crossroads, where would it take you?`,
      options: [
        `Back to ${firstMet}`,
        'A quiet library',
        'A random street corner',
        'Your first date spot',
      ],
      correctIndex: 0,
      pathSpecific: path === 'fate',
    },
  ]

  return questions
}

/**
 * Computes the couple's archetype based on Fate vs. Flame balance and accuracy.
 * @param {object} params - { fateScore, flameScore, syncScore, totalQuestions }
 * @returns {object} { title, emoji, summary, syncPercent }
 */
export function computeCoupleArchetype({ fateScore, flameScore, syncScore, _totalQuestions }) {
  const total = fateScore + flameScore + syncScore
  const fatePercent = total > 0 ? Math.round((fateScore / total) * 100) : 50
  const flamePercent = total > 0 ? Math.round((flameScore / total) * 100) : 50
  // Sync percent based on how many questions were answered correctly-ish
  const syncPercent = Math.min(100, Math.max(0, syncScore + Math.round(50 * (1 - Math.abs(fatePercent - flamePercent) / 100))))

  let title, emoji, summary

  if (fatePercent > flamePercent * 1.5) {
    // Fate-dominated
    title = 'Destined Partners 🌟'
    emoji = '✨'
    summary = 'You are guided by fate — your connection feels written in the stars. The universe brought you together for a reason, and every twist of destiny strengthens your bond. Keep following the signs!'
  } else if (flamePercent > fatePercent * 1.5) {
    // Flame-dominated
    title = 'Passion Ignited 🔥'
    emoji = '🔥'
    summary = 'You have a flame that burns bright — passion, excitement, and adventure course through your veins. Your relationship is a wild, beautiful ride, and the heat between you keeps things ever-evolving.'
  } else {
    // Balanced
    title = 'Harmonic Balance ⚖️'
    emoji = '⚖️'
    summary = 'You share a beautiful balance of fate and flame — destiny meets passion in perfect harmony. Your sync is strong, and you complement each other\'s shadows and light equally.'
  }

  return {
    title,
    emoji,
    summary,
    syncPercent: syncPercent > 100 ? 100 : syncPercent < 0 ? 0 : syncPercent,
  }
}