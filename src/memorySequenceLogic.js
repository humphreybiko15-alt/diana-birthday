/* ═══════════════════════════════════════════════════════════════════════════════
   Memory Sequence Logic — pure, framework-free state machine for Stage 4
   Two-phase gameplay: MEMORIZE (timed) → RECALL (player reproduces sequence)
   ═════════════════════════════════════════════════════════════════════════════════════ */

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
    this.onPhaseChange = null;
    this.onComplete = null;
    this.onFail = null;
  }

  start(onPhaseChange, onComplete, onFail) {
    this.onPhaseChange = onPhaseChange;
    this.onComplete = onComplete;
    this.onFail = onFail;
    this.phase = 'MEMORIZE';
    this.playerInput = [];
    this.isComplete = false;
    this.isFailed = false;
    this.lastResult = null;
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

  restart(onPhaseChange, onComplete, onFail) {
    // Preserve callbacks if not provided (allows restart without re-registering)
    const nextPhaseChange = onPhaseChange ?? this.onPhaseChange;
    const nextComplete = onComplete ?? this.onComplete;
    const nextFail = onFail ?? this.onFail;

    this._clearTimer();
    this.reset();
    // Restore callbacks after reset
    this.onPhaseChange = nextPhaseChange;
    this.onComplete = nextComplete;
    this.onFail = nextFail;

    // Restart a fresh memorize phase
    this.phase = 'MEMORIZE';
    this.phaseStartTime = Date.now();
    this._startMemorizeTimer();
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
        : null,
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
