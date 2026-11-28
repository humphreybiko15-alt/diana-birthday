/* ═════════════════════════════════════════════════════════════════════════════════
   Ludo — polished visual board game
   Built on top of pure LudoLogic state machine.
   Features: SVG 15×15 board, glossy 3D tokens, animated dice, HUD,
   step-by-step movement animation, sound effects, win modal with confetti.
   ════════════════════════════════════════════════════════════════════════════════ */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import confetti from 'canvas-confetti'
import { LudoLogic } from './ludoLogic.js'

const NUM_PIECES = 4
const BOARD_SIZE = 15 // 15x15 grid

/* ── Colors ── */
const PLAYER_COLORS = ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db']

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

/* ── Track paths (visual grid coords per player) ── */
function getTrackPath(playerIdx) {
  const paths = []
  if (playerIdx === 0) {
    for (let x = 6; x <= 13; x++) paths.push({ x, y: 6 })
    for (let y = 7; y <= 13; y++) paths.push({ x: 13, y })
    for (let x = 12; x >= 1; x--) paths.push({ x, y: 13 })
    for (let y = 12; y >= 1; y--) paths.push({ x: 1, y })
    for (let x = 2; x <= 6; x++) paths.push({ x, y: 1 })
    for (let y = 2; y <= 6; y++) paths.push({ x: 6, y })
    for (let i = 1; i <= 5; i++) paths.push({ x: 7, y: 7 - i })
    paths.push({ x: 7, y: 7 })
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

function pathToGrid(playerIdx, pathIndex) {
  if (pathIndex === -1) return null
  if (pathIndex >= 56) return TRACK_PATHS[playerIdx][55]
  if (pathIndex >= 51) {
    const track = TRACK_PATHS[playerIdx]
    const base = track.length - 6
    return track[base + (pathIndex - 51)]
  }
  const track = TRACK_PATHS[playerIdx]
  return track[pathIndex % track.length]
}

/* ── Web Audio API sound effects ── */
const AudioCtx = window.AudioContext || window.webkitAudioContext
const audioCtx = AudioCtx ? new AudioCtx() : null

const tone = (freq, type = 'square', duration = 0.1, vol = 0.1) => {
  if (!audioCtx) return
  const osc = audioCtx.createOscillator()
  const gain = audioCtx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime)
  gain.gain.setValueAtTime(vol, audioCtx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration)
  osc.connect(gain)
  gain.connect(audioCtx.destination)
  osc.start()
  osc.stop(audioCtx.currentTime + duration)
}

const playSound = (kind) => {
  if (!audioCtx) return
  switch (kind) {
    case 'dice':
      tone(440, 'square', 0.05, 0.1)
      setTimeout(() => tone(554, 'square', 0.05, 0.1), 60)
      break
    case 'hop':
      tone(880, 'sine', 0.05, 0.08)
      break
    case 'capture':
      tone(220, 'sawtooth', 0.2, 0.12)
      setTimeout(() => tone(165, 'sawtooth', 0.2, 0.12), 100)
      break
    case 'win':
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 'sine', 0.3, 0.15), i * 120))
      break
    case 'roll6':
      [440, 554, 659, 880].forEach((f, i) => setTimeout(() => tone(f, 'square', 0.2, 0.12), i * 80))
      break
  }
}

/* ── Home areas (6×6 each, flush with corners) ── */
/* Top-Left (Red): rows 0-5, cols 0-5 */
/* Top-Right (Green): rows 0-5, cols 9-14 */
/* Bottom-Right (Yellow): rows 9-14, cols 9-14 */
/* Bottom-Left (Blue): rows 9-14, cols 0-5 */
const HOME_AREAS = {
  0: { x: 0, y: 0, w: 6, h: 6, start: { x: 6, y: 6 }, color: '#e74c3c' },  // Red - top-left
  1: { x: 9, y: 0, w: 6, h: 6, start: { x: 8, y: 6 }, color: '#2ecc71' },  // Green - top-right
  2: { x: 9, y: 9, w: 6, h: 6, start: { x: 8, y: 8 }, color: '#f1c40f' },  // Yellow - bottom-right
  3: { x: 0, y: 9, w: 6, h: 6, start: { x: 6, y: 8 }, color: '#3498db' },  // Blue - bottom-left
}

/* ── Safe squares (star squares) - ONLY on playable track ── */
/* 4 start squares + 4 star squares at specific positions */
const SAFE_SQUARES = [
  { x: 6, y: 6 },   // Red start
  { x: 8, y: 6 },   // Green start
  { x: 8, y: 8 },   // Yellow start
  { x: 6, y: 8 },   // Blue start
  { x: 2, y: 6 },   // Star at row 2, col 6
  { x: 6, y: 12 },  // Star at row 6, col 12
  { x: 12, y: 8 },  // Star at row 12, col 8
  { x: 8, y: 2 },   // Star at row 8, col 2
]

const isSafeSquare = (x, y) => SAFE_SQUARES.some(s => s.x === x && s.y === y)
const isStartSquare = (x, y) => {
  for (let p = 0; p < 4; p++) {
    if (x === HOME_AREAS[p].start.x && y === HOME_AREAS[p].start.y) return p
  }
  return -1
}

/* ── Home slot positions (4 per yard) - relative to yard origin ── */
const HOME_SLOTS = {
  0: [ {x:1,y:1},{x:3,y:1},{x:1,y:3},{x:3,y:3} ],   // Red yard at (0,0)
  1: [ {x:10,y:1},{x:12,y:1},{x:10,y:3},{x:12,y:3} ], // Green yard at (9,0)
  2: [ {x:10,y:10},{x:12,y:10},{x:10,y:12},{x:12,y:12} ], // Yellow yard at (9,9)
  3: [ {x:1,y:10},{x:3,y:10},{x:1,y:12},{x:3,y:12} ], // Blue yard at (0,9)
}

/* ── Check if a cell is in a home yard ── */
const isHomeYard = (x, y) => {
  for (let p = 0; p < 4; p++) {
    const ha = HOME_AREAS[p]
    if (x >= ha.x && x < ha.x + ha.w && y >= ha.y && y < ha.y + ha.h) return p
  }
  return -1
}

/* ── Check if a cell is in the center 3×3 finishing home (rows 6-8, cols 6-8) ── */
const isCenterHome = (x, y) => x >= 6 && x <= 8 && y >= 6 && y <= 8

/* ── Check if a cell is a playable track tile ── */
const isTrackTile = (x, y) => {
  // Cross arms: row 6-8 (horizontal) and col 6-8 (vertical), excluding center 3x3
  const inHorizontal = y >= 6 && y <= 8 && (x < 6 || x > 8)
  const inVertical = x >= 6 && x <= 8 && (y < 6 || y > 8)
  return inHorizontal || inVertical
}

/* ── Check if a cell is a home stretch tile (colored path leading to center) ── */
const isHomeStretch = (x, y) => {
  // Red: row 7, cols 1-5 (entering from left)
  // Green: col 7, rows 1-5 (entering from top)
  // Yellow: row 7, cols 9-13 (entering from right)
  // Blue: col 7, rows 9-13 (entering from bottom)
  if (y === 7 && x >= 1 && x <= 5) return 0 // Red
  if (x === 7 && y >= 1 && y <= 5) return 1 // Green
  if (y === 7 && x >= 9 && x <= 13) return 2 // Yellow
  if (x === 7 && y >= 9 && y <= 13) return 3 // Blue
  return -1
}

/* ── Render a 3D-style glossy token ── */
function renderToken(color, selected) {
  const innerGlow = selected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)'
  return (
    <g>
      <ellipse cx="0.5" cy="0.58" rx="0.26" ry="0.14" fill="#000" opacity="0.4" />
      <circle cx="0.5" cy="0.5" r="0.26" fill={color} stroke={innerGlow} strokeWidth="0.07" />
      <ellipse cx="0.34" cy="0.34" rx="0.11" ry="0.08" fill="#fff" opacity="0.6" />
      <ellipse cx="0.34" cy="0.34" rx="0.05" ry="0.04" fill="#fff" opacity="0.95" />
      <circle cx="0.5" cy="0.5" r="0.2" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.05" />
      <circle cx="0.5" cy="0.5" r="0.32" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.06" />
    </g>
  )
}

/* ── Render pips on a die face ── */
function renderPips(value) {
  const positions = {
    1: [{x:0.5,y:0.5}],
    2: [{x:0.28,y:0.28},{x:0.72,y:0.72}],
    3: [{x:0.28,y:0.28},{x:0.5,y:0.5},{x:0.72,y:0.72}],
    4: [{x:0.28,y:0.28},{x:0.72,y:0.28},{x:0.28,y:0.72},{x:0.72,y:0.72}],
    5: [{x:0.28,y:0.28},{x:0.72,y:0.28},{x:0.5,y:0.5},{x:0.28,y:0.72},{x:0.72,y:0.72}],
    6: [{x:0.28,y:0.2},{x:0.72,y:0.2},{x:0.28,y:0.5},{x:0.72,y:0.5},{x:0.28,y:0.8},{x:0.72,y:0.8}],
  }
  return positions[value].map((p, i) => (
    <div key={i} className="die-pip" style={{ left: p.x * 100, top: p.y * 100 }} />
  ))
}

export default function Ludo({ onClose }) {
  const [numPlayers, setNumPlayers] = useState(2)
  const [playerNames, setPlayerNames] = useState(['Red', 'Yellow'])
  const [showSetup, setShowSetup] = useState(true)
  const [diceRolled, setDiceRolled] = useState(false)
  const [mute, setMute] = useState(false)
  const [confettiTrigger, setConfettiTrigger] = useState(0)

  const game = useMemo(() => new LudoLogic(numPlayers, playerNames), [numPlayers, playerNames])

  const state = game.getState()
  const currentColor = PLAYER_COLORS[state.currentPlayer]
  const currentName = state.playerNames[state.currentPlayer]

  const [selectedPiece, setSelectedPiece] = useState(null)
  const [animating, setAnimating] = useState(false)
  const [diceFace, setDiceFace] = useState(1)
  const rollTimerRef = useRef(null)

  const movable = useMemo(() => {
    const result = []
    for (let p = 0; p < state.numPlayers; p++) {
      if (p !== state.currentPlayer) continue
      for (let i = 0; i < NUM_PIECES; i++) {
        const pos = state.pieces[p][i]
        if (pos === -1) continue
        const grid = pathToGrid(p, pos)
        if (!grid) continue
        const possible = game._getPossibleMoves(p, pos, state.diceValue)
        if (possible.length > 0) {
          result.push({ playerIdx: p, pieceIdx: i, grid, to: possible })
        }
      }
    }
    return result
  }, [state, game])

  useEffect(() => {
    if (!showSetup) return
    game.reset()
    setSelectedPiece(null)
    setDiceRolled(false)
  }, [numPlayers, playerNames, showSetup, game])

  /* ── Confetti on win ── */
  useEffect(() => {
    if (confettiTrigger <= 0) return
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e74c3c', '#f1c40f', '#2ecc71', '#3498db', '#fbbf24', '#7c3aed'],
    })
    // Auto-dismiss confetti after animation completes
    const t = setTimeout(() => setConfettiTrigger(0), 3000)
    return () => clearTimeout(t)
  }, [confettiTrigger])

  useEffect(() => {
    return () => {
      if (rollTimerRef.current) clearInterval(rollTimerRef.current)
    }
  }, [])

  const startGame = useCallback(() => {
    game.reset()
    setSelectedPiece(null)
    setDiceRolled(false)
    setShowSetup(false)
  }, [game])

  const rollDice = useCallback(() => {
    if (state.gameOver || state.isRolling || diceRolled) return
    setDiceRolled(true)
    setSelectedPiece(null)
    setAnimating(false)

    let frames = 0
    const interval = setInterval(() => {
      setDiceFace(Math.floor(Math.random() * 6) + 1)
      frames++
      if (frames >= 10) {
        clearInterval(interval)
        const roll = game.rollDice()
        setDiceFace(roll)
        if (!mute) playSound('dice')
        setTimeout(() => {
          setDiceRolled(false)
          const result = game.finishRoll()
          if (result.skipped) {
            setSelectedPiece(null)
          } else if (result.extraTurn && roll === 6) {
            if (!mute) playSound('roll6')
          }
        }, 400)
      }
    }, 60)
    rollTimerRef.current = interval
  }, [state.gameOver, state.isRolling, diceRolled, mute, game])

  const handlePieceClick = useCallback((playerIdx, pieceIdx) => {
    if (state.gameOver || state.isRolling || !diceRolled || animating) return
    if (playerIdx !== state.currentPlayer) return
    const canMove = movable.some(m => m.playerIdx === playerIdx && m.pieceIdx === pieceIdx)
    if (!canMove) return

    const { playerIdx: p, pieceIdx: i } = { playerIdx, pieceIdx }

    const fromPos = state.pieces[p][i]
    const possible = game._getPossibleMoves(p, fromPos, state.diceValue)
    if (possible.length === 0) return

    const toGrid = possible[0].to

    // Detect capture: any opponent piece on target tile
    let captured = false
    for (let pp = 0; pp < state.numPlayers; pp++) {
      if (pp === p) continue
      for (let ii = 0; ii < NUM_PIECES; ii++) {
        const pos = state.pieces[pp][ii]
        if (pos === -1 || pos >= 56) continue
        const g = pathToGrid(pp, pos)
        if (g && g.x === toGrid.x && g.y === toGrid.y) {
          captured = true
          break
        }
      }
      if (captured) break
    }

    let step = 0
    const totalSteps = state.diceValue
    setAnimating(true)
    setSelectedPiece(null)
    if (!mute) playSound('hop')

    const hopInterval = setInterval(() => {
      step++
      if (step < totalSteps && !mute) playSound('hop')
      if (step >= totalSteps) {
        clearInterval(hopInterval)
        const result = game.movePiece(i)
        setAnimating(false)
        setDiceRolled(false)
        if (result.captured && !mute) playSound('capture')
        if (result.extraTurn && state.diceValue === 6 && !mute) playSound('roll6')
        if (state.gameOver && state.winner !== null && !mute) {
          playSound('win')
          setConfettiTrigger(c => c + 1)
        }
      }
    }, 220)
  }, [state.gameOver, state.isRolling, diceRolled, animating, movable, state.currentPlayer, state.diceValue, state.pieces, state.numPlayers, state.winner, mute, game])

  /* ── Pieces at a grid cell ── */
  const piecesAt = useCallback((x, y) => {
    const result = []
    for (let p = 0; p < state.numPlayers; p++) {
      for (let i = 0; i < NUM_PIECES; i++) {
        const pos = state.pieces[p][i]
        if (pos === -1 || pos >= 56) continue
        const g = pathToGrid(p, pos)
        if (g && g.x === x && g.y === y) result.push({ playerIdx: p, pieceIdx: i })
      }
    }
    if (x === 7 && y === 7) {
      for (let p = 0; p < state.numPlayers; p++) {
        for (let i = 0; i < NUM_PIECES; i++) {
          if (state.pieces[p][i] >= 56) result.push({ playerIdx: p, pieceIdx: i })
        }
      }
    }
    return result
  }, [state])

  /* ── Token stacking offsets ── */
  const stackOffset = (piecesAtCell, idx) => {
    const n = piecesAtCell.length
    if (n === 1) return { x: 0, y: 0 }
    if (n === 2) return idx === 0 ? { x: -0.08, y: -0.08 } : { x: 0.08, y: 0.08 }
    if (n === 3) return [{ x: -0.1, y: 0 }, { x: 0.1, y: 0 }, { x: 0, y: -0.1 }][idx]
    return { x: (idx % 2 === 0 ? -0.1 : 0.1), y: (idx < 2 ? -0.1 : 0.1) }
  }

  return (
    <div className="ludo-game no-select">
      {/* ── Game Setup ── */}
      {showSetup && (
        <div className="ludo-setup glass-card" role="dialog" aria-modal="true">
          <button className="ludo-close" onClick={() => onClose && onClose()} aria-label="Close Ludo">✕</button>
          <div className="ludo-title">
            <span className="ludo-emoji">🎲</span>
            <h2>Ludo — Play Instantly</h2>
            <p>Entertain yourself while your friend takes their turn.</p>
          </div>
          <div className="ludo-setup-row">
            <label>Players</label>
            <select className="ludo-select" value={numPlayers} onChange={(e) => setNumPlayers(parseInt(e.target.value, 10))}>
              {[2, 3, 4].map(n => <option key={n} value={n}>{n} Player{n > 1 ? 's' : ''}</option>)}
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
                    next[i] = e.target.value || `Player ${i + 1}`
                    setPlayerNames(next)
                  }}
                />
              </div>
            ))}
          </div>
          <button className="btn-primary ludo-start" onClick={startGame}>Start Game</button>
          <p className="ludo-hint">Roll a 6 to leave home. Rolling a 6 grants an extra turn!</p>
        </div>
      )}

      {!showSetup && (
        <div className="ludo-game-wrap">
          <button className="ludo-close" onClick={() => { setShowSetup(true); game.reset(); setSelectedPiece(null); setDiceRolled(false); setAnimating(false); }} aria-label="Back to setup">↶</button>

          {/* ── HUD ── */}
          <div className="ludo-hud">
            <div className="ludo-turn">
              <span className="ludo-turn-indicator" style={{ background: currentColor, boxShadow: `0 0 12px ${currentColor}` }}></span>
              <span className="ludo-turn-text">{currentName}'s turn</span>
            </div>

            <div className="ludo-dice-tray">
              <button
                className={`btn-primary ludo-roll-btn ${rollTimerRef.current ? 'rolling' : ''}`}
                onClick={rollDice}
                disabled={state.gameOver || state.isRolling || diceRolled || animating || movable.length === 0}
                aria-label="Roll dice"
              >
                {state.isRolling ? 'Rolling...' : 'Roll Dice'}
              </button>
              <div className="ludo-die">
                <div className="die-face">{renderPips(diceFace)}</div>
              </div>
              {diceRolled && state.diceValue === 6 && !state.gameOver && !animating && (
                <span className="ludo-extra">Extra turn!</span>
              )}
            </div>

            <button
              className={`ludo-mute ${mute ? 'muted' : ''}`}
              onClick={() => setMute(!mute)}
              aria-label={mute ? 'Unmute' : 'Mute'}
              title={mute ? 'Sound on' : 'Sound off'}
            >
              {mute ? '🔇' : '🔊'}
            </button>
          </div>

          <div className="ludo-status-banner">{state.message}</div>

          {/* ── Board SVG ── */}
          <div className="ludo-board-wrap">
            <svg
              className="ludo-board-svg"
              viewBox="0 0 15 15"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Ludo board"
            >
              {/* ── Board background: all cells dark ── */}
              {Array.from({ length: BOARD_SIZE }).map((_, y) =>
                Array.from({ length: BOARD_SIZE }).map((_, x) => {
                  const homeYard = isHomeYard(x, y)
                  const center = isCenterHome(x, y)
                  const track = isTrackTile(x, y)
                  const stretch = isHomeStretch(x, y)
                  const startP = isStartSquare(x, y)
                  const safe = isSafeSquare(x, y)

                  // Home yards - solid colored frame, no grid lines inside
                  if (homeYard !== -1) {
                    const active = homeYard === state.currentPlayer && homeYard < state.numPlayers
                    return (
                      <rect key={`bg-${x}-${y}`} x={x} y={y} width={1} height={1}
                        fill={PLAYER_COLORS[homeYard]}
                        stroke="none" />
                    )
                  }

                  // Center finishing home (3x3) - dark background
                  if (center) {
                    return (
                      <rect key={`bg-${x}-${y}`} x={x} y={y} width={1} height={1}
                        fill="#0d0516" stroke="none" />
                    )
                  }

                  // Home stretch columns - colored player-specific tiles
                  if (stretch !== -1) {
                    return (
                      <rect key={`bg-${x}-${y}`} x={x} y={y} width={1} height={1}
                        fill={PLAYER_COLORS[stretch]}
                        stroke="none" />
                    )
                  }

                  // Playable cross track tiles - light/cream high contrast
                  if (track) {
                    const active = startP !== -1 && startP < state.numPlayers
                    return (
                      <rect key={`bg-${x}-${y}`} x={x} y={y} width={1} height={1}
                        fill={active ? `rgba(${hexToRgb(PLAYER_COLORS[startP])},0.9)` : '#f5f5ea'}
                        stroke="#cbbba0" strokeWidth="0.06" />
                    )
                  }

                  // All other cells - dark background
                  let fill = '#120820'
                  if (safe) fill = '#1a1a2e'
                  return (
                    <rect key={`bg-${x}-${y}`} x={x} y={y} width={1} height={1}
                      fill={fill} stroke="#2a1a4a" strokeWidth="0.06" />
                  )
                })
              )}

              {/* ── Home yard frames (solid colored border with inner box) ── */}
              {[0,1,2,3].map(p => {
                const ha = HOME_AREAS[p]
                // Outer frame
                return (
                  <g key={`yard-frame-${p}`}>
                    <rect x={ha.x} y={ha.y} width={ha.w} height={ha.h}
                      fill="none" stroke={PLAYER_COLORS[p]} strokeWidth="0.12" />
                    {/* Inner box (clean inner area without grid lines) */}
                    <rect x={ha.x + 0.6} y={ha.y + 0.6} width={ha.w - 1.2} height={ha.h - 1.2}
                      fill="#1a0f2e" stroke="none" />
                    {/* Yard label */}
                    <text x={ha.x + ha.w / 2} y={ha.y + 0.55} textAnchor="middle" fontSize="0.45"
                      fill={PLAYER_COLORS[p]} fontWeight="700" letterSpacing="0.5">
                      {['Red','Green','Yellow','Blue'][p]}
                    </text>
                  </g>
                )
              })}

              {/* ── Center finishing home (3×3 with 4 colored triangles) ── */}
              <g key="center-home">
                {/* Outer border of 3×3 center */}
                <rect x={6} y={6} width={3} height={3}
                  fill="none" stroke="#7c3aed" strokeWidth="0.12" />
                {/* 4 colored triangles pointing to center (7.5, 7.5) */}
                {/* Red - left triangle */}
                <path d="M 6 6 L 7.5 7.5 L 6 8 Z" fill="#e74c3c" />
                {/* Green - top triangle */}
                <path d="M 6 6 L 7.5 7.5 L 8 6 Z" fill="#2ecc71" />
                {/* Yellow - right triangle */}
                <path d="M 8 8 L 7.5 7.5 L 8 6 Z" fill="#f1c40f" />
                {/* Blue - bottom triangle */}
                <path d="M 6 8 L 7.5 7.5 L 8 8 Z" fill="#3498db" />
              </g>

              {/* ── Home stretch arrows (directional on entry tiles) ── */}
              <g key="stretch-arrows" fill="rgba(255,255,255,0.9)">
                {/* Red: entry at (6,6) pointing right ← row 7 cols 1-5 → center at col 7 */}
                <path d="M 3.5 7.5 L 4.5 7.5 L 4 7 L 4 8 Z" />
                {/* Green: entry at (8,6) pointing down ← col 7 rows 1-5 → center at row 7 */}
                <path d="M 7.5 3.5 L 7.5 4.5 L 7 4 L 8 4 Z" />
                {/* Yellow: entry at (8,8) pointing left ← row 7 cols 9-13 → center at col 7 */}
                <path d="M 11.5 7.5 L 10.5 7.5 L 11 8 L 11 7 Z" />
                {/* Blue: entry at (6,8) pointing up ← col 7 rows 9-13 → center at row 7 */}
                <path d="M 7.5 11.5 L 7.5 10.5 L 8 11 L 7 11 Z" />
              </g>

              {/* ── Safe star (★) positions - ONLY on playable track ── */}
              {SAFE_SQUARES.map((s, i) => (
                <text key={`star-${i}`} x={s.x + 0.5} y={s.y + 0.62} textAnchor="middle" fontSize="0.85" fill="#fbbf24"
                  filter="drop-shadow(0 0 3px rgba(0,0,0,0.9))">★</text>
              ))}

              {/* ── Home yard tokens (4 per yard) ── */}
              {[0,1,2,3].map(p => {
                if (p >= state.numPlayers) return null
                return HOME_SLOTS[p].map((slot, i) => {
                  const pos = state.pieces[p][i]
                  if (pos !== -1) return null
                  return (
                    <g key={`home-${p}-${i}`} transform={`translate(${slot.x + 0.5},${slot.y + 0.5})`} className="token-group" style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); handlePieceClick(p, i) }}
                    >
                      {renderToken(PLAYER_COLORS[p], selectedPiece?.playerIdx === p && selectedPiece?.pieceIdx === i)}
                    </g>
                  )
                })
              })}
              {/* ── Board track tokens ── */}
              {[0,1,2,3].map(p => {
                if (p >= state.numPlayers) return null
                return [0,1,2,3].map(i => {
                  const pos = state.pieces[p][i]
                  if (pos === -1 || pos >= 56) return null
                  const g = pathToGrid(p, pos)
                  if (!g) return null
                  const cellPieces = piecesAt(g.x, g.y)
                  const idx = cellPieces.findIndex(pc => pc.playerIdx === p && pc.pieceIdx === i)
                  const off = stackOffset(cellPieces, idx)
                  const isSelected = selectedPiece?.playerIdx === p && selectedPiece?.pieceIdx === i
                  return (
                    <g key={`track-${p}-${i}`} transform={`translate(${g.x + 0.5 + off.x},${g.y + 0.5 + off.y})`} className="token-group" style={{ cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); handlePieceClick(p, i) }}
                    >
                      {renderToken(PLAYER_COLORS[p], isSelected)}
                    </g>
                  )
                })
              })}
              {/* ── Finished tokens at center ── */}
              {[0,1,2,3].map(p => {
                if (p >= state.numPlayers) return null
                return [0,1,2,3].map(i => {
                  if (state.pieces[p][i] < 56) return null
                  return (
                    <g key={`finish-${p}-${i}`} transform="translate(7.5,7.5)" className="token-group">
                      {renderToken(PLAYER_COLORS[p], false)}
                    </g>
                  )
                })
              })}
            </svg>
          </div>

          {/* ── Win modal ── */}
          {state.gameOver && state.winner !== null && (
            <div className="ludo-win-modal">
              <div className="ludo-win-content">
                <div className="ludo-win-crown">👑</div>
                <h2 className="ludo-win-text">{state.playerNames[state.winner]} Wins!</h2>
                <p className="ludo-win-sub">Congratulations, {state.playerNames[state.winner]}!</p>
                <button className="btn-primary ludo-win-btn" onClick={() => { game.reset(); setSelectedPiece(null); setDiceRolled(false); setConfettiTrigger(c => c + 1); }}>
                  Play Again
                </button>
                <button className="btn-secondary ludo-win-btn" onClick={() => { setShowSetup(true); game.reset(); setSelectedPiece(null); setDiceRolled(false); }}>
                  Change Setup
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Confetti overlay ── */}
      {confettiTrigger > 0 && (
        <div className="ludo-confetti">
          <canvas className="ludo-confetti-canvas" />
        </div>
      )}
    </div>
  )
}