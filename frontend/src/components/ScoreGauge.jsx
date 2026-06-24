import { useEffect, useRef } from 'react'

export default function ScoreGauge({ score }) {
  const circleRef = useRef(null)
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const color =
    score >= 80 ? '#22c55e' :
    score >= 60 ? '#f59e0b' :
    '#ef4444'

  useEffect(() => {
    const circle = circleRef.current
    if (!circle) return
    circle.style.strokeDashoffset = circumference
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        circle.style.transition = 'stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)'
        circle.style.strokeDashoffset = offset
      })
    })
  }, [score, offset, circumference])

  const label =
    score >= 80 ? 'Excellent' :
    score >= 60 ? 'Good' :
    'Needs Work'

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* Background track */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.15)"
          strokeWidth="12"
        />
        {/* Score arc */}
        <circle
          ref={circleRef}
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          transform="rotate(-90 90 90)"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        {/* Score text */}
        <text x="90" y="82" textAnchor="middle" fill="white" fontSize="36" fontWeight="700" fontFamily="Inter">
          {score}
        </text>
        <text x="90" y="102" textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize="12" fontFamily="Inter">
          ATS Score
        </text>
      </svg>
      <span
        className="text-sm font-semibold px-4 py-1.5 rounded-full"
        style={{ backgroundColor: `${color}22`, color, border: `1px solid ${color}44` }}
      >
        {label}
      </span>
    </div>
  )
}
