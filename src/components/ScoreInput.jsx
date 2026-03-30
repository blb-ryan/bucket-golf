import { useState } from 'react'
import { calculateHoleScore, formatScore } from '../utils/scoring'
import './ScoreInput.css'

export default function ScoreInput({ hole, onSubmit, onUndo, disabled, canUndo }) {
  const [hits, setHits] = useState(1)
  const [bucket, setBucket] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showBucketAnim, setShowBucketAnim] = useState(false)
  const [showHelp, setShowHelp] = useState(() => !localStorage.getItem('bucketgolf_help_seen'))

  const score = calculateHoleScore(hits, bucket)

  function handleBucketToggle() {
    const newBucket = !bucket
    setBucket(newBucket)
    if (newBucket) {
      setShowBucketAnim(true)
      setTimeout(() => setShowBucketAnim(false), 800)
    }
  }

  async function handleSubmit() {
    if (submitted || disabled || submitting) return
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({ hits, bucket, score })
      setSubmitted(true)
    } catch {
      setError('Failed to submit. Tap to retry.')
    }
    setSubmitting(false)
  }

  function dismissHelp() {
    setShowHelp(false)
    localStorage.setItem('bucketgolf_help_seen', '1')
  }

  function handleUndo() {
    setSubmitted(false)
    setError('')
    onUndo?.()
  }

  if (submitted) {
    return (
      <div className="score-input-submitted anim-scale-in">
        <div className="score-submitted-label">Hole {hole} Score</div>
        <div className={`score-submitted-value ${score <= 0 ? 'score-negative' : ''}`}>
          {formatScore(score)}
        </div>
        {bucket && <div className="score-submitted-bucket">🪣 BUCKET!</div>}
        {canUndo && (
          <button className="btn btn-outline btn-sm mt-12" onClick={handleUndo}>
            Edit Score
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="score-input anim-fade-in-up">
      <div className="score-input-hole-row">
        <span className="score-input-hole">Hole {hole}</span>
        <button className="score-help-btn" onClick={() => setShowHelp(!showHelp)} aria-label="Scoring help">?</button>
      </div>

      {showHelp && (
        <div className="score-help-card anim-fade-in">
          <p className="score-help-title">How Scoring Works</p>
          <p className="score-help-text">Count your swings (hits) to get the ball in or near the bucket.</p>
          <p className="score-help-text">If it goes <strong>IN the bucket</strong>, you get <strong>-1</strong> off your score!</p>
          <div className="score-help-examples">
            <span>3 hits + bucket = <strong>2</strong></span>
            <span>3 hits, no bucket = <strong>3</strong></span>
            <span>1 hit + bucket = <strong>E</strong> 🔥</span>
          </div>
          <p className="score-help-text mt-8">Lowest total score wins!</p>
          <button className="btn btn-sm btn-red mt-8" onClick={dismissHelp}>
            Got it!
          </button>
        </div>
      )}

      <div className="score-input-section">
        <label className="score-input-label">Hits</label>
        <div className="score-input-counter">
          <button
            className="counter-btn counter-minus"
            onClick={() => setHits(Math.max(1, hits - 1))}
            disabled={hits <= 1}
          >
            −
          </button>
          <span className="counter-value">{hits}</span>
          <button
            className="counter-btn counter-plus"
            onClick={() => setHits(Math.min(15, hits + 1))}
            disabled={hits >= 15}
          >
            +
          </button>
        </div>
      </div>

      <div className="score-input-section">
        <label className="score-input-label">Did you bucket it?</label>
        <button
          className={`bucket-toggle ${bucket ? 'bucket-toggle-yes' : 'bucket-toggle-no'} ${showBucketAnim ? 'anim-bounce' : ''}`}
          onClick={handleBucketToggle}
        >
          <span className="bucket-toggle-icon">{bucket ? '🪣' : '⛳'}</span>
          <span className="bucket-toggle-text">{bucket ? 'BUCKET!' : 'No Bucket'}</span>
        </button>
      </div>

      <div className="score-input-preview">
        <div className="score-preview-label">Hole Score</div>
        <div className={`score-preview-value ${score <= 0 ? 'score-negative' : ''}`}>
          {formatScore(score)}
        </div>
        {hits === 1 && bucket && <div className="score-preview-fire">🔥 INCREDIBLE!</div>}
      </div>

      {error && <p className="text-red text-sm text-center mt-8">{error}</p>}

      <button className="btn btn-red btn-lg btn-block mt-16" onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Score'}
      </button>
    </div>
  )
}
