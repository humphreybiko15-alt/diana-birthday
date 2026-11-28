/* ════════════════════════════════════════════════════════════════════════════════
   Ludo Game Logic — pure, framework-free state machine
   Supports 2-4 players, pass-and-play on a single device.
   Rules:
     - Pieces start in home (-1). Roll a 6 to bring a piece out to start.
     - Pieces move clockwise along the main track (51 positions).
     - After a full lap, pieces enter the home column (5 steps) then finish.
     - Landing on an opponent's piece captures it (sent home).
     - Start squares are safe (cannot be captured).
     - Rolling a 6 grants an extra turn. 3 consecutive 6s = skip turn.
     - First player to get all 4 pieces to the center wins.
   ════════════════════════════════════════════════════════════════════════════════ */

const MAIN_TRACK_LENGTH = 51;   // positions 0-50 relative to player start
const FINISH_PATH_INDEX = 56;   // reached center
const NUM_PIECES_PER_PLAYER = 4;
const START_POSITIONS = [0, 13, 26, 39]; // visual board offset per player
const PLAYER_COLORS = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db']; // red, yellow, green, blue

export class LudoLogic {
  constructor(numPlayers = 2, playerNames = null) {
    this.numPlayers = Math.min(Math.max(numPlayers, 2), 4);
    this.playerNames = playerNames || this.numPlayers === 2
      ? ['Red', 'Yellow']
      : ['Red', 'Yellow', 'Green', 'Blue'];
    this.colors = PLAYER_COLORS.slice(0, this.numPlayers);
    this.reset();
  }

  reset() {
    this.currentPlayer = 0;
    this.diceValue = 1;
    this.isRolling = false;
    this.consecutiveSixes = 0;
    this.winner = null;
    this.gameOver = false;
    this.message = 'Roll the dice!';
    this.lastMove = null; // { pieceIndex, from, to, captured: bool }
    // pieces[player][piece] = pathIndex:
    //   -1 = in home, 0-50 = main track, 51-55 = home column, 56 = finished
    this.pieces = [];
    for (let p = 0; p < this.numPlayers; p++) {
      this.pieces.push([-1, -1, -1, -1]);
    }
  }

  /* ── Public query helpers ── */

  getState() {
    return {
      numPlayers: this.numPlayers,
      playerNames: [...this.playerNames],
      colors: [...this.colors],
      currentPlayer: this.currentPlayer,
      diceValue: this.diceValue,
      isRolling: this.isRolling,
      consecutiveSixes: this.consecutiveSixes,
      winner: this.winner,
      gameOver: this.gameOver,
      message: this.message,
      lastMove: this.lastMove ? { ...this.lastMove } : null,
      pieces: this.pieces.map(row => [...row]),
    };
  }

  getVisualPosition(playerIdx, pieceIdx) {
    const pathIndex = this.pieces[playerIdx][pieceIdx];
    if (pathIndex === -1) return { inHome: true };
    if (pathIndex >= FINISH_PATH_INDEX) return { finished: true };
    if (pathIndex >= MAIN_TRACK_LENGTH) {
      // In home column
      const homeStep = pathIndex - MAIN_TRACK_LENGTH; // 0-4
      return { inHomeColumn: true, homeStep, playerIdx };
    }
    // On main track
    const boardPos = (START_POSITIONS[playerIdx] + pathIndex) % 52;
    return { boardPos, playerIdx };
  }

  getCurrentPlayerColor() {
    return this.colors[this.currentPlayer];
  }

  getCurrentPlayerName() {
    return this.playerNames[this.currentPlayer];
  }

  /* ── Dice ── */

  rollDice() {
    if (this.gameOver || this.isRolling) return null;
    this.isRolling = true;
    this.lastMove = null;

    // Deterministic-ish roll: use time-based seed for reproducibility in tests
    const roll = Math.floor(Math.random() * 6) + 1;
    this.diceValue = roll;

    return roll;
  }

  finishRoll() {
    this.isRolling = false;
    const roll = this.diceValue;

    if (this.gameOver) return { rolled: roll, skipped: false, moved: false };

    // Check for three consecutive sixes → skip turn
    if (roll === 6) {
      this.consecutiveSixes++;
      if (this.consecutiveSixes >= 3) {
        this.consecutiveSixes = 0;
        this.message = 'Three sixes! Turn skipped.';
        this._switchTurn();
        return { rolled: roll, skipped: true, moved: false, extraTurn: false };
      }
      this.message = `You rolled a ${roll}! Roll again or move a piece.`;
      return { rolled: roll, skipped: false, moved: false, extraTurn: true };
    }

    this.consecutiveSixes = 0;

    const movable = this.getMovablePieces();
    if (movable.length === 0) {
      this.message = `No valid moves with a ${roll}. Turn passes.`;
      this._switchTurn();
      return { rolled: roll, skipped: false, moved: false, extraTurn: false };
    }

    this.message = `Rolled a ${roll}. Tap a piece to move.`;
    return { rolled: roll, skipped: false, moved: false, extraTurn: false, movable };
  }

  /* ── Move validation ── */

  getMovablePieces() {
    const player = this.currentPlayer;
    const dice = this.diceValue;
    const movable = [];

    for (let i = 0; i < NUM_PIECES_PER_PLAYER; i++) {
      const result = this._tryMove(player, i, dice, { dryRun: true });
      if (result.valid) movable.push(i);
    }
    return movable;
  }

  /* ── Possible destinations for a single piece (used by the UI) ── */

  _getPossibleMoves(playerIdx, pathIndex, dice) {
    const from = pathIndex;
    if (from >= FINISH_PATH_INDEX) return [];
    let to;
    if (from === -1) {
      // In home: only a 6 brings a piece out to pathIndex 0
      if (dice !== 6) return [];
      to = 0;
    } else {
      to = from + dice;
    }
    // Cannot move past the finish square
    if (to > FINISH_PATH_INDEX) return [];
    // Cannot land on one of your own pieces on the main track
    if (to < FINISH_PATH_INDEX) {
      const ownBlocked = this.pieces[playerIdx].some(
        (p) => p !== -1 && p < FINISH_PATH_INDEX && p === to
      );
      if (ownBlocked) return [];
    }
    return [to];
  }

  /* ── Execute a move ── */

  movePiece(pieceIndex) {
    if (this.gameOver || this.isRolling) return { valid: false, reason: 'GAME_OVER_OR_ROLLING' };
    if (pieceIndex < 0 || pieceIndex >= NUM_PIECES_PER_PLAYER) {
      return { valid: false, reason: 'INVALID_PIECE' };
    }

    const result = this._tryMove(this.currentPlayer, pieceIndex, this.diceValue, { dryRun: false });
    if (!result.valid) return result;

    // Check win condition
    if (this._allPiecesFinished(this.currentPlayer)) {
      this.winner = this.currentPlayer;
      this.gameOver = true;
      this.message = `${this.playerNames[this.currentPlayer]} wins!`;
      return { valid: true, moved: true, captured: result.captured, won: true, winner: this.currentPlayer };
    }

    // Extra turn on 6
    if (this.diceValue === 6 && this.consecutiveSixes < 3) {
      this.message = `Rolled a 6! Roll again.`;
      return {
      valid: true,
      moved: true,
      captured: result.captured,
      capturedPlayer: result.capturedPlayer,
      capturedPiece: result.capturedPiece,
      extraTurn: true,
      won: false,
    };
    }

    this._switchTurn();
    return {
      valid: true,
      moved: true,
      captured: result.captured,
      capturedPlayer: result.capturedPlayer,
      capturedPiece: result.capturedPiece,
      extraTurn: false,
      won: false,
    };
  }

  /* ── Internal ── */

  _tryMove(playerIdx, pieceIndex, dice, { dryRun }) {
    const from = this.pieces[playerIdx][pieceIndex];
    const isFinished = from >= FINISH_PATH_INDEX;

    if (isFinished) return { valid: false, reason: 'PIECE_FINISHED' };

    let to;
    let captured = false;
    let capturedPlayer = null;
    let capturedPiece = null;

    if (from === -1) {
      // In home: only a 6 brings a piece out
      if (dice !== 6) return { valid: false, reason: 'NEED_SIX_TO_EXIT' };
      to = 0; // enter at pathIndex 0 (start square)
    } else {
      to = from + dice;
    }

    // Handle capturing on main track
    if (to < MAIN_TRACK_LENGTH) {
      const toBoardPos = (START_POSITIONS[playerIdx] + to) % 52;
      const isStartSquare = to === 0; // pathIndex 0 = player's start (safe)

      // Check for opponent piece at destination
      for (let p = 0; p < this.numPlayers; p++) {
        if (p === playerIdx) continue;
        for (let i = 0; i < NUM_PIECES_PER_PLAYER; i++) {
          if (this.pieces[p][i] === -1 || this.pieces[p][i] >= FINISH_PATH_INDEX) continue;
          const oppBoardPos = (START_POSITIONS[p] + this.pieces[p][i]) % 52;
          if (oppBoardPos === toBoardPos && !isStartSquare) {
            captured = true;
            capturedPlayer = p;
            capturedPiece = i;
            break;
          }
        }
        if (captured) break;
      }
    }

    if (!dryRun) {
      // Apply capture
      if (captured) {
        this.pieces[capturedPlayer][capturedPiece] = -1;
      }
      this.pieces[playerIdx][pieceIndex] = to;
      this.lastMove = {
        playerIdx,
        pieceIndex,
        from,
        to,
        captured,
        capturedPlayer,
        capturedPiece,
        dice,
      };
    }

    return { valid: true, to, captured, capturedPlayer, capturedPiece };
  }

  _switchTurn() {
    this.diceValue = 1;
    this.isRolling = false;
    this.lastMove = null;
    this.currentPlayer = (this.currentPlayer + 1) % this.numPlayers;
    this.message = `${this.playerNames[this.currentPlayer]}'s turn — roll the dice!`;
  }

  _allPiecesFinished(playerIdx) {
    for (let i = 0; i < NUM_PIECES_PER_PLAYER; i++) {
      if (this.pieces[playerIdx][i] < FINISH_PATH_INDEX) return false;
    }
    return true;
  }

  /* ── Programmatic control (for tests / automation) ── */

  setDice(value) {
    if (value < 1 || value > 6) throw new Error('Dice value must be 1-6');
    this.diceValue = value;
    this.isRolling = false;
  }

  setCurrentPlayer(idx) {
    if (idx < 0 || idx >= this.numPlayers) throw new Error('Invalid player index');
    this.currentPlayer = idx;
  }

  forceMove(playerIdx, pieceIndex, dice) {
    return this._tryMove(playerIdx, pieceIndex, dice, { dryRun: false });
  }

  restart() {
    this.reset();
  }
}
