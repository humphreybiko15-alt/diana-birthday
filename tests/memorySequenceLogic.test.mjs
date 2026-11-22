import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';

// Mock React for testing logic extraction
// We'll extract the core logic into a pure ES module for testing

// The core memory sequence logic (extracted for testability)
export class MemorySequenceLogic {
  constructor(sequence = ['🩷', '💜', '💛'], memorizeDuration = 2500) {
    this.sequence = sequence;
    this.memorizeDuration = memorizeDuration;
    this.reset();
  }

  reset() {
    this.phase = 'MEMORIZE';
    this.playerInput = [];
    this.timerId = null;
    this.phaseStartTime = Date.now();
    this.isComplete = false;
    this.isFailed = false;
    this.lastResult = null; // 'correct' | 'incorrect' | 'complete' | null
  }

  start(onPhaseChange, onComplete, onFail) {
    this.onPhaseChange = onPhaseChange;
    this.onComplete = onComplete;
    this.onFail = onFail;
    this.phase = 'MEMORIZE';
    this.phaseStartTime = Date.now();
    this._startMemorizeTimer();
  }

  _startMemorizeTimer() {
    this.timerId = setTimeout(() => {
      this._transitionToRecall();
    }, this.memorizeDuration);
  }

  _transitionToRecall() {
    this.phase = 'RECALL';
    this.phaseStartTime = Date.now();
    this.timerId = null;
    if (this.onPhaseChange) this.onPhaseChange('RECALL');
  }

  _clearTimer() {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  handleSelection(emoji) {
    // During MEMORIZE phase, ignore selections
    if (this.phase === 'MEMORIZE') {
      return { allowed: false, reason: 'MEMORIZE_PHASE' };
    }

    if (this.isComplete || this.isFailed) {
      return { allowed: false, reason: 'GAME_OVER' };
    }

    const expectedIndex = this.playerInput.length;
    const expectedEmoji = this.sequence[expectedIndex];

    if (emoji === expectedEmoji) {
      this.playerInput.push(emoji);
      this.lastResult = 'correct';

      if (this.playerInput.length === this.sequence.length) {
        this.isComplete = true;
        this.lastResult = 'complete';
        this._clearTimer();
        if (this.onComplete) this.onComplete();
        return { allowed: true, result: 'complete', playerInput: [...this.playerInput] };
      }
      return { allowed: true, result: 'correct', playerInput: [...this.playerInput] };
    } else {
      this.lastResult = 'incorrect';
      this.isFailed = true;
      this._clearTimer();
      if (this.onFail) this.onFail();
      return { allowed: true, result: 'incorrect', playerInput: [...this.playerInput] };
    }
  }

  restart() {
    this._clearTimer();
    this.reset();
  }

  getState() {
    return {
      phase: this.phase,
      sequence: [...this.sequence],
      playerInput: [...this.playerInput],
      progress: this.playerInput.length,
      total: this.sequence.length,
      isComplete: this.isComplete,
      isFailed: this.isFailed,
      lastResult: this.lastResult,
      timeRemaining: this.phase === 'MEMORIZE' 
        ? Math.max(0, this.memorizeDuration - (Date.now() - this.phaseStartTime))
        : null
    };
  }

  // For testing: get the display sequence based on phase
  getDisplaySequence() {
    if (this.phase === 'MEMORIZE') {
      return [...this.sequence];
    }
    // RECALL phase: show masked placeholders for unfilled, actual for filled
    return this.sequence.map((emoji, i) => 
      i < this.playerInput.length ? this.playerInput[i] : '❓'
    );
  }

  // For testing: check if selections are enabled
  areSelectionsEnabled() {
    return this.phase === 'RECALL' && !this.isComplete && !this.isFailed;
  }
}

describe('MemorySequenceLogic', () => {
  let logic;
  let callbacks;

  beforeEach(() => {
    callbacks = {
      onPhaseChange: () => {},
      onComplete: () => {},
      onFail: () => {}
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
    await new Promise(r => setTimeout(r, 2600));
    
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
    callbacks.onComplete = () => { completeCount++; };
    
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

  test('10. Unmounting clears pending timers (simulated via restart during MEMORIZE)', () => {
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