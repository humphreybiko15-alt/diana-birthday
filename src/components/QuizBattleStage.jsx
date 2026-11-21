import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { buildMindReaderQuestions } from '../gameEngine'

/**
 * QuizBattleStage — "How Well Do You Know Me?" partner mind-reader quiz
 * Uses risk levels (Safe +10, Bold +25, All-In +50) that scale points
 * and trigger cheeky reactions on right/wrong answers.
 */
export default function QuizBattleStage({ profile, path, onQuizComplete }) {
  const questions = useMemo(() => buildMindReaderQuestions(profile, path), [profile, path])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [riskLevel, setRiskLevel] = useState(null)
  const [answerGiven, setAnswerGiven] = useState(false)
  const [reaction, setReaction] = useState(null)
  const [completedCount, setCompletedCount] = useState(0)
  const [earnedPoints, setEarnedPoints] = useState(0)

  const riskOptions = [
    { label: 'Safe +10', multiplier: 10 },
    { label: 'Bold +25', multiplier: 25 },
    { label: 'All-In +50', multiplier: 50 },
  ]

  const rawQ = questions[currentIndex]
  if (!rawQ) return null

  const normalizedOptions = Array.isArray(rawQ.options) && rawQ.options.length > 0
    ? rawQ.options
    : ['True', 'False']
  const correctIdx = typeof rawQ.correctIndex === 'number'
    ? rawQ.correctIndex
    : (rawQ.correct ? 0 : 1)

  const pickAnswer = selectedIdx => {
    if (answerGiven) return
    const isCorrect = selectedIdx === correctIdx
    setAnswerGiven(true)

    const points = riskLevel ? riskLevel.multiplier : 10
    if (isCorrect) {
      setEarnedPoints(prev => prev + points)
      setCompletedCount(prev => prev + 1)
      setReaction({
        message: `💯 ${rawQ.hint || 'Spot on!'} +${points} points`,
        color: '#34d399',
      })
    } else {
      setReaction({
        message: `😏 Close! Answer was "${normalizedOptions[correctIdx]}".`,
        color: '#f43f5e',
      })
    }
  }

  const handleNext = () => {
    const nextIdx = currentIndex + 1
    if (nextIdx >= questions.length) {
      onQuizComplete(completedCount, earnedPoints)
      return
    }
    setCurrentIndex(nextIdx)
    setRiskLevel(null)
    setAnswerGiven(false)
    setReaction(null)
  }

  return (
    <motion.div
      className="stage quiz-stage"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="glass-card" style={{ maxWidth: 560, padding: 32 }}>
        <h2 className="gradient-text" style={{ marginBottom: 16 }}>
          How Well Do You Know Me?
        </h2>

        <div style={{ marginBottom: 14, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
          Question {currentIndex + 1} of {questions.length} • Sync: {completedCount}
        </div>

        <p className="stage-subtitle" style={{ margin: '12px 0 20px', fontSize: '1.1rem', color: 'white' }}>
          {rawQ.question}
        </p>

        {!answerGiven && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 8, color: 'rgba(255,255,255,0.75)', fontSize: '0.88rem', fontWeight: 600 }}>
              Choose your risk level:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              {riskOptions.map(opt => (
                <motion.button
                  key={opt.label}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 20,
                    border: 'none',
                    fontFamily: 'Outfit',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    background: riskLevel?.label === opt.label ? 'var(--gradient-hero)' : 'rgba(217,70,239,0.28)',
                    color: riskLevel?.label === opt.label ? 'white' : 'rgba(255,255,255,0.8)',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setRiskLevel(opt)}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {answerGiven && reaction ? (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <p style={{ color: reaction.color, marginBottom: 16, fontWeight: 600 }}>
              {reaction.message}
            </p>
            <button
              onClick={handleNext}
              style={{
                padding: '12px 28px',
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
              {currentIndex + 1 >= questions.length ? 'Continue →' : 'Next Question →'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {normalizedOptions.map((opt, i) => (
              <motion.button
                key={`${currentIndex}-${i}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: '14px 20px',
                  borderRadius: 16,
                  border: '1px solid rgba(217,70,239,0.35)',
                  fontFamily: 'Outfit',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: 'rgba(217,70,239,0.16)',
                  color: 'white',
                  transition: 'all 0.2s',
                }}
                onClick={() => pickAnswer(i)}
              >
                {typeof opt === 'string' ? opt : opt.label}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
