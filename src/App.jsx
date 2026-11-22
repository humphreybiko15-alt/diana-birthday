import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { RunawayHeartStage, BlueShirtStage, FirstKissStage } from './LoveStages.jsx'

/* ────────────────────────────────────────────────
   STAGE 1: Letter Scramble — Unscramble "NAISULA"
─────────────────────────────────────────────── */
const SCRAMBLED = ['N', 'A', 'I', 'S', 'U', 'L', 'A']
const TARGET_WORD = 'NAISULA'

function Stage1({ onComplete }) {
  const [tiles] = useState(SCRAMBLED)
  const [selected, setSelected] = useState([])
  const [answer, setAnswer] = useState([])
  const [status, setStatus] = useState('idle') // idle | correct | wrong

  const handleTileClick = (letter, idx) => {
    if (selected.includes(idx)) return
    const newAnswer = [...answer, letter]
    const newSelected = [...selected, idx]
    setAnswer(newAnswer)
    setSelected(newSelected)

    if (newAnswer.length === TARGET_WORD.length) {
      const word = newAnswer.join('')
      if (word === TARGET_WORD) {
        setStatus('correct')
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#d946ef', '#7c3aed', '#fbbf24', '#f43f5e'] })
        setTimeout(onComplete, 1200)
      } else {
        setStatus('wrong')
        setTimeout(() => { setAnswer([]); setSelected([]); setStatus('idle') }, 900)
      }
    }
  }

  const handleSlotClick = (i) => {
    if (status === 'correct') return
    setAnswer(prev => prev.filter((_, j) => j !== i))
    setSelected(prev => prev.filter((_, j) => j !== i))
  }

  return (
    <motion.div className="stage" key="stage1" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}>
      <div className="stage-card glass-card">
        <span className="stage-emoji">🔤</span>
        <h2 className="stage-title gradient-text">Who's the Birthday Star?</h2>
        <p className="stage-subtitle">
          Tap the letters in the right order to spell out her name!
        </p>

        {/* Scrambled tiles */}
        <div className="scramble-tiles">
          {tiles.map((letter, idx) => (
            <motion.div
              key={idx}
              className={`tile${selected.includes(idx) ? ' selected' : ''}`}
              whileHover={!selected.includes(idx) ? { scale: 1.12 } : {}}
              whileTap={!selected.includes(idx) ? { scale: 0.9 } : {}}
              onClick={() => !selected.includes(idx) && handleTileClick(letter, idx)}
              style={{ opacity: selected.includes(idx) ? 0.35 : 1 }}
            >
              {letter}
            </motion.div>
          ))}
        </div>

        {/* Answer slots */}
        <div className="answer-slots">
          {Array.from({ length: TARGET_WORD.length }).map((_, i) => (
            <motion.div
              key={i}
              className={`answer-slot${answer[i] ? ' filled' : ''}`}
              whileTap={answer[i] ? { scale: 0.85 } : {}}
              onClick={() => answer[i] && handleSlotClick(i)}
            >
              {answer[i] || ''}
            </motion.div>
          ))}
        </div>

        {status === 'correct' && (
          <motion.div className="success-badge" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            ✨ YES! That's her!
          </motion.div>
        )}
        {status === 'wrong' && (
          <motion.p style={{ color: '#f43f5e', fontWeight: 700, marginTop: 12 }}>
            Hmm, try again! 😄
          </motion.p>
        )}

        <p className="hint-text">💡 Tap a filled slot to remove a letter</p>
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────
   STAGE 2: Birthday Math — What year was she born?
   (Answer: user fills in — we accept 1990–2010 range
    and show a cheeky message)
─────────────────────────────────────────────── */
function Stage2({ onComplete }) {
  const [val, setVal] = useState('')
  const [status, setStatus] = useState('idle')

  const check = () => {
    const year = parseInt(val)
    if (!isNaN(year) && year >= 1980 && year <= 2010) {
      setStatus('correct')
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.5 }, colors: ['#fbbf24', '#f59e0b', '#d946ef'] })
      setTimeout(onComplete, 1500)
    } else {
      setStatus('wrong')
      setTimeout(() => { setStatus('idle'); setVal('') }, 900)
    }
  }

  return (
    <motion.div className="stage" key="stage2" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}>
      <div className="stage-card glass-card">
        <span className="stage-emoji">🎂</span>
        <h2 className="stage-title gradient-text">The Magic Number</h2>
        <p className="stage-subtitle">
          What year was Naisula born? 📅<br />
          <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>(Go ahead, she won't admit it 😏)</span>
        </p>

        <input
          type="number"
          className={`puzzle-input${status === 'correct' ? ' correct' : status === 'wrong' ? ' wrong' : ''}`}
          placeholder="e.g. 1995"
          value={val}
          onChange={e => { setVal(e.target.value); setStatus('idle') }}
          onKeyDown={e => e.key === 'Enter' && check()}
          maxLength={4}
          style={{ display: 'block', margin: '0 auto 24px' }}
        />

        {status === 'correct' && (
          <motion.div className="success-badge" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            🎉 Locked in! She's forever young!
          </motion.div>
        )}

        {status !== 'correct' && (
          <button className="btn-primary" onClick={check} disabled={val.length < 4}>
            🔐 Unlock
          </button>
        )}

        <p className="hint-text">💡 Any year between 1980 – 2010 works ✨</p>
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────
   STAGE 3: Emoji Riddle — What do these emojis say?
   🌟👑🎉 = "Birthday Queen"
   Pick from 4 options
─────────────────────────────────────────────── */
const EMOJI_PUZZLE = {
  emojis: '🌟 👑 🎉',
  question: 'What do these emojis represent?',
  options: [
    { id: 'a', emoji: '💃', label: 'Party Animal' },
    { id: 'b', emoji: '👑', label: 'Birthday Queen' },
    { id: 'c', emoji: '🎵', label: 'Music Lover' },
    { id: 'd', emoji: '🌙', label: 'Night Owl' },
  ],
  correctId: 'b',
}

function Stage3({ onComplete }) {
  const [chosen, setChosen] = useState(null)

  const pick = (id) => {
    setChosen(id)
    if (id === EMOJI_PUZZLE.correctId) {
      confetti({ particleCount: 100, spread: 90, origin: { y: 0.55 }, colors: ['#d946ef', '#7c3aed', '#f43f5e', '#fbbf24', '#34d399'] })
      setTimeout(onComplete, 1200)
    }
  }

  return (
    <motion.div className="stage" key="stage3" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}>
      <div className="stage-card glass-card">
        <span className="stage-emoji">🤔</span>
        <h2 className="stage-title gradient-text">Emoji Decoder</h2>
        <p className="stage-subtitle">{EMOJI_PUZZLE.question}</p>

        <div className="emoji-display">{EMOJI_PUZZLE.emojis}</div>

        <div className="photo-clue-options">
          {EMOJI_PUZZLE.options.map(opt => (
            <motion.button
              key={opt.id}
              className={`option-btn${
                chosen === opt.id && opt.id === EMOJI_PUZZLE.correctId ? ' correct-choice' :
                chosen === opt.id ? ' wrong-choice' : ''
              }`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => !chosen && pick(opt.id)}
            >
              <span style={{ fontSize: '2rem' }}>{opt.emoji}</span>
              <span>{opt.label}</span>
            </motion.button>
          ))}
        </div>

        {chosen && chosen !== EMOJI_PUZZLE.correctId && (
          <motion.p style={{ color: '#f43f5e', fontWeight: 700 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            So close! Try another 🤭
          </motion.p>
        )}
        {chosen === EMOJI_PUZZLE.correctId && (
          <motion.div className="success-badge" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            👑 She IS the Birthday Queen!
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────
   STAGE 4: Memory Sequence — Memorize & Recall Balloon Order
   Two-phase gameplay: MEMORIZE (2.5s) → RECALL (hidden sequence)
─────────────────────────────────────────────── */
const BALLOON_SEQUENCE = ['🩷', '💜', '💛']
const ALL_BALLOONS = [
  { id: 0, emoji: '🩷', color: '#f43f5e' },
  { id: 1, emoji: '🧡', color: '#f97316' },
  { id: 2, emoji: '💜', color: '#7c3aed' },
  { id: 3, emoji: '💙', color: '#3b82f6' },
  { id: 4, emoji: '💛', color: '#fbbf24' },
  { id: 5, emoji: '💚', color: '#22c55e' },
]

const MEMORIZE_DURATION = 2500 // 2.5 seconds

function Stage4({ onComplete }) {
  const [phase, setPhase] = useState('MEMORIZE') // MEMORIZE | RECALL
  const [playerInput, setPlayerInput] = useState([])
  const [wrong, setWrong] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const timerRef = useRef(null)
  const phaseStartRef = useRef(Date.now())
  const gameIdRef = useRef(0) // Track game session to prevent stale callbacks

  // Clear timer helper
  const clearTimer = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  // Start a new game session
  const startGame = () => {
    const currentGameId = ++gameIdRef.current
    setPhase('MEMORIZE')
    setPlayerInput([])
    setWrong(false)
    setSuccess(false)
    phaseStartRef.current = Date.now()

    timerRef.current = setTimeout(() => {
      // Ignore if game has been restarted
      if (gameIdRef.current !== currentGameId) return
      setPhase('RECALL')
      phaseStartRef.current = Date.now()
      timerRef.current = null
    }, MEMORIZE_DURATION)
  }

  // Handle balloon selection during RECALL phase
  const handleSelect = (balloon) => {
    // Ignore selections during MEMORIZE phase
    if (phase !== 'RECALL') return
    if (success || wrong) return

    const expectedIndex = playerInput.length
    const expectedEmoji = BALLOON_SEQUENCE[expectedIndex]

    if (balloon.emoji === expectedEmoji) {
      // Correct selection
      const newInput = [...playerInput, balloon.emoji]
      setPlayerInput(newInput)

      if (newInput.length === BALLOON_SEQUENCE.length) {
        // Sequence complete!
        setSuccess(true)
        clearTimer()
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#d946ef', '#7c3aed', '#f43f5e', '#fbbf24', '#34d399', '#60a5fa'],
          scalar: 1.2,
        })
        setTimeout(onComplete, 1600)
      }
    } else {
      // Wrong selection
      setWrong(true)
      clearTimer()
      setTimeout(() => {
        setWrong(false)
        setPlayerInput([])
        // Restart the game with a fresh memorize phase
        startGame()
      }, 800)
    }
  }

  // Initialize on mount
  useEffect(() => {
    startGame()
    return () => clearTimer() // Cleanup on unmount
  }, [])

  const BALLOON_COLORS = {
    '#f43f5e': '#ff6b8a',
    '#f97316': '#fb923c',
    '#7c3aed': '#a855f7',
    '#3b82f6': '#60a5fa',
    '#fbbf24': '#fde68a',
    '#22c55e': '#4ade80',
  }

  // Build display sequence: show actual during MEMORIZE, masked during RECALL
  const displaySequence = phase === 'MEMORIZE' 
    ? BALLOON_SEQUENCE 
    : BALLOON_SEQUENCE.map((emoji, i) => (i < playerInput.length ? playerInput[i] : '❓'))

  // Progress text for MEMORIZE phase
  const memorizeProgress = phase === 'MEMORIZE' 
    ? Math.max(0, MEMORIZE_DURATION - (Date.now() - phaseStartRef.current))
    : 0

  return (
    <motion.div className="stage" key="stage4" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}>
      <div className="stage-card glass-card">
        <span className="stage-emoji">🎈</span>
        <h2 className="stage-title gradient-text">Memory Sequence Challenge!</h2>
        
        {phase === 'MEMORIZE' && (
          <motion.p className="stage-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            🧠 Memorize the sequence!
            <br />
            <span style={{ fontSize: '1.1rem', opacity: 0.8 }}>
              Time: {(memorizeProgress / 1000).toFixed(1)}s
            </span>
          </motion.p>
        )}

        {phase === 'RECALL' && (
          <motion.p className="stage-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            🎯 Now recall the sequence!
            <br />
            <span style={{ fontSize: '1.1rem', opacity: 0.8 }}>
              Select the balloons in order
            </span>
          </motion.p>
        )}

        {/* Target sequence display */}
        <div 
          className="sequence-display" 
          style={{ 
            fontSize: '2rem', 
            letterSpacing: '8px', 
            margin: '16px 0',
            minHeight: '48px',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}
          role="status"
          aria-live="polite"
          aria-label={phase === 'MEMORIZE' ? 'Sequence to memorize' : 'Your current progress'}
        >
          {displaySequence.map((emoji, i) => (
            <span 
              key={i} 
              style={{ 
                opacity: phase === 'RECALL' && i >= playerInput.length ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        {phase === 'MEMORIZE' && (
          <div 
            style={{ 
              height: 4, 
              background: 'rgba(255,255,255,0.2)', 
              borderRadius: 2, 
              overflow: 'hidden',
              marginBottom: 16
            }}
            role="progressbar"
            aria-valuenow={Math.round((1 - memorizeProgress / MEMORIZE_DURATION) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Memorization time remaining"
          >
            <motion.div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #d946ef, #7c3aed, #fbbf24)',
                borderRadius: 2,
                transition: 'width 0.1s linear'
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${(1 - memorizeProgress / MEMORIZE_DURATION) * 100}%` }}
            />
          </div>
        )}

        {/* Selection grid - only interactive during RECALL */}
        <div className="balloons-grid" role="group" aria-label="Balloon selection">
          {ALL_BALLOONS.map((b, i) => (
            <motion.div
              key={b.id}
              className={`balloon${phase === 'RECALL' && playerInput.includes(b.emoji) ? ' selected' : ''}`}
              style={{
                background: `radial-gradient(circle at 30% 30%, ${BALLOON_COLORS[b.color] || b.color}, ${b.color})`,
                '--fdur': `${2.5 + i * 0.4}s`,
                '--fdelay': `${i * 0.2}s`,
                opacity: phase === 'RECALL' && wrong ? 0.6 : 1,
                pointerEvents: phase === 'RECALL' && !wrong && !success ? 'auto' : 'none',
              }}
              whileHover={phase === 'RECALL' && !wrong && !success ? { scale: 1.15, y: -8 } : {}}
              whileTap={phase === 'RECALL' && !wrong && !success ? { scale: 0.8 } : {}}
              onClick={() => handleSelect(b)}
              tabIndex={phase === 'RECALL' && !wrong && !success ? 0 : -1}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && phase === 'RECALL') handleSelect(b); }}
              role="button"
              aria-label={`Balloon ${b.emoji}`}
              aria-disabled={phase !== 'RECALL' || wrong || success}
            >
              {b.emoji}
            </motion.div>
          ))}
        </div>

        {wrong && (
          <motion.p 
            style={{ color: '#f43f5e', fontWeight: 700 }} 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            role="alert"
            aria-live="assertive"
          >
            Oops! Wrong order — starting over! 😄
          </motion.p>
        )}
        {success && (
          <motion.div className="success-badge" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            🎊 You cracked it all!
          </motion.div>
        )}

        <p className="hint-text" style={{ marginTop: 16 }}>
          {phase === 'MEMORIZE' 
            ? `Memorize: ${BALLOON_SEQUENCE.join(' → ')}` 
            : `Progress: ${playerInput.length}/${BALLOON_SEQUENCE.length}`}
        </p>
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────
   FINAL REVEAL SCREEN
─────────────────────────────────────────────── */
function RevealScreen() {
  const [flipped, setFlipped] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [blasted, setBlasted] = useState(false)

  useEffect(() => {
    // Big confetti blast on mount
    const blast = () => {
      confetti({
        particleCount: 180,
        spread: 140,
        origin: { y: 0.4, x: 0.3 },
        colors: ['#d946ef', '#7c3aed', '#f43f5e', '#fbbf24', '#34d399'],
        scalar: 1.3,
      })
      confetti({
        particleCount: 180,
        spread: 140,
        origin: { y: 0.4, x: 0.7 },
        colors: ['#d946ef', '#7c3aed', '#f43f5e', '#fbbf24', '#34d399'],
        scalar: 1.3,
      })
    }
    blast()
    const t = setTimeout(blast, 600)
    return () => clearTimeout(t)
  }, [])

  const handleCardClick = () => {
    if (!flipped) {
      setFlipped(true)
      setTimeout(() => setShowMessage(true), 700)
      if (!blasted) {
        setBlasted(true)
        confetti({
          particleCount: 300,
          spread: 160,
          origin: { y: 0.5 },
          colors: ['#fbbf24', '#f59e0b', '#d946ef', '#f43f5e', '#7c3aed'],
          scalar: 1.5,
          startVelocity: 45,
        })
      }
    }
  }

  return (
    <motion.div
      className="stage reveal-screen"
      key="reveal"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="reveal-title font-display glow-text">
          Happy Birthday,<br />Naisula! 🎂
        </h1>
        <p className="reveal-sub">You cracked all 5 — blue shirt, road kiss and all 👑💜</p>
      </motion.div>

      {/* Flip card */}
      <motion.div
        className="gift-card-scene"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.7 }}
        onClick={handleCardClick}
        title="Tap to reveal your gift!"
      >
        <div className={`gift-card-inner${flipped ? ' flipped' : ''}`}>
          {/* Front face */}
          <div className="gift-card-face gift-card-front">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <div className="card-name">Naisula ✨</div>
              <div className="card-subtitle" style={{ marginBottom: 16 }}>Your Birthday Surprise</div>
              <div style={{ fontSize: '3rem' }}>🎁</div>
              <div className="card-subtitle" style={{ marginTop: 12, fontSize: '0.8rem' }}>
                Tap to unwrap →
              </div>
            </motion.div>
          </div>

          {/* Back face */}
          <div className="gift-card-face gift-card-back">
            <div className="mpesa-cta">🟢 Check your M-Pesa</div>
            <span className="mpesa-amount">KES 1,000</span>
            <div style={{ fontSize: '1.6rem', margin: '6px 0' }}>💸</div>
            <div className="mpesa-note">
              It's already in your inbox — just for you, just because you deserve every cent of it 💜
            </div>
          </div>
        </div>
      </motion.div>

      {!flipped && (
        <motion.p
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 20 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          👆 Tap the card to reveal your gift!
        </motion.p>
      )}

      {showMessage && (
        <motion.div
          className="glass-card"
          style={{ padding: '28px 32px', borderRadius: 24, maxWidth: 480, margin: '0 auto' }}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ fontSize: '1.6rem', marginBottom: 12 }}>💌</div>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.88)' }}>
            Naisula — two years is a long time to spend apart from someone you love. 
            But here we are, back where we should've never left. 🕊️
            <br /><br />
            From that first date in the blue shirt, to the kiss on the road that neither of us planned — 
            every memory with you is one I kept safe. 💙
            <br /><br />
            Happy birthday, love. May this year be the beginning of everything beautiful — together. 🎂✨
          </p>
          <div style={{ marginTop: 20, fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
            Made with every bit of 💜 — just for you
          </div>
        </motion.div>
      )}

      {showMessage && (
        <motion.div
          style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <button
            className="btn-primary"
            onClick={() => {
              confetti({
                particleCount: 200,
                spread: 180,
                origin: { y: 0.6 },
                colors: ['#d946ef', '#7c3aed', '#f43f5e', '#fbbf24', '#34d399'],
              })
            }}
          >
            🎊 More Confetti!
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

/* ────────────────────────────────────────────────
   WELCOME SCREEN
─────────────────────────────────────────────── */
function WelcomeScreen({ onStart }) {
  return (
    <motion.div
      className="stage"
      key="welcome"
      style={{ textAlign: 'center' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <motion.div
        style={{ fontSize: '5rem', marginBottom: 16 }}
        animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 3, repeatDelay: 1 }}
      >
        🎂
      </motion.div>

      <h1 className="font-display" style={{ fontSize: 'clamp(2.4rem, 8vw, 4rem)', marginBottom: 12, lineHeight: 1.1 }}>
        <span className="gradient-text">A Special Gift</span>
        <br />
        <span style={{ color: 'white' }}>Awaits You</span>
      </h1>

      <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', marginBottom: 12, lineHeight: 1.7 }}>
        Hey Naisula 👋 Someone who cares about you<br />
        prepared something extra special today.
      </p>

      <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.45)', marginBottom: 40 }}>
        Solve 5 puzzles to unlock your birthday surprise 🔐<br />
        <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.28)' }}>This one's personal 💜</span>
      </p>

      <motion.button
        className="btn-primary"
        style={{ fontSize: '1.2rem', padding: '18px 44px' }}
        onClick={onStart}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
      >
        🎁 Open My Gift
      </motion.button>

      <p style={{ marginTop: 20, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
        5 puzzles · Very personal · Worth every second 💕
      </p>
    </motion.div>
  )
}

/* ────────────────────────────────────────────────
   STAR FIELD BACKGROUND
─────────────────────────────────────────────── */
function StarField() {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    dur: Math.random() * 3 + 2,
    delay: Math.random() * 4,
  }))

  return (
    <div className="stars-layer">
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            '--dur': `${s.dur}s`,
            '--delay': `${s.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────
   FLOATING PARTICLES
─────────────────────────────────────────────── */
const PARTY_EMOJIS = ['🎉', '✨', '🎊', '⭐', '💜', '🌟', '🎈', '🦋', '💫', '🌸']
function Particles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    emoji: PARTY_EMOJIS[i % PARTY_EMOJIS.length],
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 1.2 + 0.8}rem`,
    dur: `${Math.random() * 8 + 8}s`,
    delay: `${Math.random() * 8}s`,
    rot: `${Math.random() * 360}deg`,
  }))

  return (
    <div className="particles-layer">
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            '--size': p.size,
            '--dur': p.dur,
            '--delay': p.delay,
            '--rot': p.rot,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────
   PROGRESS DOTS
─────────────────────────────────────────────── */
function ProgressDots({ current, total }) {
  return (
    <div className="progress-track" style={{ zIndex: 2, position: 'relative' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`progress-dot${i < current ? ' done' : i === current ? ' active' : ''}`}
        />
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────
   MAIN APP
─────────────────────────────────────────────── */
export default function App() {
  const [screen, setScreen] = useState('welcome') // welcome | puzzle | reveal
  const [stage, setStage] = useState(0)

  const STAGES = [Stage1, Stage2, Stage3, Stage4, RunawayHeartStage, BlueShirtStage, FirstKissStage]
  const CurrentStage = STAGES[stage]

  const nextStage = () => {
    if (stage < STAGES.length - 1) {
      setStage(s => s + 1)
    } else {
      setScreen('reveal')
    }
  }

  return (
    <div className="app-container">
      <StarField />
      <Particles />

      <AnimatePresence mode="wait">
        {screen === 'welcome' && (
          <WelcomeScreen key="welcome" onStart={() => setScreen('puzzle')} />
        )}

        {screen === 'puzzle' && (
          <motion.div
            key="puzzle-wrapper"
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <ProgressDots current={stage} total={STAGES.length} />
            <AnimatePresence mode="wait">
              <CurrentStage key={`stage-${stage}`} onComplete={nextStage} />
            </AnimatePresence>
          </motion.div>
        )}

        {screen === 'reveal' && (
          <RevealScreen key="reveal" />
        )}
      </AnimatePresence>
    </div>
  )
}
