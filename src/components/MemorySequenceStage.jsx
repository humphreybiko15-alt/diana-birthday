import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

const ICON_TYPES = ['🌹', '❤️', '💎', '🌙', '🕯️', '🌟', '🥀', '✨']

/**
 * MemorySequenceStage — Pop/tap glowing romantic icons in exact shown order
 * across 2 escalating rounds with a live countdown timer.
 */
export default function MemorySequenceStage({ profile, onRoundComplete }) {
  const [round, setRound] = useState(1)
  const [sequence, setSequence] = useState([])
  const [currentStep, setCurrentStep] = useState(0)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(12)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [resultMessage, setResultMessage] = useState('')
  const timerRef = useRef(null)

  const startRound = useCallback((targetRound) => {
    clearInterval(timerRef.current)
    const count = targetRound === 1 ? 3 : 5
    const nextSeq = Array.from({ length: count }, () => ICON_TYPES[Math.floor(Math.random() * ICON_TYPES.length)])
    setSequence(nextSeq)
    setCurrentStep(0)
    setTimer(12)
    setIsPlaying(true)
    setResultMessage('')

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          setIsPlaying(false)
          setGameOver(true)
          setResultMessage(`⏰ Time up! Sequence was: ${nextSeq.join(' ')}`)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    startRound(1)
    return () => clearInterval(timerRef.current)
  }, [startRound])

  const handleIconTap = (icon) => {
    if (!isPlaying || gameOver) return
    const expected = sequence[currentStep]
    if (icon === expected) {
      const nextScore = score + 10
      setScore(nextScore)
      if (currentStep + 1 >= sequence.length) {
        clearInterval(timerRef.current)
        setIsPlaying(false)
        setResultMessage('✅ Great memory! +10 Fate points')
        if (round === 1) {
          setTimeout(() => {
            setRound(2)
            startRound(2)
          }, 1000)
        } else {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#d946ef', '#fbbf24', '#7c3aed', '#f43f5e'],
          })
          setTimeout(() => onRoundComplete(true, nextScore), 900)
        }
      } else {
        setCurrentStep(prev => prev + 1)
      }
    } else {
      clearInterval(timerRef.current)
      setIsPlaying(false)
      setGameOver(true)
      setResultMessage(`❌ Expected ${expected}, tapped ${icon}. Score: ${score} Fate points`)
    }
  }

  const restartGame = () => {
    setRound(1)
    setScore(0)
    setGameOver(false)
    startRound(1)
  }

  if (gameOver) {
    return (
      <motion.div
        className="stage memory-stage"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="glass-card" style={{ maxWidth: 500, padding: 36, textAlign: 'center' }}>
          <h2 className="gradient-text" style={{ marginBottom: 16 }}>
            Memory Sequence
          </h2>
          <p style={{ marginBottom: 20, color: 'rgba(255,255,255,0.8)' }}>
            {resultMessage}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={restartGame}
              style={{
                padding: '14px 24px',
                border: 'none',
                borderRadius: 12,
                fontFamily: 'Outfit',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'var(--gradient-hero)',
                color: 'white',
              }}
            >
              Play Again
            </button>
            <button
              onClick={() => onRoundComplete(false, score)}
              style={{
                padding: '14px 24px',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 12,
                fontFamily: 'Outfit',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.08)',
                color: 'white',
              }}
            >
              Continue →
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  const minutes = Math.floor(timer / 60)
  const seconds = timer % 60

  return (
    <motion.div
      className="stage memory-stage"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="glass-card" style={{ maxWidth: 560, padding: 32, position: 'relative', textAlign: 'center' }}>
        <h2 className="gradient-text" style={{ marginBottom: 10 }}>
          Memory Reflex — Round {round} of 2
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.65)', marginBottom: 14, fontSize: '0.9rem' }}>
          {profile.partner2Name || 'Player'}, tap the icons in order for {profile.partner1Name || 'your partner'}!
        </p>

        <div style={{
          display: 'inline-block',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 20,
          padding: '6px 14px',
          color: 'white',
          fontFamily: 'Outfit',
          fontSize: '0.9rem',
          marginBottom: 16,
        }}>
          ⏱️ {minutes}:{seconds < 10 ? '0' : ''}{seconds} • ✨ Fate Points: {score}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          {sequence.map((ic, idx) => (
            <span
              key={idx}
              style={{
                padding: '8px 12px',
                borderRadius: 12,
                fontSize: '1.5rem',
                border: idx === currentStep ? '2px solid #d946ef' : '1px solid rgba(255,255,255,0.18)',
                background: idx < currentStep ? 'rgba(52,211,153,0.22)' : 'rgba(255,255,255,0.06)',
                opacity: idx < currentStep ? 0.5 : 1,
              }}
            >
              {ic}
            </span>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, maxWidth: 320, margin: '0 auto 16px' }}>
          {ICON_TYPES.map((icon) => (
            <motion.button
              key={icon}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleIconTap(icon)}
              style={{
                height: 58,
                borderRadius: 14,
                border: '1px solid rgba(217,70,239,0.45)',
                background: 'rgba(217,70,239,0.22)',
                color: 'white',
                fontSize: '1.8rem',
                cursor: 'pointer',
              }}
            >
              {icon}
            </motion.button>
          ))}
        </div>

        {resultMessage && (
          <p style={{ color: '#34d399', fontWeight: 600, marginTop: 10 }}>{resultMessage}</p>
        )}
      </div>
    </motion.div>
  )
}
