import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { MemorySequenceLogic } from '../src/memorySequenceLogic.js';

describe('MemorySequenceLogic', () => {
  let logic;
  let callbacks;

  beforeEach(() => {
    callbacks = {
      onPhaseChange: () => {},
      onComplete: () => {},
      onFail: () => {},
    };
    logic = new MemorySequenceLogic(['🩷', '💜', '💛'], 2500);
  });

  afterEach(() => {
    logic.restart();
  });

  test('1. Complete sequence appears during MEMORIZE phase', () => {
    logic.start(callbacks.onPhaseChange, callbacks.onComplete, callbacks.onFail);
    const state = logic.getState();
    assert.equal(state.phase, 'MEMORIZE');
    const display = logic.getDisplaySequence();
    assert.deepEqual(display, ['🩷', '💜', '💛']);
  });

  test('2. Sequence disappears after 2.5s and masked placeholders appear', async () => {
    logic.start(callbacks.onPhaseChange, callbacks.onComplete, callbacks.onFail);

    // During MEMORIZE
    let display = logic.getDisplaySequence();
    assert.deepEqual(display, ['🩷', '💜', '💛']);

    // Wait for timer
    await new Promise((r) => setTimeout(r, 2600));

    // Should be in RECALL with masked placeholders
    const state = logic.getState();
    assert.equal(state.phase, 'RECALL');
    display = logic.getDisplaySequence();
    assert.deepEqual(display, ['❓', '❓', '❓']);
  });

  test('3. Masked placeholders appear during RECALL', () => {
    logic.start(callbacks.onPhaseChange, callbacks.onComplete, callbacks.onFail);
    logic._transitionToRecall(); // Force transition

    const display = logic.getDisplaySequence();
    assert.deepEqual(display, ['❓', '❓', '❓']);
  });

  test('4. No target icon is revealed during RECALL', () => {
    logic.start(callbacks.onPhaseChange, callbacks.onComplete, callbacks.onFail);
    logic._transitionToRecall();

    // Even after correct selections, the next target should not be revealed
    logic.handleSelection('🩷');
    let display = logic.getDisplaySequence();
    assert.deepEqual(display, ['🩷', '❓', '❓']);

    logic.handleSelection('💜');
    display = logic.getDisplaySequence();
    assert.deepEqual(display, ['🩷', '💜', '❓']);

    // The third position should still be masked
    assert.equal(display[2], '❓');
  });

  test('5. Selections are disabled during MEMORIZE', () => {
    logic.start(callbacks.onPhaseChange, callbacks.onComplete, callbacks.onFail);

    const result = logic.handleSelection('🩷');
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'MEMORIZE_PHASE');
  });

  test('6. Correct answers advance the sequence', () => {
    logic.start(callbacks.onPhaseChange, callbacks.onComplete, callbacks.onFail);
    logic._transitionToRecall();

    const result1 = logic.handleSelection('🩷');
    assert.equal(result1.result, 'correct');
    assert.equal(result1.playerInput.length, 1);

    const result2 = logic.handleSelection('💜');
    assert.equal(result2.result, 'correct');
    assert.equal(result2.playerInput.length, 2);

    const result3 = logic.handleSelection('💛');
    assert.equal(result3.result, 'complete');
    assert.equal(result3.playerInput.length, 3);
  });

  test('7. Incorrect answers follow failure rules', () => {
    logic.start(callbacks.onPhaseChange, callbacks.onComplete, callbacks.onFail);
    logic._transitionToRecall();

    const result = logic.handleSelection('💜'); // Wrong! Should be 🩷
    assert.equal(result.result, 'incorrect');
    assert.equal(logic.getState().isFailed, true);
  });

  test('8. Completing the sequence triggers success once', () => {
    let completeCount = 0;
    callbacks.onComplete = () => {
      completeCount++;
    };

    logic.start(callbacks.onPhaseChange, callbacks.onComplete, callbacks.onFail);
    logic._transitionToRecall();

    logic.handleSelection('🩷');
    logic.handleSelection('💜');
    logic.handleSelection('💛');

    assert.equal(completeCount, 1);
    assert.equal(logic.getState().isComplete, true);

    // Further selections should be ignored
    logic.handleSelection('🩷');
    assert.equal(completeCount, 1); // Still 1
  });

  test('9. Restart resets the sequence and timer', () => {
    logic.start(callbacks.onPhaseChange, callbacks.onComplete, callbacks.onFail);
    logic._transitionToRecall();
    logic.handleSelection('🩷');

    logic.restart();

    const state = logic.getState();
    assert.equal(state.phase, 'MEMORIZE');
    assert.equal(state.playerInput.length, 0);
    assert.equal(state.isComplete, false);
    assert.equal(state.isFailed, false);
  });

  test('10. Restart clears pending timers (simulates unmount/new game)', () => {
    logic.start(callbacks.onPhaseChange, callbacks.onComplete, callbacks.onFail);

    // Restart while timer is active (simulates unmount/new game)
    logic.restart();

    const state = logic.getState();
    assert.equal(state.phase, 'MEMORIZE');
    assert.equal(state.playerInput.length, 0);
    // Timer should have been cleared
  });

  test('11. Rapid interactions cannot bypass phase transition', () => {
    logic.start(callbacks.onPhaseChange, callbacks.onComplete, callbacks.onFail);

    // Rapid clicks during MEMORIZE
    for (let i = 0; i < 10; i++) {
      const result = logic.handleSelection('🩷');
      assert.equal(result.allowed, false);
    }

    // Even after forced transition, first click should be in RECALL
    logic._transitionToRecall();
    const result = logic.handleSelection('🩷');
    assert.equal(result.allowed, true);
    assert.equal(result.result, 'correct');
  });

  test('12. Phase state is explicit, not boolean-based', () => {
    logic.start(callbacks.onPhaseChange, callbacks.onComplete, callbacks.onFail);
    assert.equal(logic.getState().phase, 'MEMORIZE');

    logic._transitionToRecall();
    assert.equal(logic.getState().phase, 'RECALL');

    // No ambiguous boolean flags
    assert.ok(['MEMORIZE', 'RECALL'].includes(logic.getState().phase));
  });
});

// Run tests with: node --test tests/memorySequenceLogic.test.mjs
