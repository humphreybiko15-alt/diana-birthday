import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { encodeProfileToHash, decodeProfileFromHash } from '../gameEngine'

/**
 * Universal Couple Setup Screen
 * - Allows any couple to enter their profile data
 * - Encodes the profile into the URL hash for shareable links
 * - Gracefully handles malformed hashes
 * - Optional "Try Demo Couple" quick-fill
 */
export default function SetupScreen({ onProfileSet, fromHash }) {
  const [form, setForm] = useState({
    partner1Name: '',
    partner2Name: '',
    firstMet: '',
    favoriteThing: '',
    guiltyPleasure: '',
    dreamSpot: '',
    secretNote: '',
  })
  const [linkStatus, setLinkStatus] = useState('')
  const [linkError, setLinkError] = useState('')

  useEffect(() => {
    if (fromHash) {
      const decoded = decodeProfileFromHash(fromHash)
      if (decoded.ok) {
        onProfileSet(decoded.profile)
      } else {
        setLinkError('Invalid or corrupted challenge link. Enter your story manually below.')
      }
    }
  }, [fromHash, onProfileSet])

  const handleTryDemo = () => {
    setForm({
      partner1Name: 'Alex',
      partner2Name: 'Jordan',
      firstMet: 'Westlands coffee shop',
      favoriteThing: 'Late-night drives',
      guiltyPleasure: 'Midnight chocolate cake',
      dreamSpot: 'Rooftop party',
      secretNote: 'Dinner & massage on me tonight',
    })
    setLinkError('')
    setLinkStatus('')
  }

  const copyLink = async () => {
    const hash = encodeProfileToHash(form)
    const fullUrl = `${window.location.origin}${window.location.pathname}#play=${hash}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      setLinkStatus('Secret link copied! Send it to your partner 💌')
      setLinkError('')
    } catch {
      setLinkStatus(`Share link ready: #play=${hash.slice(0, 28)}...`)
    }
    setTimeout(() => setLinkStatus(''), 4000)
  }

  const inputStyle = {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    border: '2px solid rgba(217,70,239,0.35)',
    background: 'rgba(255,255,255,0.07)',
    color: 'white',
    fontFamily: 'Outfit',
    fontSize: '1rem',
    marginBottom: 14,
    boxSizing: 'border-box',
  }

  const readyToStart = Boolean(form.partner1Name.trim() && form.partner2Name.trim())

  return (
    <motion.div
      className="stage setup-screen"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="glass-card" style={{ maxWidth: 460, padding: 32 }}>
        <h2 className="gradient-text" style={{ textAlign: 'center', marginBottom: 8 }}>
          Fate or Flame — Our Story Adventure
        </h2>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.65)', marginBottom: 20, fontSize: '0.92rem' }}>
          Personalize a 6-stage couples adventure or copy a secret link.
        </p>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'white' }}>
            Partner 1 Name (Creator / Subject)
          </label>
          <input
            value={form.partner1Name}
            onChange={e => setForm(f => ({ ...f, partner1Name: e.target.value }))}
            placeholder="e.g. Alex"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'white' }}>
            Partner 2 Name (Player / Guesser)
          </label>
          <input
            value={form.partner2Name}
            onChange={e => setForm(f => ({ ...f, partner2Name: e.target.value }))}
            placeholder="e.g. Jordan"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'white' }}>
            Where you first met
          </label>
          <input
            value={form.firstMet}
            onChange={e => setForm(f => ({ ...f, firstMet: e.target.value }))}
            placeholder="e.g. Westlands coffee shop"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'white' }}>
            Partner 1&apos;s favorite thing / weakness
          </label>
          <input
            value={form.favoriteThing}
            onChange={e => setForm(f => ({ ...f, favoriteThing: e.target.value }))}
            placeholder="e.g. Blue shirt, Late-night drives, Street tacos"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'white' }}>
            Biggest guilty pleasure / favorite treat
          </label>
          <input
            value={form.guiltyPleasure}
            onChange={e => setForm(f => ({ ...f, guiltyPleasure: e.target.value }))}
            placeholder="e.g. Chocolate cake, Pizza at 3am"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'white' }}>
            Dream getaway / party vibe
          </label>
          <input
            value={form.dreamSpot}
            onChange={e => setForm(f => ({ ...f, dreamSpot: e.target.value }))}
            placeholder="e.g. Rooftop party, Beach bonfire"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, color: 'white' }}>
            Secret finale love note / real-life reward
          </label>
          <textarea
            value={form.secretNote}
            onChange={e => setForm(f => ({ ...f, secretNote: e.target.value }))}
            placeholder="e.g. Dinner & massage on me tonight"
            style={{ ...inputStyle, minHeight: 76, marginBottom: 18 }}
          />
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <button
            onClick={() => onProfileSet(form)}
            disabled={!readyToStart}
            style={{
              padding: 15,
              border: 'none',
              borderRadius: 12,
              fontFamily: 'Outfit',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: readyToStart ? 'pointer' : 'not-allowed',
              background: readyToStart ? 'var(--gradient-hero)' : 'rgba(217,70,239,0.25)',
              color: readyToStart ? 'white' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s',
            }}
          >
            Start Adventure Now ✨
          </button>

          <button
            type="button"
            onClick={copyLink}
            disabled={!readyToStart}
            style={{
              padding: 13,
              border: '1px solid rgba(217,70,239,0.45)',
              borderRadius: 12,
              fontFamily: 'Outfit',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: readyToStart ? 'pointer' : 'not-allowed',
              background: 'rgba(124,58,237,0.22)',
              color: readyToStart ? '#e9d5ff' : 'rgba(255,255,255,0.4)',
              transition: 'all 0.2s',
            }}
          >
            Copy Secret Challenge Link 💌
          </button>

          <button
            type="button"
            onClick={handleTryDemo}
            style={{
              padding: 13,
              border: 'none',
              borderRadius: 12,
              fontFamily: 'Outfit',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'rgba(236,72,153,0.25)',
              color: '#f472b6',
              transition: 'all 0.2s',
            }}
          >
            Try Demo Couple 💜
          </button>
        </div>

        {linkStatus && (
          <p style={{ marginTop: 12, color: '#34d399', fontSize: '0.88rem', textAlign: 'center' }}>{linkStatus}</p>
        )}
        {linkError && (
          <p style={{ marginTop: 12, color: '#f43f5e', fontSize: '0.88rem', textAlign: 'center' }}>{linkError}</p>
        )}
      </div>
    </motion.div>
  )
}
