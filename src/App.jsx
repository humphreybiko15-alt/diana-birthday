import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { RunawayHeartStage, BlueShirtStage, FirstKissStage } from './LoveStages.jsx'
import { MemorySequenceLogic } from './memorySequenceLogic.js'
import { compressState, getShareableUrl, parseUrlState } from './urlState.js'
import StoryCardPreview from './StoryCardCanvas.jsx'

/* ═══════════════════════════════════════════════════════════════════════════════
   DEFAULT VALUES (fallback when no URL hash state)
   ═══════════════════════════════════════════════════════════════════════════════ */

const DEFAULT_RECIPIENT_NAME = 'Mali'
const DEFAULT_CUSTOM_MESSAGE = "You cracked all 7 — blue shirt, road kiss and all 👑💜"
const DEFAULT_TARGET_WORD = 'MALI'
const DEFAULT_BALLOON_SEQUENCE = ['🩷', '💜', '💛']
const MEMORIZE_DURATION = 2500

/* ══════════════════════════════════════════════════════════════════════════════════════
   CREATE YOUR OWN MODAL
   ═══════════════════════════════════════════════════════════════════════════════════════ */

function CreateYourOwnModal({ onClose, onCreate }) {
  const [recipientName, setRecipientName] = useState(DEFAULT_RECIPIENT_NAME)
  const [customMessage, setCustomMessage] = useState(DEFAULT_CUSTOM_MESSAGE)
  const [customScramble, setCustomScramble] = useState(DEFAULT_TARGET_WORD)
  const [showScramble, setShowScramble] = useState(false)
  const [showMemory, setShowMemory] = useState(false)
  const [memorySequence, setMemorySequence] = useState(DEFAULT_BALLOON_SEQUENCE.join(' → '))
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = (e) => {
    e.preventDefault()
    setIsCreating(true)

    // Build custom state
    const state = {
      recipientName: recipientName.trim() || DEFAULT_RECIPIENT_NAME,
      customMessage: customMessage.trim() || DEFAULT_CUSTOM_MESSAGE,
      stages: [
        { id: 1, type: 'scramble', targetWord: customScramble.trim().toUpperCase() || DEFAULT_TARGET_WORD, clue: `Spell out ${recipientName.trim() || DEFAULT_RECIPIENT_NAME}'s name!` },
        { id: 2, type: 'year', clue: `What year was ${recipientName.trim() || DEFAULT_RECIPIENT_NAME} born?`, answerRange: [1980, 2010] },
        { id: 3, type: 'emoji', emojis: '🌟 👑 🎉', question: 'What do these emojis represent?', options: ['Party Animal', 'Birthday Queen', 'Music Lover', 'Night Owl'], correctIndex: 1 },
        { id: 4, type: 'memory', sequence: memorySequence.split(' → ').filter(Boolean).length > 0 ? memorySequence.split(' → ').map(s => s.trim()) : DEFAULT_BALLOON_SEQUENCE },
        { id: 5, type: 'runaway' },
        { id: 6, type: 'quiz', headline: "Test Your Memory 👀", emojiClue: '👕 🎨 💭', question: "What color was my shirt on our very first date?", options: ['Red', 'Blue', 'Black', 'White'], correctIndex: 1 },
        { id: 7, type: 'quiz', headline: "Never Forget This One 💋", emojiClue: '💋 📍 🌙', question: "Where did we share our very first kiss?", options: ['At a restaurant', 'At home', 'On the road', 'At school'], correctIndex: 2 },
      ],
      createdAt: Date.now(),
    }

    // Compress to URL hash
    const compressed = compressState(state)
    const hashUrl = window.location.origin + window.location.pathname + '#' + compressed

    setIsCreating(false)
    onCreate(hashUrl, state)
  }

  return (
    <motion.div
      className="create-modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      role="dialog" aria-modal="true" aria-label="Create Your Own Birthday Game"
    >
      <motion.div
        className="create-modal-card"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className="create-modal-header">
          <h2 className="create-modal-title">🎨 Make One for Someone You Love</h2>
          <button className="create-modal-close" onClick={onClose} aria-label="Close creator">✕</button>
        </div>

        <form onSubmit={handleCreate} className="create-form">
          <div className="form-group">
            <label className="form-label" htmlFor="recipientName">Their Name</label>
            <input
              id="recipientName"
              type="text"
              className="form-input"
              placeholder="e.g. Sarah, Alex, Maya"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              maxLength={30}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="customMessage">Custom Message (shown at the end)</label>
            <textarea
              id="customMessage"
              className="form-textarea"
              rows={3}
              placeholder="Your special message here..."
              value={customMessage}
              onChange={e => setCustomMessage(e.target.value)}
              maxLength={300}
            />
          </div>

          <fieldset className="form-options">
            <legend className="form-options-title">Optional Customizations</legend>
            <div className="form-option">
              <input
                type="checkbox"
                id="showScramble"
                className="form-checkbox"
                checked={showScramble}
                onChange={() => setShowScramble(!showScramble)}
              />
              <label htmlFor="showScramble" className="form-option-label">Customize the name scramble puzzle</label>
            </div>
            <div className="form-option">
              <input
                type="checkbox"
                id="showMemory"
                className="form-checkbox"
                checked={showMemory}
                onChange={() => setShowMemory(!showMemory)}
              />
              <label htmlFor="showMemory" className="form-option-label">Customize memory sequence balloons</label>
            </div>
          </fieldset>

          {showScramble && (
            <div className="form-group">
              <label className="form-label" htmlFor="customScramble">Name to Unscramble</label>
              <input
                id="customScramble"
                type="text"
                className="form-input"
                placeholder="e.g. SARAH"
                value={customScramble}
                onChange={e => setCustomScramble(e.target.value)}
                maxLength={20}
              />
              <p className="form-hint">Leave blank to use their name automatically</p>
            </div>
          )}

          {showMemory && (
            <div className="form-group">
              <label className="form-label" htmlFor="memorySequence">Memory Balloon Sequence</label>
              <input
                id="memorySequence"
                type="text"
                className="form-input"
                placeholder="🩷 → 💜 → 💛 (or custom emojis)"
                value={memorySequence}
                onChange={e => setMemorySequence(e.target.value)}
                maxLength={100}
              />
              <p className="form-hint">Separate balloons with " → " (e.g. 💙 → 💚 → 🧡)</p>
            </div>
          )}

          <div className="create-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : '🎁 Create & Get Shareable Link'}
            </button>
          </div>
        </form>

        <div className="create-modal-footer">
          <p className="create-hint">
            💡 Share the link via Instagram DM, WhatsApp, or iMessage — it's all client-side!
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STAGE 1: Letter Scramble (dynamic name)
   ═══════════════════════════════════════════════════════════════════════════════════════ */

function Stage1({ onComplete, targetWord = DEFAULT_TARGET_WORD, scrambledLetters = null, clue }) {
  const SCRAMBLED = scrambledLetters || [...targetWord].sort(() => Math.random() - 0.5)
  const TARGET_WORD = targetWord

  const [tiles] = useState(SCRAMBLED)
  const [selected, setSelected] = useState([])
  const [answer, setAnswer] = useState([])
  const [status, setStatus] = useState('idle')

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
        <h2 className="stage-title gradient-text">{clue || `Who's the Birthday Star?`}</h2>
        <p className="stage-subtitle">
          Tap the letters in the right order to spell out their name!
        </p>

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
            ✨ YES! That's them!
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

/* ════════════════════════════════════════════════════════════════════════════════════════
   STAGE 2: Birthday Math (dynamic name)
   ════════════════════════════════════════════════════════════════════════════════════════ */

function Stage2({ onComplete, recipientName = DEFAULT_RECIPIENT_NAME }) {
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
          What year was {recipientName} born? 📅<br />
          <span style={{ fontSize: '0.9rem', opacity: 0.6 }}>(Go ahead, they won't admit it 😏)</span>
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
            🎉 Locked in! They're forever young!
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

/* ════════════════════════════════════════════════════════════════════════════════════════
   STAGE 3: Emoji Riddle
   ════════════════════════════════════════════════════════════════════════════════════════ */

function Stage3({ onComplete }) {
  const [chosen, setChosen] = useState(null)

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
            👑 They ARE the Birthday Queen!
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════════════════
   STAGE 4: Memory Sequence (dynamic balloons)
   ════════════════════════════════════════════════════════════════════════════════════════ */

const ALL_BALLOONS = [
  { id: 0, emoji: '🩷', color: '#f43f5e' },
  { id: 1, emoji: '🧡', color: '#f97316' },
  { id: 2, emoji: '💜', color: '#7c3aed' },
  { id: 3, emoji: '💙', color: '#3b82f6' },
  { id: 4, emoji: '💛', color: '#fbbf24' },
  { id: 5, emoji: '💚', color: '#22c55e' },
]

function Stage4({ onComplete, onFail, sequence = DEFAULT_BALLOON_SEQUENCE }) {
  const [state, setState] = useState(null)
  const [wrong, setWrong] = useState(false)
  const [success, setSuccess] = useState(false)

  const timerRef = useRef(null)
  const tickRef = useRef(null)
  const gameIdRef = useRef(0)

  const logicRef = useRef(new MemorySequenceLogic(sequence, MEMORIZE_DURATION))

  const clearTimers = () => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (tickRef.current !== null) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
  }

  const startGame = useCallback((onComplete) => {
    clearTimers()
    const currentGameId = ++gameIdRef.current

    logicRef.current.start(
      (_phase) => {
        if (gameIdRef.current !== currentGameId) return
        setState(logicRef.current.getState())
      },
      () => {
        if (gameIdRef.current !== currentGameId) return
        setSuccess(true)
        confetti({
          particleCount: 200,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#d946ef', '#7c3aed', '#f43f5e', '#fbbf24', '#34d399', '#60a5fa'],
          scalar: 1.2,
        })
        setTimeout(onComplete, 1600)
      },
      () => {
        if (gameIdRef.current !== currentGameId) return
        setWrong(true)
        if (onFail) onFail()
        setTimeout(() => {
          setWrong(false)
          setSuccess(false)
          startGame(onComplete)
        }, 800)
      }
    )

    setState(logicRef.current.getState())

    tickRef.current = setInterval(() => {
      if (logicRef.current.getState().phase === 'MEMORIZE') {
        setState(logicRef.current.getState())
      }
    }, 50)
  }, [onFail])

  const handleSelect = (balloon) => {
    const s = logicRef.current.getState()
    if (s.phase !== 'RECALL') return
    if (success || wrong) return

    const result = logicRef.current.handleSelection(balloon.emoji)
    if (!result.allowed) return
    setState(logicRef.current.getState())
  }

  useEffect(() => {
    startGame(onComplete)
    return () => clearTimers()
  }, [startGame, onComplete])

  const BALLOON_COLORS = {
    '#f43f5e': '#ff6b8a',
    '#f97316': '#fb923c',
    '#7c3aed': '#a855f7',
    '#3b82f6': '#60a5fa',
    '#fbbf24': '#fde68a',
    '#22c55e': '#4ade80',
  }

  return (
    <motion.div className="stage" key="stage4" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}>
      <div className="stage-card glass-card">
        <span className="stage-emoji">🎈</span>
        <h2 className="stage-title gradient-text">Memory Sequence Challenge!</h2>

        {state?.phase === 'MEMORIZE' && (
          <motion.p className="stage-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            🧠 Memorize the sequence!
            <br />
            <span style={{ fontSize: '1.1rem', opacity: 0.8 }}>
              Time: {(state.timeRemaining / 1000).toFixed(1)}s
            </span>
          </motion.p>
        )}

        {state?.phase === 'RECALL' && (
          <motion.p className="stage-subtitle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            🎯 Now recall the sequence!
            <br />
            <span style={{ fontSize: '1.1rem', opacity: 0.8 }}>
              Select the balloons in order
            </span>
          </motion.p>
        )}

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
          aria-label={state?.phase === 'MEMORIZE' ? 'Sequence to memorize' : 'Your current progress'}
        >
          {logicRef.current.getDisplaySequence().map((emoji, i) => (
            <span
              key={i}
              style={{
                opacity: state?.phase === 'RECALL' && i >= state?.playerInput.length ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        {state?.phase === 'MEMORIZE' && (
          <div style={{
            height: 4,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 2,
            overflow: 'hidden',
            marginBottom: 16
          }}
          role="progressbar"
          aria-valuenow={Math.round((1 - state.timeRemaining / MEMORIZE_DURATION) * 100)}
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
              animate={{ width: `${(1 - state.timeRemaining / MEMORIZE_DURATION) * 100}%` }}
            />
          </div>
        )}

        <div className="balloons-grid" role="group" aria-label="Balloon selection">
          {ALL_BALLOONS.map((b, i) => (
            <motion.div
              key={b.id}
              className={`balloon${state?.phase === 'RECALL' && state?.playerInput.includes(b.emoji) ? ' selected' : ''}`}
              style={{
                background: `radial-gradient(circle at 30% 30%, ${BALLOON_COLORS[b.color] || b.color}, ${b.color})`,
                '--fdur': `${2.5 + i * 0.4}s`,
                '--fdelay': `${i * 0.2}s`,
                opacity: state?.phase === 'RECALL' && wrong ? 0.6 : 1,
                pointerEvents: state?.phase === 'RECALL' && !wrong && !success ? 'auto' : 'none',
              }}
              whileHover={state?.phase === 'RECALL' && !wrong && !success ? { scale: 1.15, y: -8 } : {}}
              whileTap={state?.phase === 'RECALL' && !wrong && !success ? { scale: 0.8 } : {}}
              onClick={() => handleSelect(b)}
              tabIndex={state?.phase === 'RECALL' && !wrong && !success ? 0 : -1}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && state?.phase === 'RECALL') handleSelect(b); }}
              role="button"
              aria-label={`Balloon ${b.emoji}`}
              aria-disabled={state?.phase !== 'RECALL' || wrong || success}
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
          {state?.phase === 'MEMORIZE'
            ? `Memorize: ${sequence.join(' → ')}`
            : `Progress: ${state?.playerInput.length}/${sequence.length}`}
        </p>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════════════════
   FINAL REVEAL SCREEN (dynamic name + message + share)
   ════════════════════════════════════════════════════════════════════════════════════════ */

function RevealScreen({ recipientName = DEFAULT_RECIPIENT_NAME, customMessage = DEFAULT_CUSTOM_MESSAGE, onPlayAgain, mode = 'single', currentPlayer = 1, playerResults = { 1: null, 2: null } }) {
  const [flipped, setFlipped] = useState(false)
  const [showMessage, setShowMessage] = useState(false)
  const [blasted, setBlasted] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [showStoryCard, setShowStoryCard] = useState(false)

  useEffect(() => {
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

  useEffect(() => {
    // Compress current state to share URL after reveal
    const state = {
      recipientName,
      customMessage,
      createdAt: Date.now(),
    }
    const url = getShareableUrl(state)
    setShareUrl(url)
  }, [recipientName, customMessage])

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

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      // Could add toast notification
    })
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
        {mode === 'passAndPlay' ? (
          <>
            <h1 className="reveal-title font-display glow-text">
              Happy Birthday, {recipientName}! 🎂
            </h1>
            <p className="reveal-sub">Both players completed all 7 stages! 👯💜</p>
            <PassAndPlayResults playerResults={playerResults} recipientName={recipientName} />
          </>
        ) : (
          <>
            <h1 className="reveal-title font-display glow-text">
              Happy Birthday,<br />{recipientName}! 🎂
            </h1>
            <p className="reveal-sub">You cracked all 7 — blue shirt, road kiss and all 👑💜</p>
          </>
        )}
      </motion.div>

      {mode !== 'passAndPlay' && (
        <div
          className="gift-card-scene"
          style={{ perspective: 1000, width: '100%', height: 340, margin: '30px auto', position: 'relative' }}
        >
          <motion.div
            className="gift-card"
            initial={{ rotateY: 0 }}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transformStyle: 'preserve-3d',
              cursor: 'pointer',
            }}
            onClick={handleCardClick}
          >
            <div className="gift-card-face gift-card-front">
              <div style={{ fontSize: '4rem', marginBottom: 12 }}>🎁</div>
              <div className="card-name">{recipientName}</div>
              <div className="card-subtitle">A Special Gift Just For You</div>
            </div>
            <div className="gift-card-face gift-card-back">
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>💜</div>
              <div className="card-name">It Was Always You</div>
              <div className="card-subtitle">Open to see your surprise</div>
            </div>
          </motion.div>
        </div>
      )}

      {!flipped && mode !== 'passAndPlay' && (
        <motion.p
          style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: 20 }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          👆 Tap the card to reveal your gift!
        </motion.p>
      )}

      {showMessage && mode !== 'passAndPlay' && (
        <motion.div
          className="glass-card"
          style={{ padding: '28px 32px', borderRadius: 24, maxWidth: 480, margin: '0 auto' }}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div style={{ fontSize: '1.6rem', marginBottom: 12 }}>💌</div>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.85, color: 'rgba(255,255,255,0.88)' }}>
            {customMessage}
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

          <button
            className="btn-secondary"
            onClick={() => setShowShareModal(true)}
          >
            🔗 Share Link
          </button>

          <button
            className="btn-secondary"
            onClick={() => setShowStoryCard(true)}
          >
            📱 Story Card
          </button>

          <button
            className="btn-secondary"
            onClick={onPlayAgain}
          >
            🔄 Play Again
          </button>
        </motion.div>
      )}

      {/* Share Link Modal */}
      {showShareModal && (
        <motion.div
          className="create-modal-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setShowShareModal(false)}
          role="dialog" aria-modal="true" aria-label="Share Your Game"
        >
          <motion.div
            className="create-modal-card"
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <div className="create-modal-header">
              <h2 className="create-modal-title">🔗 Share Your Game</h2>
              <button className="create-modal-close" onClick={() => setShowShareModal(false)}>✕</button>
            </div>
            <div className="share-content">
              <input
                className="share-url-input"
                value={shareUrl}
                readOnly
              />
              <button className="btn-primary" onClick={copyShareLink}>
                📋 Copy Link
              </button>
            </div>
            <p className="create-hint">
              Paste this link anywhere — it opens the same game with your custom settings!
            </p>
          </motion.div>
        </motion.div>
      )}

      {/* Story Card Preview */}
      {showStoryCard && (
        <StoryCardPreview
          params={{
            recipientName,
            score: 7,
            maxScore: 7,
            customMessage,
            shareUrl,
          }}
          onClose={() => setShowStoryCard(false)}
        />
      )}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   MODE SELECTION SCREEN (Single Player vs Pass & Play)
   ════════════════════════════════════════════════════════════════════════════════════════ */

function ModeSelectionScreen({ onModeSelect, recipientName = DEFAULT_RECIPIENT_NAME }) {
  return (
    <motion.div
      className="stage"
      key="mode-selection"
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

      <h1 className="font-display" style={{ fontSize: 'clamp(2.4rem, 8vw, 4rem)', marginBottom: 8, lineHeight: 1.1 }}>
        <span className="gradient-text">Choose Your Mode</span>
      </h1>

      <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.7)', marginBottom: 40, lineHeight: 1.7 }}>
        Hey {recipientName} 👋 How do you want to play?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 320, margin: '0 auto' }}>
        <motion.button
          className="btn-primary"
          style={{ fontSize: '1.15rem', padding: '20px 32px', textAlign: 'left' }}
          onClick={() => onModeSelect('single')}
          whileHover={{ scale: 1.04, x: 8 }}
          whileTap={{ scale: 0.98 }}
        >
          <span style={{ fontSize: '1.5rem', marginRight: 12 }}>🎮</span>
          <div>
            <div style={{ fontWeight: 700 }}>Single Player</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 2 }}>Play solo through all 7 stages</div>
          </div>
        </motion.button>

        <motion.button
          className="btn-secondary"
          style={{ fontSize: '1.15rem', padding: '20px 32px', textAlign: 'left' }}
          onClick={() => onModeSelect('passAndPlay')}
          whileHover={{ scale: 1.04, x: 8 }}
          whileTap={{ scale: 0.98 }}
        >
          <span style={{ fontSize: '1.5rem', marginRight: 12 }}>👯</span>
          <div>
            <div style={{ fontWeight: 700 }}>Pass & Play (2 Players)</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 2 }}>Take turns — perfect for couples!</div>
          </div>
        </motion.button>
      </div>

      <p style={{ marginTop: 28, fontSize: '0.85rem', color: 'rgba(255,255,255,0.35)' }}>
        7 stages · Memory challenges · Personal surprises 💜
      </p>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PASS & PLAY RESULTS COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════════════════ */

function PassAndPlayResults({ playerResults, recipientName }) {
  const p1 = playerResults[1] || { completed: false, failedCount: 0 }
  const p2 = playerResults[2] || { completed: false, failedCount: 0 }
  const bothCompleted = p1.completed && p2.completed

  return (
    <motion.div
      className="glass-card"
      style={{ padding: '28px 32px', borderRadius: 24, maxWidth: 480, margin: '20px auto', textAlign: 'center' }}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>👯</div>
      <h2 style={{ fontSize: '1.4rem', marginBottom: 20, fontWeight: 700 }}>
        {bothCompleted ? 'Perfect Match!' : 'Results'}
      </h2>

      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        {/* Player 1 Card */}
        <motion.div
          className="glass-card"
          style={{ 
            padding: '20px 24px', 
            borderRadius: 16, 
            minWidth: 160,
            flex: 1,
            border: p1.completed ? '2px solid #34d399' : '2px solid rgba(255,255,255,0.1)',
            background: p1.completed ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255,255,255,0.03)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎮</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>Player 1</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: p1.completed ? '#34d399' : '#f43f5e' }}>
            {p1.completed ? '✅' : '❌'}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: 8 }}>
            {p1.failedCount > 0 ? `${p1.failedCount} retry${p1.failedCount > 1 ? 's' : ''}` : 'First try!'}
          </div>
        </motion.div>

        {/* VS Divider */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)',
          fontWeight: 700,
          fontSize: '1.2rem'
        }}>
          VS
        </div>

        {/* Player 2 Card */}
        <motion.div
          className="glass-card"
          style={{ 
            padding: '20px 24px', 
            borderRadius: 16, 
            minWidth: 160,
            flex: 1,
            border: p2.completed ? '2px solid #34d399' : '2px solid rgba(255,255,255,0.1)',
            background: p2.completed ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255,255,255,0.03)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🎮</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>Player 2</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: p2.completed ? '#34d399' : '#f43f5e' }}>
            {p2.completed ? '✅' : '❌'}
          </div>
          <div style={{ fontSize: '0.85rem', opacity: 0.7, marginTop: 8 }}>
            {p2.failedCount > 0 ? `${p2.failedCount} retry${p2.failedCount > 1 ? 's' : ''}` : 'First try!'}
          </div>
        </motion.div>
      </div>

      {bothCompleted && (
        <motion.div
          style={{ 
            padding: '16px', 
            borderRadius: 12, 
            background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.2), rgba(124, 58, 237, 0.2))',
            border: '1px solid rgba(217, 70, 239, 0.3)'
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>💕</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
            You both cracked it! 💜
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>
            True love conquers all 7 stages 👑
          </div>
        </motion.div>
      )}

      {!bothCompleted && (
        <motion.div
          style={{ 
            padding: '16px', 
            borderRadius: 12, 
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            {p1.completed && !p2.completed && 'Player 2 couldn\'t finish...'}
            {!p1.completed && p2.completed && 'Player 1 couldn\'t finish...'}
            {!p1.completed && !p2.completed && 'Neither player completed all stages'}
          </div>
          <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
            {recipientName}, you can always try again! 💜
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   PASS TURN SCREEN (shown between players in Pass & Play mode)
   ══════════════════════════════════════════════════════════════════════════════════════════ */

function PassTurnScreen({ currentPlayer, nextPlayer, onContinue, recipientName }) {
  return (
    <motion.div
      className="stage"
      key={`pass-turn-${nextPlayer}`}
      style={{ textAlign: 'center' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <motion.div
        style={{ fontSize: '6rem', marginBottom: 20 }}
        animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      >
        🎁
      </motion.div>

      <h1 className="font-display" style={{ fontSize: 'clamp(2.2rem, 8vw, 3.5rem)', marginBottom: 8, lineHeight: 1.1 }}>
        <span className="gradient-text">Pass to Player {nextPlayer}!</span>
      </h1>

      <p style={{ fontSize: '1.15rem', color: 'rgba(255,255,255,0.7)', marginBottom: 12, lineHeight: 1.7 }}>
        Player {currentPlayer} completed their turn 🎉
      </p>

      <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', marginBottom: 40, lineHeight: 1.6 }}>
        Hand the device to <strong>{recipientName}</strong> for their turn! 💜
      </p>

      <motion.button
        className="btn-primary"
        style={{ fontSize: '1.2rem', padding: '18px 44px' }}
        onClick={onContinue}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.95 }}
      >
        👉 Ready for Player {nextPlayer}
      </motion.button>

      <p style={{ marginTop: 24, fontSize: '0.85rem', color: 'rgba(255,255,255,0.3)' }}>
        Same 7 stages · Who cracks them all? 💕
      </p>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════════
   WELCOME SCREEN (dynamic name)
   ════════════════════════════════════════════════════════════════════════════════════════ */

function WelcomeScreen({ onStart, recipientName = DEFAULT_RECIPIENT_NAME, onCreate }) {
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
        Hey {recipientName} 👋 Someone who cares about you<br />
        prepared something extra special today.
      </p>

      <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.45)', marginBottom: 40 }}>
        Solve 7 puzzles to unlock your birthday surprise 🔐<br />
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

      <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={onCreate}>
          🎨 Make One for Someone You Love
        </button>
        <p style={{ marginTop: 20, fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>
          7 puzzles · Very personal · Worth every second 💕
        </p>
      </div>
    </motion.div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════════════════
   STAR FIELD BACKGROUND
   ════════════════════════════════════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════════════════════════════════════
   FLOATING PARTICLES
   ════════════════════════════════════════════════════════════════════════════════════════ */

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

/* ════════════════════════════════════════════════════════════════════════════════════════
   PROGRESS DOTS
   ════════════════════════════════════════════════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN APP
   ════════════════════════════════════════════════════════════════════════════════════════ */

export default function App() {
  const [screen, setScreen] = useState('welcome') // welcome | mode-selection | puzzle | pass-turn | reveal
  const [stage, setStage] = useState(0)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [gameState, setGameState] = useState(null)
  const [mode, setMode] = useState(null) // 'single' | 'passAndPlay'
  const [currentPlayer, setCurrentPlayer] = useState(1) // 1 or 2
  const [playerResults, setPlayerResults] = useState({ 1: null, 2: null }) // { completed: boolean, failedCount: number }

  const STAGES = [Stage1, Stage2, Stage3, Stage4, RunawayHeartStage, BlueShirtStage, FirstKissStage]
  const CurrentStage = STAGES[stage]

  // Parse URL hash on mount for shared state
  useEffect(() => {
    const parsed = parseUrlState()
    if (parsed) {
      setGameState(parsed)
      // Don't auto-start — user still clicks "Open My Gift"
    }
  }, [])

  const recipientName = gameState?.recipientName || DEFAULT_RECIPIENT_NAME
  const customMessage = gameState?.customMessage || DEFAULT_CUSTOM_MESSAGE

  const nextStage = () => {
    if (stage < STAGES.length - 1) {
      setStage(s => s + 1)
    } else {
      // Current player completed all stages
      handlePlayerComplete()
    }
  }

  const handlePlayerComplete = () => {
    setPlayerResults(prev => ({
      ...prev,
      [currentPlayer]: { completed: true, failedCount: 0 }
    }))

    if (mode === 'passAndPlay') {
      if (currentPlayer === 1) {
        // Switch to player 2
        setScreen('pass-turn')
        setCurrentPlayer(2)
        setStage(0)
      } else {
        // Both players done - go to reveal
        setScreen('reveal')
      }
    } else {
      // Single player mode
      setScreen('reveal')
    }
  }

  const handlePlayerFailed = () => {
    // Track failed attempts (for potential scoring)
    setPlayerResults(prev => ({
      ...prev,
      [currentPlayer]: {
        ...prev[currentPlayer],
        failedCount: (prev[currentPlayer]?.failedCount || 0) + 1
      }
    }))
  }

  const handlePassTurnContinue = () => {
    setScreen('puzzle')
  }

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode)
    setCurrentPlayer(1)
    setStage(0)
    setPlayerResults({ 1: null, 2: null })
    setScreen('puzzle')
  }

  const handleCreate = useCallback((url, state) => {
    setShareUrl(url)
    setGameState(state)
    setCreateModalOpen(false)
    setScreen('mode-selection') // Go to mode selection first
  }, [])

  const handlePlayAgain = () => {
    setScreen('welcome')
    setStage(0)
    setMode(null)
    setCurrentPlayer(1)
    setPlayerResults({ 1: null, 2: null })
  }

  // Determine what to render for puzzle screen
  const renderPuzzleScreen = () => {
    if (mode === 'passAndPlay') {
      return (
        <motion.div
          key="puzzle-wrapper"
          style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          {/* Pass & Play indicator */}
          <div style={{ 
            marginBottom: 16, 
            padding: '8px 16px', 
            background: 'rgba(217, 70, 239, 0.2)', 
            borderRadius: '20px',
            fontSize: '0.9rem',
            fontWeight: 600,
            color: '#d946ef'
          }}>
            🎮 Pass & Play · Player {currentPlayer}'s Turn
          </div>
          
          <ProgressDots current={stage} total={STAGES.length} />
          <AnimatePresence mode="wait">
            <CurrentStage
              key={`stage-${stage}-p${currentPlayer}`}
              onComplete={nextStage}
              onFail={handlePlayerFailed}
              recipientName={recipientName}
              customMessage={customMessage}
            />
          </AnimatePresence>
        </motion.div>
      )
    }

    return (
      <motion.div
        key="puzzle-wrapper"
        style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      >
        <ProgressDots current={stage} total={STAGES.length} />
        <AnimatePresence mode="wait">
          <CurrentStage
            key={`stage-${stage}`}
            onComplete={nextStage}
            recipientName={recipientName}
            customMessage={customMessage}
          />
        </AnimatePresence>
      </motion.div>
    )
  }

  return (
    <div className="app-container">
      <StarField />
      <Particles />

      <AnimatePresence mode="wait">
        {screen === 'welcome' && (
          <WelcomeScreen
            key="welcome"
            recipientName={recipientName}
            onStart={() => setScreen('mode-selection')}
            onCreate={() => setCreateModalOpen(true)}
          />
        )}

        {screen === 'mode-selection' && (
          <ModeSelectionScreen
            key="mode-selection"
            onModeSelect={handleModeSelect}
            recipientName={recipientName}
          />
        )}

        {screen === 'puzzle' && renderPuzzleScreen()}

        {screen === 'pass-turn' && (
          <PassTurnScreen
            key="pass-turn"
            currentPlayer={currentPlayer === 1 ? 2 : 1}
            nextPlayer={currentPlayer}
            onContinue={handlePassTurnContinue}
            recipientName={recipientName}
          />
        )}

        {screen === 'reveal' && (
          <RevealScreen
            key="reveal"
            recipientName={recipientName}
            customMessage={customMessage}
            shareUrl={shareUrl}
            mode={mode}
            currentPlayer={currentPlayer}
            playerResults={playerResults}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </AnimatePresence>

      {/* Create Your Own Modal */}
      {createModalOpen && (
        <CreateYourOwnModal
          onClose={() => setCreateModalOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  )
}