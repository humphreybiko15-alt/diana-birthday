import { useState } from 'react'
import { motion } from 'framer-motion'

/**
 * CrossroadsStage — Interactive branching story crossroads
 * Where the couple chooses their destiny: Fate or Flame
 */
export default function CrossroadsStage({ profile, onChoose }) {
  const [selected, setSelected] = useState(null)
  const [result, setResult] = useState(null)

  const handleChoose = choice => {
    setSelected(choice)
    if (choice === 'fate') {
      setResult({
        type: 'fate',
        points: 15,
        message: `✨ You followed Fate back to "${profile.firstMet || 'where you first met'}" — Fate points awarded!`,
        newPath: 'fate',
      })
    } else if (choice === 'flame') {
      setResult({
        type: 'flame',
        points: 20,
        message: `🔥 You chased the Flame into "${profile.dreamSpot || 'midnight VIP lounge'}" — Flame points awarded!`,
        newPath: 'flame',
      })
    }
  }

  const continueAdventure = () => {
    if (onChoose && result) {
      onChoose(result.newPath, result.points)
    }
  }

  return (
    <motion.div
      className="stage crossroads-stage"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="glass-card" style={{ maxWidth: 540, padding: 36, textAlign: 'center' }}>
        <h2 className="gradient-text" style={{ marginBottom: 16 }}>
          Choose Your Destiny
        </h2>

        <p className="stage-subtitle" style={{ marginBottom: 24, color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem' }}>
          At this crossroads of your story, which path calls to you?
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            style={{
              flex: '1 1 190px',
              padding: '22px 20px',
              borderRadius: 24,
              cursor: selected ? 'default' : 'pointer',
              border: '2px solid rgba(217,70,239,0.5)',
              background: selected === 'fate' ? 'rgba(217,70,239,0.22)' : 'rgba(217,70,239,0.06)',
              transition: 'all 0.2s',
            }}
            onClick={() => !selected && handleChoose('fate')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>✨</div>
            <div style={{ fontWeight: 700, color: 'white' }}>Follow Fate</div>
            <p style={{ marginTop: 6, color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>
              Back to {profile.firstMet || 'where you met'}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            style={{
              flex: '1 1 190px',
              padding: '22px 20px',
              borderRadius: 24,
              cursor: selected ? 'default' : 'pointer',
              border: '2px solid rgba(251,191,36,0.5)',
              background: selected === 'flame' ? 'rgba(251,191,36,0.22)' : 'rgba(251,191,36,0.06)',
              transition: 'all 0.2s',
            }}
            onClick={() => !selected && handleChoose('flame')}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔥</div>
            <div style={{ fontWeight: 700, color: 'white' }}>Chase the Flame</div>
            <p style={{ marginTop: 6, color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem' }}>
              Into {profile.dreamSpot || 'your dream spot'}
            </p>
          </motion.div>
        </div>

        {result && (
          <div style={{ marginTop: 28, padding: 20, borderRadius: 16, border: `2px solid ${result.type === 'fate' ? '#d946ef' : '#fbbf24'}` }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>
              {result.type === 'fate' ? '✨' : '🔥'}
            </div>
            <p style={{ marginBottom: 14, color: 'white' }}>{result.message}</p>
            <button
              onClick={continueAdventure}
              style={{
                width: '100%',
                padding: 14,
                border: 'none',
                borderRadius: 12,
                fontFamily: 'Outfit',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'var(--gradient-hero)',
                color: 'white',
                transition: 'all 0.2s',
              }}
            >
              Continue Adventure →
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}
