import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { scrambleName } from './gameEngine'
import { RunawayHeartStage } from './LoveStages'
import SetupScreen from './components/SetupScreen'
import CrossroadsStage from './components/CrossroadsStage'
import QuizBattleStage from './components/QuizBattleStage'
import SpicyWheelStage from './components/SpicyWheelStage'
import MemorySequenceStage from './components/MemorySequenceStage'
import FinaleReveal from './components/FinaleReveal'

const STAGES = ['scramble', 'runaway_heart', 'crossroads', 'quiz', 'challenge', 'finale']

function DynamicScrambleStage({ profile, onComplete }) {
  const targetWord = useMemo(() => {
    const clean = (profile?.partner1Name || 'LOVE').trim().replace(/[^a-zA-Z]/g, '').toUpperCase()
    return clean.length >= 2 ? clean : 'LOVE'
  }, [profile])

  const scrambledLetters = useMemo(() => scrambleName(targetWord).toUpperCase().split(''), [targetWord])
  const [placedIndices, setPlacedIndices] = useState([])

  const placedWord = placedIndices.map(i => scrambledLetters[i]).join('')
  const solved = placedWord === targetWord

  useEffect(() => {
    if (solved) {
      const t = setTimeout(() => onComplete(15), 750)
      return () => clearTimeout(t)
    }
  }, [solved, onComplete])

  const pickTile = idx => {
    if (solved || placedIndices.includes(idx)) return
    setPlacedIndices(prev => [...prev, idx])
  }

  const removeLast = posIdx => {
    if (solved) return
    setPlacedIndices(prev => prev.filter((_, i) => i !== posIdx))
  }

  return (
    <motion.div
      className="stage"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="glass-card" style={{ maxWidth: 500, padding: 34, textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🔐</div>
        <h2 className="gradient-text" style={{ marginBottom: 10 }}>
          Unscramble the Heart Key
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 22, fontSize: '0.95rem' }}>
          {profile.partner2Name || 'Player'}, tap the letters in order to unlock {profile.partner1Name || 'your partner'}&apos;s name!
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          {targetWord.split('').map((_, idx) => {
            const tileIdx = placedIndices[idx]
            const letter = tileIdx !== undefined ? scrambledLetters[tileIdx] : ''
            return (
              <button
                key={idx}
                type="button"
                onClick={() => tileIdx !== undefined && removeLast(idx)}
                style={{
                  width: 44,
                  height: 48,
                  borderRadius: 12,
                  border: solved ? '2px solid #34d399' : '2px solid rgba(217,70,239,0.5)',
                  background: letter ? 'rgba(217,70,239,0.22)' : 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  cursor: letter && !solved ? 'pointer' : 'default',
                }}
              >
                {letter}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {scrambledLetters.map((ch, idx) => {
            const used = placedIndices.includes(idx)
            return (
              <motion.button
                key={idx}
                whileHover={{ scale: used ? 1 : 1.08 }}
                whileTap={{ scale: 0.92 }}
                disabled={used}
                onClick={() => pickTile(idx)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  border: 'none',
                  background: used ? 'rgba(255,255,255,0.05)' : 'var(--gradient-hero)',
                  color: used ? 'rgba(255,255,255,0.2)' : 'white',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  cursor: used ? 'default' : 'pointer',
                }}
              >
                {ch}
              </motion.button>
            )
          })}
        </div>

        {placedIndices.length > 0 && !solved && (
          <button
            type="button"
            onClick={() => setPlacedIndices([])}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f472b6',
              cursor: 'pointer',
              fontSize: '0.88rem',
              textDecoration: 'underline',
            }}
          >
            Clear letters
          </button>
        )}

        {solved && (
          <p style={{ color: '#34d399', fontWeight: 700, marginTop: 10 }}>
            ✨ Unlocked {targetWord}! +15 Fate points
          </p>
        )}
      </div>
    </motion.div>
  )
}

/**
 * App — Main 6-Stage Adventure with Live HUD & Fate-vs-Flame Branching
 */
export default function App() {
  const [profile, setProfile] = useState({})
  const [fromHash, setFromHash] = useState(null)
  const [stage, setStage] = useState('setup')
  const [path, setPath] = useState(null)
  const [fatePoints, setFatePoints] = useState(0)
  const [flamePoints, setFlamePoints] = useState(0)
  const [syncScore, setSyncScore] = useState(0)

  useEffect(() => {
    const hash = window.location.hash
    if (hash && hash.startsWith('#play=')) {
      setFromHash(hash)
    }
  }, [])

  const startAdventure = nextProfile => {
    setProfile(nextProfile)
    setStage('scramble')
    setPath(null)
    setFatePoints(0)
    setFlamePoints(0)
    setSyncScore(0)
  }

  const onChoosePath = (newPath, awardedPoints = 15) => {
    setPath(newPath)
    if (newPath === 'fate') {
      setFatePoints(prev => prev + awardedPoints)
    } else if (newPath === 'flame') {
      setFlamePoints(prev => prev + awardedPoints)
    }
    setStage('quiz')
  }

  const onQuizComplete = (completedCount, earnedPts = 0) => {
    setSyncScore(completedCount)
    if (path === 'flame') {
      setFlamePoints(prev => prev + earnedPts)
    } else {
      setFatePoints(prev => prev + earnedPts)
    }
    setStage('challenge')
  }

  const onMemoryComplete = (success, roundScore = 0) => {
    setFatePoints(prev => prev + (success ? Math.max(25, roundScore) : roundScore))
    setStage('finale')
  }

  const onWheelComplete = totalPoints => {
    setFlamePoints(prev => prev + totalPoints)
    setStage('finale')
  }

  const switchRoles = () => {
    setProfile(prev => ({
      ...prev,
      partner1Name: prev.partner2Name || 'Partner 1',
      partner2Name: prev.partner1Name || 'Partner 2',
    }))
    setStage('scramble')
    setPath(null)
    setFatePoints(0)
    setFlamePoints(0)
    setSyncScore(0)
  }

  const makeAnother = () => {
    setProfile({})
    setFromHash(null)
    window.location.hash = ''
    setStage('setup')
  }

  if (stage === 'setup') {
    return <SetupScreen onProfileSet={startAdventure} fromHash={fromHash} />
  }

  const activeStageIdx = Math.max(0, STAGES.indexOf(stage))

  return (
    <div style={{ minHeight: '100vh', paddingTop: 64 }}>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          background: 'rgba(10,10,18,0.88)',
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(217,70,239,0.28)',
        }}
      >
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {STAGES.map((st, idx) => (
            <span
              key={st}
              title={st}
              style={{
                width: idx === activeStageIdx ? 18 : 8,
                height: 8,
                borderRadius: 99,
                background: idx <= activeStageIdx ? '#d946ef' : 'rgba(255,255,255,0.2)',
                transition: 'all 0.25s',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: '0.9rem', fontWeight: 700, color: 'white' }}>
          <span style={{ color: '#e879f9' }}>✨ {fatePoints}</span>
          <span style={{ color: '#fbbf24' }}>🔥 {flamePoints}</span>
          <span style={{ color: '#a78bfa' }}>💜 {syncScore}</span>
        </div>
      </header>

      {stage === 'scramble' && (
        <DynamicScrambleStage
          profile={profile}
          onComplete={pts => {
            setFatePoints(prev => prev + pts)
            setStage('runaway_heart')
          }}
        />
      )}

      {stage === 'runaway_heart' && (
        <RunawayHeartStage
          profile={profile}
          onComplete={() => {
            setFatePoints(prev => prev + 15)
            setStage('crossroads')
          }}
        />
      )}

      {stage === 'crossroads' && (
        <CrossroadsStage profile={profile} onChoose={onChoosePath} />
      )}

      {stage === 'quiz' && (
        <QuizBattleStage profile={profile} path={path} onQuizComplete={onQuizComplete} />
      )}

      {stage === 'challenge' && path === 'flame' && (
        <SpicyWheelStage profile={profile} onSpinComplete={onWheelComplete} />
      )}

      {stage === 'challenge' && path !== 'flame' && (
        <MemorySequenceStage profile={profile} onRoundComplete={onMemoryComplete} />
      )}

      {stage === 'finale' && (
        <FinaleReveal
          profile={profile}
          fatePoints={fatePoints}
          flamePoints={flamePoints}
          syncScore={syncScore}
          totalQuestions={7}
          onSwitchRoles={switchRoles}
          onMakeAnother={makeAnother}
        />
      )}
    </div>
  )
}
