import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { computeCoupleArchetype } from '../gameEngine'

/**
 * FinaleReveal — Personalized Couple Archetype badge, Fate vs. Flame meter
 * breakdown, Sync % score, 3D flippable glassmorphic Secret Reward Card
 * revealing profile.secretNote with canvas-confetti burst.
 */
export default function FinaleReveal({ profile, fatePoints, flamePoints, syncScore, totalQuestions, onSwitchRoles, onMakeAnother }) {
  const [flipped, setFlipped] = useState(false)

  const archetype = computeCoupleArchetype({
    fateScore: fatePoints,
    flameScore: flamePoints,
    syncScore,
    totalQuestions,
  })

  useEffect(() => {
    if (flipped) {
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.7 },
        colors: ['#d946ef', '#fbbf24', '#7c3aed', '#f43f5e', '#34d399'],
      })
    }
  }, [flipped])

  const totalScore = Math.max(1, fatePoints + flamePoints)
  const fatePct = Math.round((fatePoints / totalScore) * 100)

  return (
    <motion.div
      className="stage finale-stage"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="glass-card" style={{ maxWidth: 600, padding: 36, textAlign: 'center' }}>
        <h2 className="gradient-text" style={{ marginBottom: 18 }}>
          🎉 Finale Reveal
        </h2>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 6 }}>{archetype.emoji}</div>
          <h3 style={{ color: 'white', fontFamily: 'Outfit', fontSize: '1.4rem', margin: 0 }}>{archetype.title}</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8, fontSize: '0.95rem' }}>{archetype.summary}</p>
          <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 10, color: 'white', fontSize: '0.92rem' }}>
            <span style={{ color: '#d946ef', marginRight: 14 }}>✨ Fate: {fatePoints}</span>
            <span style={{ color: '#fbbf24', marginRight: 14 }}>🔥 Flame: {flamePoints}</span>
            <span style={{ color: '#a78bfa' }}>💜 Sync: {archetype.syncPercent}%</span>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 16, marginBottom: 22 }}>
          <h4 style={{ color: 'white', margin: '0 0 10px' }}>Fate vs. Flame Meter</h4>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.16)', borderRadius: 10, height: 18, overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ height: '100%', width: `${fatePct}%`, background: '#d946ef', transition: 'width 0.5s ease' }} />
            <div style={{ height: '100%', width: `${100 - fatePct}%`, background: '#fbbf24', transition: 'width 0.5s ease' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
            <span>✨ Fate: {fatePoints}</span>
            <span>💜 Synced Answers: {syncScore}</span>
            <span>🔥 Flame: {flamePoints}</span>
          </div>
        </div>

        <div style={{ perspective: 900, marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
          <motion.div
            onClick={() => setFlipped(prev => !prev)}
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.7 }}
            style={{
              width: 310,
              minHeight: 170,
              borderRadius: 20,
              border: '1px solid rgba(217,70,239,0.45)',
              background: flipped ? 'var(--gradient-hero)' : 'rgba(255,255,255,0.08)',
              padding: 24,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {!flipped ? (
              <>
                <span style={{ fontSize: '2.4rem', marginBottom: 10 }}>🎁</span>
                <h3 style={{ color: 'white', margin: '0 0 6px' }}>Your Secret Reward</h3>
                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', margin: 0 }}>
                  Tap to flip &amp; reveal {profile.partner1Name || 'your partner'}&apos;s secret note
                </p>
              </>
            ) : (
              <div style={{ transform: 'rotateY(180deg)' }}>
                <span style={{ fontSize: '2.2rem', marginBottom: 8, display: 'block' }}>💌</span>
                <h3 style={{ color: 'white', margin: '0 0 8px' }}>Secret Note</h3>
                <p style={{ color: 'white', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                  {profile.secretNote || 'A special surprise awaits tonight 💜'}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onSwitchRoles}
            style={{
              padding: '13px 22px',
              border: 'none',
              borderRadius: 12,
              fontFamily: 'Outfit',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.14)',
              color: 'white',
            }}
          >
            Switch Roles &amp; Replay 🔄
          </button>

          <button
            onClick={onMakeAnother}
            style={{
              padding: '13px 22px',
              border: 'none',
              borderRadius: 12,
              fontFamily: 'Outfit',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'rgba(217,70,239,0.32)',
              color: '#f5d0fe',
            }}
          >
            Make One for Another Couple ✨
          </button>
        </div>
      </div>
    </motion.div>
  )
}
