// Game Engine Module Tests
// Using Node's built-in test runner (node:test) with assert import

import { test } from 'node:test'
import assert from 'node:assert'
import { scrambleName } from '../src/gameEngine.js'
import { encodeProfileToHash, decodeProfileFromHash } from '../src/gameEngine.js'
import { buildMindReaderQuestions } from '../src/gameEngine.js'
import { computeCoupleArchetype } from '../src/gameEngine.js'

// Helper: check if string includes substring
const includes = (str, substr) => {
  assert.ok(str.includes(substr), `Expected "${str}" to include "${substr}"`)
}

// ============================================================
// scrambleName tests
// ============================================================

test('scrambleName scrambles a simple 2-letter name', () => {
  const result = scrambleName('AB')
  assert.notEqual(result, 'AB')
  assert(typeof result === 'string')
})

test('scrambleName scrambles a 5-letter name deterministically', () => {
  const result1 = scrambleName('Diana')
  const result2 = scrambleName('Diana')
  assert.equal(result1, result2) // Deterministic
  assert.notEqual(result1, 'Diana')
})

test('scrambleName returns same name if only 1 unique letter', () => {
  const result = scrambleName('AAA')
  assert.equal(result, 'AAA')
})

test('scrambleName returns same name if name is empty', () => {
  const result = scrambleName('')
  assert.equal(result, '')
})

test('scrambleName returns scrambled name if name has 2+ unique letters', () => {
  const result = scrambleName('Ab')
  assert.notEqual(result, 'Ab')
})

test('scrambleName handles single character name', () => {
  const result = scrambleName('A')
  assert.equal(result, 'A')
})

// ============================================================
// encodeProfileToHash / decodeProfileFromHash tests
// ============================================================

test('encodes and decodes a full profile correctly', () => {
  const profile = {
    partner1Name: 'Alex',
    partner2Name: 'Jordan',
    firstMet: 'Westlands coffee shop',
    favoriteThing: 'Late-night drives',
    guiltyPleasure: 'Chocolate cake',
    dreamSpot: 'Rooftop party',
    secretNote: 'Dinner & massage on me tonight'
  }

  const hash = encodeProfileToHash(profile)
  assert(typeof hash === 'string')
  assert(hash.length > 0)

  const decoded = decodeProfileFromHash(`#play=${hash}`)
  assert.ok(decoded.ok)
  assert.ok(decoded.profile)
  assert.equal(decoded.profile.partner1Name, 'Alex')
  assert.equal(decoded.profile.partner2Name, 'Jordan')
  assert.equal(decoded.profile.firstMet, 'Westlands coffee shop')
})

test('gracefully handles malformed hash', () => {
  const decoded = decodeProfileFromHash('#play=invalid!!!')
  assert.ok(!decoded.ok)
})

test('handles empty hash gracefully', () => {
  const decoded = decodeProfileFromHash('')
  assert.ok(!decoded.ok)
})

test('handles hash without #play= prefix', () => {
  const profile = { partner1Name: 'Test', partner2Name: 'User' }
  const hash = encodeProfileToHash(profile)
  const decoded = decodeProfileFromHash(hash)
  assert.ok(decoded.ok)
})

test('applies fallback defaults when profile has missing fields', () => {
  const profile = {} // Minimal profile
  const hash = encodeProfileToHash(profile)
  const decoded = decodeProfileFromHash(`#play=${hash}`)
  assert.ok(decoded.ok)
  // Should have defaults
  assert.equal(decoded.profile.partner1Name, 'Player')
  assert.equal(decoded.profile.partner2Name, 'Guesser')
})

// ============================================================
// buildMindReaderQuestions tests
// ============================================================

test('generates at least 5 questions', () => {
  const profile = {
    partner1Name: 'Alex',
    partner2Name: 'Jordan',
    firstMet: 'Westlands coffee shop',
    favoriteThing: 'Late-night drives',
    guiltyPleasure: 'Chocolate cake',
    dreamSpot: 'Rooftop party'
  }

  const questions = buildMindReaderQuestions(profile, 'fate')
  assert.ok(questions.length >= 5, `Expected at least 5 questions, got ${questions.length}`)
})

test('includes real couple inputs in questions and options', () => {
  const profile = {
    partner1Name: 'Casey',
    partner2Name: 'Riley',
    firstMet: 'Campus library',
    favoriteThing: 'Blue shirt',
    guiltyPleasure: 'Late-night gaming',
    dreamSpot: 'Beach bonfire'
  }

  const questions = buildMindReaderQuestions(profile, 'flame')

  // Check that real inputs appear in question text and options
  const allText = [
    ...questions.map(q => q.question),
    ...(questions.flatMap ? questions.flatMap(q => q.options || []) : [])
  ].join(' ')
  assert.ok(allText.toLowerCase().includes('campus library'))
  assert.ok(allText.toLowerCase().includes('blue shirt'))
  assert.ok(allText.toLowerCase().includes('late-night gaming'))
  assert.ok(allText.toLowerCase().includes('beach bonfire'))
})

test('includes path-specific questions', () => {
  const profile = {
    partner1Name: 'Morgan',
    partner2Name: 'Alex',
    firstMet: 'Art museum',
    favoriteThing: 'Vinyl records',
    guiltyPleasure: 'Sparkling water',
    dreamSpot: 'Cruise under stars'
  }

  const fateQuestions = buildMindReaderQuestions(profile, 'fate')
  const flameQuestions = buildMindReaderQuestions(profile, 'flame')

  // Fate questions should reference fate
  const fateText = fateQuestions.map(q => q.question).join(' ')
  assert.ok(fateText.includes('Fate'))

  // Flame questions should reference flame
  const flameText = flameQuestions.map(q => q.question).join(' ')
  assert.ok(flameText.includes('Flame'))
})

test('includes distractor options', () => {
  const profile = {
    partner1Name: 'Taylor',
    partner2Name: 'Jamie',
    firstMet: 'Cafe downtown',
    favoriteThing: 'Rainy walks',
    guiltyPleasure: 'Ice cream',
    dreamSpot: 'Mountain cabin'
  }

  const questions = buildMindReaderQuestions(profile, 'fate')
  // Each question should have options (at least for some)
  const qWithOptions = questions.find(q => q.options && q.options.length > 0)
  assert.ok(qWithOptions, 'Expected at least one question with options')
  includes(qWithOptions.question, 'Taylor')
})

test('computeCoupleArchetype classifies fate, flame, and balanced scores', () => {
  const fate = computeCoupleArchetype({ fateScore: 90, flameScore: 10, syncScore: 4, totalQuestions: 6 })
  assert.ok(fate.title.includes('Destined'))
  assert.ok(fate.syncPercent >= 0 && fate.syncPercent <= 100)

  const flame = computeCoupleArchetype({ fateScore: 10, flameScore: 90, syncScore: 5, totalQuestions: 6 })
  assert.ok(flame.title.includes('Passion'))

  const balanced = computeCoupleArchetype({ fateScore: 50, flameScore: 50, syncScore: 5, totalQuestions: 6 })
  assert.ok(balanced.title.includes('Harmonic'))
})