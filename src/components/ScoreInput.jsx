import { useState } from 'react'
import { calculateHoleScore } from '../utils/scoring'
import './ScoreInput.css'

export default function ScoreInput({ hole, onSubmit, disabled }) {
  const [hits, setHits] = useState(1)
  const [bucket, setBucket] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showBucketAnim, setShowBucketAnim] = useState(false)

  const score = calculateHoleScore(hits, bucket)

  function handleBucketToggle() {
    const newBucket = !bucket
    setBucket(newBucket)
    if (newBucket) {
      setShowBucketAnim(true)
      setTimeout(() => setShowBucketAnim(false), 800)
    }
  }

  function handleSubmit() {
    if (submitted || disabled) return
    setSubmitted(true)
    onSubmit({ hits, bucket, score })
  }

  if (submitted) {
    return (
      <div className="score-input-submitted anim-scale-in">
        <div className="score-submitted-label">Hole {hole} Score</div>
        <div className={`score-submitted-value ${score <= 0 ? 'score-negative' : ''}`}>
          {score >= 0 ? '+' : ''}{score}
        </div>
        {bucket && <div className="score-submitted-bucket">🪣 BUCKET!</div>}
      </div>
    )
  }

  return (
    <div className="score-input anim-fade-in-up">
      <div className="score-input-hole">Hole {hole}</div>

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
            onClick={() => setHits(hits + 1)}
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
          {score >= 0 ? '+' : ''}{score}
        </div>
        {score === 0 && bucket && <div className="score-preview-fire">🔥 INCREDIBLE!</div>}
      </div>

      <button className="btn btn-red btn-lg btn-block mt-16" onClick={handleSubmit}>
        Submit Score
      </button>
    </div>
  )
}
