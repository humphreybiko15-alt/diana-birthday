import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

/* ════════════════════════════════════════════════════════
   ⚙️  CHANGE MY_NAME TO YOUR ACTUAL NAME!
   ════════════════════════════════════════════════════════ */
export const MY_NAME = 'Yours 💜' // ← Replace with YOUR name

/* ─── Sweet messages about your story ─────────────────── */
const SWEET_MSGS = [
  'Two years apart… yet you were never off my mind 💜',
  'Some love stories pause — they never really end ✨',
  'I remembered every smile, every single one 🌙',
  'Broken for two years, whole again now 💫',
  'You were always worth finding my way back to 🕊️',
  'The heart always knows where it belongs 🏡',
  'Blue shirt, first kiss on the road — I remember it all 💕',
  "This time, we're not letting go. Ever. 🔐",
  "Distance couldn't erase what we had 🌍",
  'Every day apart made me sure — it had to be you 💘',
]

/* ─── Decoy names ──────────────────────────────────────── */
const CHASE_DECOYS = ['Kevin', 'Brian', 'James', 'Mark']
const DRAG_DECOYS = [
  { x: 10, y: 44, name: 'Kevin' },
  { x: 88, y: 44, name: 'Brian' },
  { x: 10, y: 70, name: 'James' },
  { x: 88, y: 70, name: 'Mark' },
]

/* ─── Heart escape waypoints (%%) — spread around edges ── */
const WAYPOINTS = [
  [14, 25], [80, 18], [82, 68], [12, 72], [50, 85],
  [82, 42], [25, 55], [62, 28], [42, 68], [32, 18],
  [68, 80], [18, 42], [58, 55], [28, 80],
]
const MAX_ESCAPES = 5   // ← fewer escapes = easier to catch
const TARGET = { x: 50, y: 12 }

/* ══════════════════════════════════════════════════════════
   STAGE: Runaway Heart → Catch → Swipe Up to Unlock Name
   ══════════════════════════════════════════════════════════ */
export function RunawayHeartStage({ onComplete }) {
  const containerRef = useRef(null)
  const lastEscRef = useRef(0)
  const isDraggingRef = useRef(false)
  const progressRef = useRef(0)
  const unlockedRef = useRef(false)

  /* ── Phase 1: chase ──────────────────────────────── */
  const [pos, setPos] = useState({ x: 50, y: 50 })
  const [escapes, setEscapes] = useState(0)
  const [phase, setPhase] = useState('chase') // chase|catchable|caught|drag|done

  /* Floating love message */
  const [floatMsg, setFloatMsg] = useState(null)

  /* ── Phase 2: drag / unlock ──────────────────────── */
  const [dragPos, setDragPos] = useState({ x: 50, y: 70 })
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const [activeDecoy, setActiveDecoy] = useState(-1)
  const [decoyMsg, setDecoyMsg] = useState(null)

  /* Move heart to center when catchable */
  useEffect(() => {
    if (phase === 'catchable') {
      setPos({ x: 50, y: 50 })
    }
  }, [phase])

  /* ── Helpers ─────────────────────────────────────── */
  const getRelPos = (e) => {
    const el = containerRef.current
    if (!el) return { x: 50, y: 50 }
    const r = el.getBoundingClientRect()
    const touch = e.changedTouches?.[0] ?? e.touches?.[0]
    const cx = touch?.clientX ?? e.clientX ?? 0
    const cy = touch?.clientY ?? e.clientY ?? 0
    return {
      x: Math.max(4, Math.min(96, ((cx - r.left) / r.width) * 100)),
      y: Math.max(4, Math.min(96, ((cy - r.top) / r.height) * 100)),
    }
  }

  const showFloat = (text, x, y) => {
    setFloatMsg({ text, x, y })
    setTimeout(() => setFloatMsg(null), 2800)
  }

  /* ── Phase 1: pointer moves → heart runs ─────────── */
  const onChaseMove = (e) => {
    if (phase !== 'chase' && phase !== 'catchable') return
    const { x: mx, y: my } = getRelPos(e)
    const dist = Math.hypot(mx - pos.x, my - pos.y)
    /* Catchable = much slower to escape (threshold 10 vs 22) */
    const threshold = phase === 'catchable' ? 10 : 22

    if (dist < threshold && Date.now() - lastEscRef.current > 380) {
      lastEscRef.current = Date.now()
      /* When catchable, heart only escapes rarely to a small area */
      if (phase === 'catchable') {
        /* Just nudge a tiny bit — stays basically in center */
        const nudgeX = 50 + (Math.random() - 0.5) * 14
        const nudgeY = 50 + (Math.random() - 0.5) * 14
        setPos({ x: nudgeX, y: nudgeY })
        return
      }
      /* Normal escape: pick waypoint farthest from mouse */
      const sorted = [...WAYPOINTS].sort(
        ([ax, ay], [bx, by]) =>
          Math.hypot(bx - mx, by - my) - Math.hypot(ax - mx, ay - my)
      )
      const [nx, ny] = sorted[Math.floor(Math.random() * 5)]
      setPos({ x: nx, y: ny })
      showFloat(
        SWEET_MSGS[Math.floor(Math.random() * SWEET_MSGS.length)],
        18 + Math.random() * 58,
        12 + Math.random() * 34
      )
      setEscapes((prev) => {
        const n = prev + 1
        if (n >= MAX_ESCAPES) setPhase('catchable')
        return n
      })
    }
  }

  /* ── Phase 1: catch (tap anywhere in arena when catchable) ── */
  const onArenaTap = () => {
    if (phase !== 'catchable') return
    setPhase('caught')
    confetti({
      particleCount: 140,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#d946ef', '#fbbf24', '#7c3aed'],
      scalar: 1.2,
    })
    setTimeout(() => {
      progressRef.current = 0
      unlockedRef.current = false
      setProgress(0)
      setUnlocked(false)
      setDragPos({ x: 50, y: 70 })
      setPhase('drag')
    }, 950)
  }

  /* ── Phase 2: swipe/drag up to unlock name ─────────── */
  const onDragDown = (e) => {
    if (phase !== 'drag') return
    /* Accept press anywhere in the lower 65% of arena */
    const { y } = getRelPos(e)
    if (y > 32) {
      e.currentTarget.setPointerCapture(e.pointerId)
      isDraggingRef.current = true
      setIsDragging(true)
    }
  }

  const onDragMove = (e) => {
    if (phase !== 'drag' || !isDraggingRef.current) return
    const { x, y } = getRelPos(e)
    setDragPos({ x, y })

    const distToTarget = Math.hypot(x - TARGET.x, y - TARGET.y)
    const prog = Math.max(0, Math.min(100, (1 - distToTarget / 52) * 100))
    const newProg = Math.max(progressRef.current, prog)
    progressRef.current = newProg
    setProgress(newProg)

    /* Unlock name */
    if (prog > 65 && !unlockedRef.current) {
      unlockedRef.current = true
      setUnlocked(true)
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.35 },
        colors: ['#fbbf24', '#d946ef', '#7c3aed'],
      })
    }

    /* Complete */
    if (prog >= 88) {
      isDraggingRef.current = false
      setIsDragging(false)
      setPhase('done')
      confetti({
        particleCount: 250,
        spread: 160,
        origin: { y: 0.5 },
        colors: ['#fbbf24', '#f43f5e', '#d946ef', '#7c3aed', '#34d399'],
        scalar: 1.4,
        startVelocity: 44,
      })
      setTimeout(onComplete, 1700)
      return
    }

    /* Decoy proximity */
    const di = DRAG_DECOYS.findIndex(
      (d) => Math.hypot(x - d.x, y - d.y) < 16
    )
    if (di !== activeDecoy) {
      setActiveDecoy(di)
      if (di >= 0) {
        setDecoyMsg(`Nope, not ${DRAG_DECOYS[di].name}! His name is above ☝️`)
        setTimeout(() => setDecoyMsg(null), 2000)
      }
    }
  }

  const onDragUp = () => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    setIsDragging(false)
    if (progressRef.current < 88) {
      setDragPos({ x: 50, y: 70 })
    }
  }

  const isPhase2 = phase === 'drag' || phase === 'done'

  /* ─── Subtitle text per phase ───────────────────────── */
  const subtitleText = () => {
    if (phase === 'done') return `${MY_NAME} — It was always yours 💜`
    if (phase === 'drag') return unlocked
      ? `${MY_NAME} ✨ — swipe all the way up!`
      : `Swipe the 💖 up to unlock his name! 🔐`
    if (phase === 'caught') return 'You caught it! 💜 Loading your surprise...'
    if (phase === 'catchable') return 'It stopped! Tap anywhere to catch it! 🫰'
    return `Move your finger toward the heart! ${MAX_ESCAPES - escapes} more and it gives up 😏`
  }

  return (
    <motion.div
      className="stage no-select"
      key="runaway"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
    >
      <div className="stage-card glass-card" style={{ padding: '28px 18px' }}>
        {/* Header */}
        <span className="stage-emoji">{isPhase2 ? '🔐' : '💘'}</span>
        <h2 className="stage-title gradient-text">
          {isPhase2 ? 'Swipe to Unlock His Name' : 'Catch His Heart!'}
        </h2>
        <p className="stage-subtitle" style={{ marginBottom: 14 }}>
          {subtitleText()}
        </p>

        {/* ═══════════ ARENA ═══════════ */}
        <div
          ref={containerRef}
          /* Phase 1: track pointer for chasing */
          onPointerMove={!isPhase2 ? onChaseMove : onDragMove}
          onPointerDown={isPhase2 ? onDragDown : undefined}
          onPointerUp={isPhase2 ? onDragUp : undefined}
          /* Catch: tap anywhere on arena when catchable */
          onClick={!isPhase2 ? onArenaTap : undefined}
          style={{
            position: 'relative',
            width: '100%',
            /* Taller on mobile for easier play */
            paddingBottom: 'min(72%, 340px)',
            borderRadius: 20,
            background: phase === 'catchable'
              ? 'rgba(217,70,239,0.06)'
              : 'rgba(255,255,255,0.025)',
            border: `1.5px dashed ${
              isPhase2
                ? 'rgba(251,191,36,0.38)'
                : phase === 'catchable'
                ? 'rgba(217,70,239,0.6)'
                : 'rgba(217,70,239,0.28)'
            }`,
            marginBottom: 16,
            touchAction: 'none',
            overflow: 'hidden',
            cursor: phase === 'catchable'
              ? 'pointer'
              : isPhase2
              ? isDragging ? 'grabbing' : 'grab'
              : 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transition: 'background 0.4s, border-color 0.4s',
          }}
        >
          {/* ─── PHASE 1 CONTENT ─── */}
          {!isPhase2 && (
            <>
              {/* Corner decoy name labels */}
              {CHASE_DECOYS.map((name, i) => {
                const corners = [
                  { top: '7%', left: '4%' },
                  { top: '7%', right: '4%' },
                  { bottom: '7%', left: '4%' },
                  { bottom: '7%', right: '4%' },
                ]
                return (
                  <motion.div
                    key={name}
                    style={{
                      position: 'absolute',
                      ...corners[i],
                      padding: '6px 12px',
                      borderRadius: 10,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: '1px solid rgba(244,63,94,0.22)',
                      background: 'rgba(244,63,94,0.07)',
                      color: 'rgba(244,63,94,0.4)',
                      pointerEvents: 'none',
                    }}
                    animate={{ opacity: [0.28, 0.52, 0.28] }}
                    transition={{ duration: 2.2 + i * 0.4, repeat: Infinity, delay: i * 0.55 }}
                  >
                    {name}
                  </motion.div>
                )
              })}

              {/* Sweet floating message */}
              <AnimatePresence>
                {floatMsg && (
                  <motion.div
                    key={`${floatMsg.x}-${floatMsg.text.slice(0, 10)}`}
                    initial={{ opacity: 0, y: 10, scale: 0.82 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -14, scale: 0.9 }}
                    style={{
                      position: 'absolute',
                      left: `${floatMsg.x}%`,
                      top: `${floatMsg.y}%`,
                      transform: 'translate(-50%, -50%)',
                      background: 'rgba(56,14,122,0.94)',
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                      border: '1px solid rgba(217,70,239,0.6)',
                      borderRadius: 14,
                      padding: '10px 14px',
                      fontSize: '0.8rem',
                      color: 'white',
                      fontWeight: 600,
                      maxWidth: 190,
                      textAlign: 'center',
                      lineHeight: 1.48,
                      zIndex: 10,
                      pointerEvents: 'none',
                      boxShadow: '0 4px 22px rgba(124,58,237,0.45)',
                    }}
                  >
                    {floatMsg.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Catchable: big glowing ring + instruction ── */}
              {phase === 'catchable' && (
                <>
                  <div className="catch-ring" />
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: '68%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '0.85rem',
                      color: '#d946ef',
                      fontWeight: 800,
                      pointerEvents: 'none',
                      whiteSpace: 'nowrap',
                      textShadow: '0 0 10px rgba(217,70,239,0.6)',
                    }}
                    animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.04, 1] }}
                    transition={{ duration: 0.85, repeat: Infinity }}
                  >
                    💫 TAP ANYWHERE TO CATCH!
                  </motion.div>
                </>
              )}

              {/* The running heart */}
              {phase !== 'caught' && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    fontSize: phase === 'catchable' ? '5rem' : '3.8rem',
                    userSelect: 'none',
                    zIndex: 6,
                    pointerEvents: 'none',
                    /* Slow spring when catchable, fast snap when chasing */
                    transition: phase === 'catchable'
                      ? 'left 0.8s cubic-bezier(0.34,1.56,0.64,1), top 0.8s cubic-bezier(0.34,1.56,0.64,1), font-size 0.5s'
                      : 'left 0.22s cubic-bezier(0.34,1.56,0.64,1), top 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                    filter: phase === 'catchable'
                      ? 'drop-shadow(0 0 22px #d946ef) drop-shadow(0 0 44px rgba(217,70,239,0.5))'
                      : 'none',
                  }}
                >
                  <motion.span
                    animate={
                      phase === 'catchable'
                        ? { scale: [1, 1.3, 1], rotate: [-6, 6, -6] }
                        : { scale: [1, 1.06, 1] }
                    }
                    transition={{
                      duration: phase === 'catchable' ? 0.7 : 1.6,
                      repeat: Infinity,
                    }}
                    style={{ display: 'block' }}
                  >
                    {phase === 'catchable' ? '💗' : '❤️'}
                  </motion.span>
                </div>
              )}

              {/* Caught flash animation */}
              {phase === 'caught' && (
                <motion.div
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: 1.6, opacity: 1 }}
                  transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '4rem',
                    filter: 'drop-shadow(0 0 28px #f43f5e)',
                    zIndex: 6,
                    pointerEvents: 'none',
                  }}
                >
                  💖
                </motion.div>
              )}
            </>
          )}

          {/* ─── PHASE 2 CONTENT ─── */}
          {isPhase2 && (
            <>
              {/* Locked name zone at top */}
              <div
                style={{
                  position: 'absolute',
                  top: '5%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '10px 26px',
                  borderRadius: 16,
                  border: `2px solid ${unlocked ? 'rgba(251,191,36,0.85)' : 'rgba(255,255,255,0.18)'}`,
                  background: unlocked ? 'rgba(251,191,36,0.14)' : 'rgba(255,255,255,0.04)',
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  fontFamily: "'Pacifico', cursive",
                  color: unlocked ? '#fbbf24' : 'rgba(255,255,255,0.22)',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.65s ease',
                  boxShadow: unlocked ? '0 0 26px rgba(251,191,36,0.38)' : 'none',
                  filter: unlocked ? 'none' : 'blur(5px)',
                  pointerEvents: 'none',
                  zIndex: 5,
                  letterSpacing: unlocked ? '1px' : '4px',
                }}
              >
                {unlocked ? MY_NAME : '??? 🔐'}
              </div>

              {/* Sub-label */}
              <div
                style={{
                  position: 'absolute',
                  top: '20%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.7rem',
                  color: unlocked ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.28)',
                  pointerEvents: 'none',
                  zIndex: 4,
                  whiteSpace: 'nowrap',
                  transition: 'color 0.5s',
                }}
              >
                {unlocked ? '💛 Unlocked!' : '🔒 Swipe up here to unlock'}
              </div>

              {/* Progress bar */}
              <div
                style={{
                  position: 'absolute',
                  top: '26%',
                  left: '18%',
                  width: '64%',
                  height: 6,
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.08)',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #7c3aed, #d946ef, #fbbf24)',
                    transition: 'width 0.1s ease',
                    boxShadow: '0 0 8px rgba(217,70,239,0.55)',
                  }}
                />
              </div>

              {/* Drag decoys */}
              {DRAG_DECOYS.map((d, i) => (
                <motion.div
                  key={d.name}
                  style={{
                    position: 'absolute',
                    left: `${d.x}%`,
                    top: `${d.y}%`,
                    transform: 'translate(-50%, -50%)',
                    padding: '7px 13px',
                    borderRadius: 10,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: activeDecoy === i
                      ? '1px solid rgba(244,63,94,0.8)'
                      : '1px solid rgba(244,63,94,0.2)',
                    background: activeDecoy === i
                      ? 'rgba(244,63,94,0.2)'
                      : 'rgba(244,63,94,0.06)',
                    color: activeDecoy === i ? '#f43f5e' : 'rgba(244,63,94,0.35)',
                    transition: 'all 0.28s',
                    pointerEvents: 'none',
                    zIndex: 3,
                  }}
                  animate={{ opacity: [0.25, 0.46, 0.25] }}
                  transition={{ duration: 2.6 + i * 0.4, repeat: Infinity, delay: i * 0.35 }}
                >
                  {d.name}
                  {activeDecoy === i && ' 💔'}
                </motion.div>
              ))}

              {/* Decoy warning */}
              <AnimatePresence>
                {decoyMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute',
                      bottom: '6%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(56,14,122,0.9)',
                      border: '1px solid rgba(217,70,239,0.55)',
                      borderRadius: 12,
                      padding: '9px 16px',
                      fontSize: '0.8rem',
                      color: 'white',
                      fontWeight: 600,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  >
                    {decoyMsg}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The draggable heart */}
              <div
                style={{
                  position: 'absolute',
                  left: `${dragPos.x}%`,
                  top: `${dragPos.y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: '3.6rem',
                  userSelect: 'none',
                  zIndex: 5,
                  pointerEvents: 'none',
                  transition: isDragging
                    ? 'none'
                    : 'left 0.55s cubic-bezier(0.34,1.56,0.64,1), top 0.55s cubic-bezier(0.34,1.56,0.64,1)',
                  filter: 'drop-shadow(0 0 18px #f43f5e)',
                }}
              >
                <motion.span
                  animate={{ scale: isDragging ? [1.2, 0.95, 1.2] : [1, 1.12, 1] }}
                  transition={{ duration: 0.55, repeat: Infinity }}
                  style={{ display: 'block' }}
                >
                  💖
                </motion.span>
              </div>

              {/* Swipe-up instruction (phone-native feel) */}
              {!isDragging && phase === 'drag' && (
                <div className="swipe-hint">
                  <span className="swipe-hint-arrow">☝️</span>
                  <span>Press &amp; swipe up!</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Escape progress dots (phase 1 only) */}
        {!isPhase2 && (
          <div style={{ display: 'flex', gap: 7, justifyContent: 'center', marginBottom: 8 }}>
            {Array.from({ length: MAX_ESCAPES }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: '50%',
                  background: i < escapes ? '#f43f5e' : 'rgba(255,255,255,0.14)',
                  boxShadow: i < escapes ? '0 0 7px #f43f5e' : 'none',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
        )}

        <p className="hint-text">
          {isPhase2
            ? `Swipe 💖 up toward the name zone · ${Math.round(progress)}% unlocked`
            : phase === 'catchable'
            ? '💗 Just tap anywhere in the box!'
            : 'Move your finger/cursor toward the heart to chase it 💕'}
        </p>
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   REUSABLE QUIZ CARD
   ══════════════════════════════════════════════════════════ */
function QuizCard({ stageEmoji, headline, emojiClue, question, options, correctId, successMsg, wrongMsg, onComplete }) {
  const [chosen, setChosen] = useState(null)

  const pick = (id) => {
    if (chosen) return
    setChosen(id)
    if (id === correctId) {
      confetti({
        particleCount: 110,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#d946ef', '#7c3aed', '#f43f5e', '#fbbf24', '#34d399'],
      })
      setTimeout(onComplete, 1350)
    }
  }

  return (
    <motion.div
      className="stage"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
    >
      <div className="stage-card glass-card">
        <span className="stage-emoji">{stageEmoji}</span>
        <h2 className="stage-title gradient-text">{headline}</h2>
        <div className="emoji-display">{emojiClue}</div>
        <p className="stage-subtitle">{question}</p>

        <div className="photo-clue-options">
          {options.map((opt) => (
            <motion.button
              key={opt.id}
              className={`option-btn${
                chosen === opt.id && opt.id === correctId
                  ? ' correct-choice'
                  : chosen === opt.id
                  ? ' wrong-choice'
                  : ''
              }`}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => pick(opt.id)}
            >
              <span style={{ fontSize: '2rem' }}>{opt.emoji}</span>
              <span>{opt.label}</span>
            </motion.button>
          ))}
        </div>

        {chosen && chosen !== correctId && (
          <motion.p
            style={{ color: '#f43f5e', fontWeight: 700, marginTop: 8 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {wrongMsg || 'Think harder! 😏'}
          </motion.p>
        )}
        {chosen === correctId && (
          <motion.div className="success-badge" initial={{ scale: 0 }} animate={{ scale: 1 }}>
            {successMsg}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════
   STAGE: Blue Shirt Quiz
   ══════════════════════════════════════════════════════════ */
export function BlueShirtStage({ onComplete }) {
  return (
    <QuizCard
      stageEmoji="👕"
      headline="Test Your Memory 👀"
      emojiClue="👕 🎨 💭"
      question="What color was my shirt on our very first date?"
      options={[
        { id: 'a', emoji: '🔴', label: 'Red' },
        { id: 'b', emoji: '🔵', label: 'Blue' },
        { id: 'c', emoji: '⚫', label: 'Black' },
        { id: 'd', emoji: '⚪', label: 'White' },
      ]}
      correctId="b"
      successMsg="💙 That blue shirt... it looked good, right?"
      wrongMsg="Come on, you definitely remember! 😄"
      onComplete={onComplete}
    />
  )
}

/* ══════════════════════════════════════════════════════════
   STAGE: First Kiss Location Quiz
   ══════════════════════════════════════════════════════════ */
export function FirstKissStage({ onComplete }) {
  return (
    <QuizCard
      stageEmoji="💋"
      headline="Never Forget This One 💋"
      emojiClue="💋 📍 🌙"
      question="Where did we share our very first kiss?"
      options={[
        { id: 'a', emoji: '🍽️', label: 'At a restaurant' },
        { id: 'b', emoji: '🏠', label: 'At home' },
        { id: 'c', emoji: '🛣️', label: 'On the road' },
        { id: 'd', emoji: '🏫', label: 'At school' },
      ]}
      correctId="c"
      successMsg="🛣️ On the road... best spontaneous moment ever 💋"
      wrongMsg="Think back to that night... 🌙"
      onComplete={onComplete}
    />
  )
}
