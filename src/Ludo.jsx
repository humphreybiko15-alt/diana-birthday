/* ════════════════════════════════════════════════════════════════════════════════
   Ludo — real functional multiplayer pass-and-play board game
   Built on top of pure LudoLogic state machine. Works instantly on the landing page.
   ════════════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect } from 'react'
import { LudoLogic } from './ludoLogic.js'

const NUM_PIECES = 4
const BOARD_SIZE = 15 // 15x15 grid

// Player start positions on the 15x15 grid (home columns + start squares)
const HOME_AREAS = {
  0: { x: 1, y: 1, w: 6, h: 6, start: { x: 6, y: 6 }, color: '#e74c3c' },   // Red   (top-left)
  1: { x: 8, y: 1, w: 6, h: 6, start: { x: 6, y: 6 }, color: '#f1c40f' },   // Yellow (top-right)
  2: { x: 1, y: 8, w: 6, h: 6, start: { x: 8, y: 8 }, color: '#2ecc71' },   // Green  (bottom-left)
  3: { x: 8, y: 8, w: 6, h: 6, start: { x: 8, y: 8 }, color: '#3498db' },   // Blue   (bottom-right)
}

// Main track path around the board (51 positions clockwise from each player's start)
function getTrackPath(playerIdx) {
  // Each player's track starts at their start square and goes clockwise around
  const paths = []
  // Red: start at (6,6) → right → down → left → up → center (7,7)
  if (playerIdx === 0) {
    for (let x = 6; x <= 13; x++) paths.push({ x, y: 6 })
    for (let y = 7; y <= 13; y++) paths.push({ x: 13, y })
    for (let x = 12; x >= 1; x--) paths.push({ x, y: 13 })
    for (let y = 12; y >= 1; y--) paths.push({ x: 1, y })
    for (let x = 2; x <= 6; x++) paths.push({ x, y: 1 })
    for (let y = 2; y <= 6; y++) paths.push({ x: 6, y })
    for (let i = 1; i <= 5; i++) paths.push({ x: 7, y: 7 - i })
    paths.push({ x: 7, y: 7 }) // center finish
  } else if (playerIdx === 1) {
    for (let x = 8; x >= 1; x--) paths.push({ x, y: 6 })
    for (let y = 7; y <= 13; y++) paths.push({ x: 1, y })
    for (let x = 2; x <= 13; x++) paths.push({ x, y: 13 })
    for (let y = 12; y >= 1; y--) paths.push({ x: 13, y })
    for (let x = 12; x >= 8; x--) paths.push({ x, y: 1 })
    for (let y = 2; y <= 6; y++) paths.push({ x: 8, y })
    for (let i = 1; i <= 5; i++) paths.push({ x: 7, y: 7 + i })
    paths.push({ x: 7, y: 7 })
  } else if (playerIdx === 2) {
    for (let y = 8; y <= 13; y++) paths.push({ x: 8, y })
    for (let x = 7; x >= 1; x--) paths.push({ x, y: 13 })
    for (let y = 12; y >= 1; y--) paths.push({ x: 1, y })
    for (let x = 2; x <= 13; x++) paths.push({ x, y: 1 })
    for (let y = 2; y <= 8; y++) paths.push({ x: 13, y })
    for (let x = 12; x >= 8; x--) paths.push({ x, y: 8 })
    for (let i = 1; i <= 5; i++) paths.push({ x: 7 + i, y: 7 })
    paths.push({ x: 7, y: 7 })
  } else if (playerIdx === 3) {
    for (let y = 8; y >= 1; y--) paths.push({ x: 8, y })
    for (let x = 9; x <= 13; x++) paths.push({ x, y: 1 })
    for (let y = 2; y <= 13; y++) paths.push({ x: 13, y })
    for (let x = 12; x >= 1; x--) paths.push({ x, y: 13 })
    for (let y = 12; y >= 8; y--) paths.push({ x: 1, y })
    for (let x = 2; x <= 8; x++) paths.push({ x, y: 8 })
    for (let i = 1; i <= 5; i++) paths.push({ x: 7 - i, y: 7 })
    paths.push({ x: 7, y: 7 })
  }
  return paths
}

const TRACK_PATHS = [0, 1, 2, 3].map(getTrackPath)

// Map pathIndex → grid coordinate for a player
function pathToGrid(playerIdx, pathIndex) {
  if (pathIndex === -1) return null // in home
  if (pathIndex >= 56) return TRACK_PATHS[playerIdx][55] // center
  if (pathIndex >= 51) {
    // home column (positions 51-55)
    const track = TRACK_PATHS[playerIdx]
    const base = track.length - 6 // last 6 entries are home column + center
    return track[base + (pathIndex - 51)]
  }
  const track = TRACK_PATHS[playerIdx]
  return track[pathIndex % track.length]
}

const PLAYER_NAMES = ['Red', 'Yellow', 'Green', 'Blue']
const PLAYER_COLORS = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db']

export default function Ludo({ onClose }) {
  const [numPlayers, setNumPlayers] = useState(2)
  const [game] = useState(() => new LudoLogic(numPlayers, PLAYER_NAMES.slice(0, numPlayers)))
  const [playerNames, setPlayerNames] = useState(PLAYER_NAMES.slice(0, numPlayers))
  const [selectedPiece, setSelectedPiece] = useState(null) // { playerIdx, pieceIdx } or null
  const [showSetup, setShowSetup] = useState(true)
  const [diceRolled, setDiceRolled] = useState(false)
  const [rollAnimation, setRollAnimation] = useState(false)
  const diceRef = useRef(null)

  // Recreate game when player count or names change
  useEffect(() => {
    if (!showSetup) return
    game.reset()
    game.numPlayers = Math.min(Math.max(numPlayers, 2), 4)
    game.playerNames = playerNames.slice(0, game.numPlayers)
    game.colors = PLAYER_COLORS.slice(0, game.numPlayers)
    setSelectedPiece(null)
    setDiceRolled(false)
  }, [numPlayers, playerNames, showSetup])

  const state = game.getState()

  const startGame = useCallback(() => {
    game.reset()
    setSelectedPiece(null)
    setDiceRolled(false)
    setShowSetup(false)
  }, [])

  const rollDice = useCallback(() => {
    if (state.gameOver || state.isRolling) return
    const roll = game.rollDice()
    setRollAnimation(true)
    setDiceRolled(true)
    diceRef.current = roll
    setSelectedPiece(null)

    // After animation, finalize the roll
    setTimeout(() => {
      setRollAnimation(false)
      const result = game.finishRoll()
      if (result.skipped) {
        setSelectedPiece(null)
      } else if (result.movable && result.movable.length > 0) {
        // auto-select first movable piece if only one option
        if (result.movable.length === 1) {
          setSelectedPiece({ playerIdx: state.currentPlayer, pieceIdx: result.movable[0] })
        }
      }
    }, 600)
  }, [state.gameOver, state.isRolling, state.currentPlayer])

  const handlePieceClick = useCallback((playerIdx, pieceIdx) => {
    if (state.gameOver || state.isRolling || !diceRolled) return
    if (playerIdx !== state.currentPlayer) return

    const movable = game.getMovablePieces()
    if (!movable.includes(pieceIdx)) return

    setSelectedPiece({ playerIdx, pieceIdx })
  }, [state.gameOver, state.isRolling, diceRolled, state.currentPlayer])

  const moveSelected = useCallback(() => {
    if (!selectedPiece || state.gameOver || !diceRolled) return
    const { _playerIdx, pieceIdx } = selectedPiece

    const result = game.movePiece(pieceIdx)
    if (!result.valid) return

    setDiceRolled(false)
    setSelectedPiece(null)

    if (result.won) {
      // game over handled by state
      return
    }

    if (result.extraTurn) {
      // same player rolls again
      return
    }
    // turn already switched inside movePiece
  }, [selectedPiece, state.gameOver, diceRolled])

  if (showSetup) {
    return (
      <div className="ludo-setup glass-card no-select" role="dialog" aria-modal="true">
        <button
          className="ludo-close"
          onClick={() => onClose && onClose()}
          aria-label="Close Ludo"
        >
          ✕
        </button>
        <div className="ludo-title">
          <span className="ludo-emoji">🎲</span>
          <h2>Ludo — Play Instantly</h2>
          <p>Entertain yourself while your friend takes their turn.</p>
        </div>

        <div className="ludo-setup-row">
          <label>Players</label>
          <select
            className="ludo-select"
            value={numPlayers}
            onChange={(e) => setNumPlayers(parseInt(e.target.value, 10))}
          >
            {[2, 3, 4].map((n) => (
              <option key={n} value={n}>{n} Player{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <div className="ludo-names">
          {playerNames.map((name, i) => (
            <div key={i} className="ludo-name-row">
              <span className="ludo-name-dot" style={{ background: PLAYER_COLORS[i] }}></span>
              <input
                className="ludo-name-input"
                type="text"
                value={name}
                placeholder={`Player ${i + 1}`}
                maxLength={12}
                onChange={(e) => {
                  const next = [...playerNames]
                  next[i] = e.target.value || PLAYER_NAMES[i]
                  setPlayerNames(next)
                }}
              />
            </div>
          ))}
        </div>

        <button className="btn-primary ludo-start" onClick={startGame}>
          Start Game
        </button>
        <p className="ludo-hint">Tap a piece to move after rolling. Rolling a 6 grants an extra turn!</p>
      </div>
    )
  }

  const currentColor = PLAYER_COLORS[state.currentPlayer]
  const currentName = state.playerNames[state.currentPlayer]
  const movable = game.getMovablePieces()

  return (
    <div className="ludo-game no-select">
      <button
        className="ludo-close"
        onClick={() => {
          setShowSetup(true)
          game.reset()
        }}
        aria-label="Back to game setup"
      >
        ↶
      </button>

      {/* Top bar */}
      <div className="ludo-header">
        <div className="ludo-turn">
          <span className="ludo-turn-indicator" style={{ background: currentColor }}></span>
          <span className="ludo-turn-text">{currentName}'s turn</span>
        </div>
        <div className="ludo-dice">
          <button className="btn-primary ludo-roll-btn" onClick={rollDice} disabled={state.gameOver || state.isRolling || diceRolled && !movable.length === 0 && !state.gameOver}>
            {state.isRolling ? 'Rolling...' : 'Roll Dice'}
          </button>
          <div className={`ludo-dice-face ${rollAnimation ? 'rolling' : ''}`}>
            {state.diceValue}
          </div>
        </div>
      </div>

      {state.message && (
        <div className="ludo-message">{state.message}</div>
      )}

      {/* Board */}
      <div className="ludo-board">
        {/* Home areas (player yards) */}
        {[0, 1, 2, 3].map((p) => {
          if (p >= state.numPlayers) return null
          const ha = HOME_AREAS[p]
          return (
            <div key={p} className="ludo-home" style={{ ...ha, background: `rgba(${hexToRgb(PLAYER_COLORS[p])},0.15)`, border: `2px solid ${PLAYER_COLORS[p]}` }}>
              <div className="ludo-home-label">{state.playerNames[p]}</div>
              {[0, 1, 2, 3].map((i) => {
                const pi = state.pieces[p][i]
                if (pi === -1) {
                  return (
                    <div
                      key={i}
                      className="ludo-piece ludo-piece-home"
                      style={{ background: PLAYER_COLORS[p] }}
                      onClick={() => handlePieceClick(p, i)}
                    />
                  )
                }
                return null
              })}
            </div>
          )
        })}

        {/* Main board grid */}
        <div className="ludo-grid">
          {/* Draw center and track cells */}
          {Array.from({ length: BOARD_SIZE }, (_, y) =>
            Array.from({ length: BOARD_SIZE }).map((_, x) => {
              // Center 6x6 is the finishing area
              const isCenter = x >= 6 && x <= 8 && y >= 6 && y <= 8
              const isCenterCell = x === 7 && y === 7
              const isHomeArea =
                (x < 6 && y < 6) ||
                (x > 8 && y < 6) ||
                (x < 6 && y > 8) ||
                (x > 8 && y > 8)

              if (isHomeArea) return null // home areas drawn separately

              // Determine cell type
              let cellClass = 'ludo-cell'
              let cellStyle = {}

              if (isCenterCell) {
                cellClass += ' ludo-center'
              } else if (isCenter) {
                cellClass += ' ludo-home-column'
              } else {
                // Check if this cell is a player's start square
                const startPlayer = [0, 1, 2, 3].find((p) => {
                  const ha = HOME_AREAS[p]
                  return x === ha.start.x && y === ha.start.y
                })
                if (startPlayer !== undefined) {
                  cellClass += ` ludo-start ludo-start-${startPlayer}`
                  cellStyle.borderColor = PLAYER_COLORS[startPlayer]
                }
              }

              // Find pieces at this cell
              const piecesHere = []
              for (let p = 0; p < state.numPlayers; p++) {
                for (let i = 0; i < NUM_PIECES; i++) {
                  const pi = state.pieces[p][i]
                  if (pi === -1 || pi >= 56) continue
                  const grid = pathToGrid(p, pi)
                  if (grid && grid.x === x && grid.y === y) {
                    piecesHere.push({ playerIdx: p, pieceIdx: i })
                  }
                }
              }
              // Also check finished pieces at center
              if (isCenterCell) {
                for (let p = 0; p < state.numPlayers; p++) {
                  for (let i = 0; i < NUM_PIECES; i++) {
                    if (state.pieces[p][i] >= 56) {
                      piecesHere.push({ playerIdx: p, pieceIdx: i })
                    }
                  }
                }
              }

              return (
                <div
                  key={`cell-${x}-${y}`}
                  className={cellClass}
                  style={cellStyle}
                  onClick={() => {
                    // If clicking a cell with current player's movable piece, select it
                    const myPiece = piecesHere.find(
                      (pc) => pc.playerIdx === state.currentPlayer && movable.includes(pc.pieceIdx)
                    )
                    if (myPiece) {
                      handlePieceClick(myPiece.playerIdx, myPiece.pieceIdx)
                    }
                  }}
                >
                  {piecesHere.map((pc) => (
                    <div
                      key={`p-${pc.playerIdx}-i-${pc.pieceIdx}`}
                      className="ludo-piece"
                      style={{
                        background: PLAYER_COLORS[pc.playerIdx],
                        boxShadow: selectedPiece?.playerIdx === pc.playerIdx && selectedPiece?.pieceIdx === pc.pieceIdx
                          ? `0 0 10px rgba(255,255,255,0.9), 0 0 20px ${PLAYER_COLORS[pc.playerIdx]}`
                          : '',
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePieceClick(pc.playerIdx, pc.pieceIdx)
                      }}
                    />
                  ))}
                </div>
              )
            })
          )}
        </div>

        {/* Home columns (vertical/horizontal paths to center) */}
        {/* Already integrated into grid via center cells; pieces show there */}
      </div>

      {/* Action bar */}
      <div className="ludo-actions">
        <button className="btn-secondary ludo-move-btn" onClick={moveSelected} disabled={!selectedPiece || state.gameOver || !diceRolled}>
          Move Piece
        </button>
        {diceRolled && state.diceValue === 6 && !state.gameOver && (
          <span className="ludo-extra">Extra turn — roll again!</span>
        )}
      </div>

      {/* Winner */}
      {state.gameOver && state.winner !== null && (
        <div className="ludo-winner">
          <div className="ludo-winner-crown">👑</div>
          <h2 className="ludo-winner-text">{state.playerNames[state.winner]} Wins!</h2>
          <button className="btn-primary" onClick={() => {
            game.reset()
            setSelectedPiece(null)
            setDiceRolled(false)
          }}>
            Play Again
          </button>
        </div>
      )}
    </div>
  )
}

// Convert hex to rgb for rgba backgrounds
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}
