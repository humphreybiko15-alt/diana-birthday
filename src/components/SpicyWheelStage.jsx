import { useState } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

/**
 * SpicyWheelStage — Interactive Animated Roulette Wheel built with Framer Motion
 * Player spins the wheel to land on 6 playful couple dares, truths, or
 * "Would [Partner] Rather?" cards tailored with their names.
 */
export default function SpicyWheelStage({ profile, onSpinComplete }) {
  const [spinning, setSpinning] = useState(false)
  const [rotationDeg, setRotationDeg] = useState(0)
  const [spinCount, setSpinCount] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [currentPrompt, setCurrentPrompt] = useState(null)
  const [results, setResults] = useState([])

  const partner1 = profile.partner1Name || 'Partner 1'
  const partner2 = profile.partner2Name || 'Partner 2'
  const dreamSpot = profile.dreamSpot || 'midnight lounge'
  const guilty = profile.guiltyPleasure || 'chocolate'

  const options = [
    { label: `💋 Would ${partner1} Rather? — Kiss in public or hold hands?`, points: 10, type: 'dare' },
    { label: `🔥 Would ${partner2} Rather? — Slow dance or cheeky dare?`, points: 15, type: 'dare' },
    { label: `🕯️ Whisper a secret dream to ${partner1} at ${dreamSpot}`, points: 20, type: 'truth' },
    { label: `💃 15-second slow dance with ${partner2}`, points: 10, type: 'dare' },
    { label: `📸 Snap a favorite couple selfie at ${dreamSpot}`, points: 15, type: 'dare' },
    { label: `🍫 Share a guilty pleasure treat — ${guilty}`, points: 10, type: 'truth' },
  ]

  const spinWheel = () => {
    if (spinning || currentPrompt) return
    setSpinning(true)
    const idx = Math.floor(Math.random() * options.length)
    setRotationDeg(prev => prev + 720 + idx * 60)

    setTimeout(() => {
      setSpinning(false)
      setCurrentPrompt(options[idx])
    }, 1200)
  }

  const resolvePrompt = (completed) => {
    if (!currentPrompt) return
    const pts = completed ? currentPrompt.points : 0
    const nextTotal = totalPoints + pts
    const nextCount = spinCount + 1
    setTotalPoints(nextTotal)
    setSpinCount(nextCount)
    setResults(prev => [...prev, { label: currentPrompt.label, points: pts, completed }])
    setCurrentPrompt(null)

    if (nextCount >= 2) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d946ef', '#fbbf24', '#7c3aed', '#f43f5e'],
      })
    }
  }

  const sectorPath = (i) => {
    const startAngle = (i / 6) * Math.PI * 2 - Math.PI / 2
    const endAngle = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2
    const x1 = 160 + 140 * Math.cos(startAngle)
    const y1 = 160 + 140 * Math.sin(startAngle)
    const x2 = 160 + 140 * Math.cos(endAngle)
    const y2 = 160 + 140 * Math.sin(endAngle)
    return `M 160 160 L ${x1.toFixed(1)} ${y1.toFixed(1)} A 140 140 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`
  }

  if (spinCount >= 2) {
    return (
      <motion.div
        className="stage spicy-wheel-stage"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="glass-card" style={{ maxWidth: 560, padding: 32, textAlign: 'center' }}>
          <h2 className="gradient-text" style={{ marginBottom: 16 }}>
            Wild Midnight Roulette
          </h2>
          <p style={{ marginBottom: 16, color: 'rgba(255,255,255,0.75)' }}>
            You completed 2 spins! Flame points earned: <strong style={{ color: '#fbbf24' }}>{totalPoints}</strong>
          </p>
          <ul style={{ textAlign: 'left', margin: '0 auto 24px', maxWidth: 380, color: 'white', paddingLeft: 18 }}>
            {results.map((r, i) => (
              <li key={i} style={{ margin: '8px 0', fontSize: '0.9rem' }}>
                {r.label} — {r.completed ? `+${r.points} pts 🔥` : 'Chickened out 😅'}
              </li>
            ))}
          </ul>
          <button
            onClick={() => onSpinComplete(totalPoints)}
            style={{
              padding: '14px 32px',
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
            Finish Adventure →
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="stage spicy-wheel-stage"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="glass-card" style={{ maxWidth: 560, padding: 32, textAlign: 'center' }}>
        <h2 className="gradient-text" style={{ marginBottom: 10 }}>
          🎰 Spicy Roulette Wheel ({spinCount}/2 Spins)
        </h2>
        <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
          Spin the wheel to land on a daring couple challenge!
        </p>

        <div className="wheel-container" style={{ width: 260, height: 260, margin: '0 auto 20px', position: 'relative' }}>
          <motion.svg
            viewBox="0 0 320 320"
            width="100%"
            height="100%"
            animate={{ rotate: rotationDeg }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            {options.map((_, i) => (
              <path
                key={i}
                d={sectorPath(i)}
                fill={i % 2 === 0 ? 'rgba(217,70,239,0.38)' : 'rgba(251,191,36,0.34)'}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2"
              />
            ))}
            <circle cx={160} cy={160} r={34} fill="#140c2b" stroke="#fbbf24" strokeWidth="3" />
            <text x={160} y={168} textAnchor="middle" fontSize="24">🔥</text>
          </motion.svg>
        </div>

        {currentPrompt ? (
          <div style={{ padding: 18, borderRadius: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(251,191,36,0.45)' }}>
            <p style={{ color: 'white', fontWeight: 600, marginBottom: 16 }}>{currentPrompt.label}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => resolvePrompt(true)}
                style={{
                  padding: '12px 22px',
                  border: 'none',
                  borderRadius: 16,
                  fontFamily: 'Outfit',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: 'rgba(52,211,153,0.45)',
                  color: 'white',
                }}
              >
                Completed! 🔥 (+{currentPrompt.points})
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => resolvePrompt(false)}
                style={{
                  padding: '12px 22px',
                  border: 'none',
                  borderRadius: 16,
                  fontFamily: 'Outfit',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: 'rgba(244,63,94,0.4)',
                  color: 'white',
                }}
              >
                Chicken Out 😅
              </motion.button>
            </div>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={spinWheel}
            disabled={spinning}
            style={{
              width: '100%',
              padding: 16,
              border: 'none',
              borderRadius: 20,
              fontFamily: 'Outfit',
              fontSize: '1.1rem',
              fontWeight: 700,
              cursor: spinning ? 'wait' : 'pointer',
              background: 'var(--gradient-hero)',
              color: 'white',
            }}
          >
            {spinning ? 'Spinning...' : 'Spin the Wheel 🎰'}
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
