import { useEffect, useState } from 'react'

export default function RadarChart({ skillsFound = [], requiredSkills = [] }) {
  const [animate, setAnimate] = useState(false)

  // Ensure unique list of skills for the radar axes (combine found and required)
  const allSkills = Array.from(new Set([...skillsFound, ...requiredSkills])).slice(0, 7)
  
  // Default fallback if no skills provided
  const axes = allSkills.length > 0 ? allSkills : ['Java', 'Spring Boot', 'SQL', 'AWS', 'Docker', 'React', 'Agile']
  const totalAxes = axes.length

  const width = 360
  const height = 360
  const centerX = width / 2
  const centerY = height / 2
  const maxRadius = 130

  // Animate on load
  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 200)
    return () => clearTimeout(t)
  }, [])

  // Calculate coordinates on a circle
  const getCoordinates = (index, value) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2
    const radius = maxRadius * (value / 100)
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  }

  // Generate background circular grid lines (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]
  const grids = gridLevels.map((level) => {
    const points = Array.from({ length: totalAxes }).map((_, i) => {
      const coords = getCoordinates(i, level * 100)
      return `${coords.x},${coords.y}`
    }).join(' ')
    return <polygon key={level} points={points} fill="none" stroke="var(--border-color)" strokeWidth="0.8" strokeDasharray="3,3" />
  })

  // Generate web lines from center to outer vertices
  const webLines = Array.from({ length: totalAxes }).map((_, i) => {
    const outer = getCoordinates(i, 100)
    return (
      <line key={i} x1={centerX} y1={centerY} x2={outer.x} y2={outer.y} stroke="var(--border-color)" strokeWidth="1" />
    )
  })

  // Candidate scores map (e.g. 100 if present, 25 if not)
  const candidateData = axes.map((skill, index) => {
    const isFound = skillsFound.some(s => s.toLowerCase() === skill.toLowerCase())
    const score = isFound ? 95 : 25
    return getCoordinates(index, animate ? score : 0)
  })
  const candidatePoints = candidateData.map(p => `${p.x},${p.y}`).join(' ')

  // Target requirement scores (always 100 for required, 50 otherwise)
  const targetData = axes.map((skill, index) => {
    const isRequired = requiredSkills.some(s => s.toLowerCase() === skill.toLowerCase())
    const score = isRequired ? 90 : 45
    return getCoordinates(index, animate ? score : 0)
  })
  const targetPoints = targetData.map(p => `${p.x},${p.y}`).join(' ')

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white/40 dark:bg-themed-surface/40 backdrop-blur-sm rounded-2xl border border-themed">
      <h3 className="text-base font-bold gold-text mb-4">Competency Radar Gap Chart</h3>
      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          {/* Circular grids */}
          {grids}
          
          {/* Web lines */}
          {webLines}

          {/* Target Profile Polygon */}
          <polygon
            points={targetPoints}
            fill="rgba(245, 158, 11, 0.08)"
            stroke="var(--gold-400)"
            strokeWidth="2"
            style={{ transition: 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />

          {/* Candidate Profile Polygon */}
          <polygon
            points={candidatePoints}
            fill="rgba(124, 58, 237, 0.18)"
            stroke="var(--violet-500)"
            strokeWidth="2.5"
            style={{ transition: 'all 1.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />

          {/* Markers */}
          {axes.map((skill, i) => {
            const candidateCoords = candidateData[i]
            const targetCoords = targetData[i]
            return (
              <g key={i}>
                {/* Target Dot */}
                <circle cx={targetCoords?.x} cy={targetCoords?.y} r="3.5" fill="var(--gold-500)" style={{ transition: 'all 1.4s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                {/* Candidate Dot */}
                <circle cx={candidateCoords?.x} cy={candidateCoords?.y} r="4.5" fill="var(--violet-600)" style={{ transition: 'all 1.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />
              </g>
            )
          })}

          {/* Labels */}
          {axes.map((skill, i) => {
            const outer = getCoordinates(i, 118)
            let anchor = 'middle'
            if (outer.x < centerX - 10) anchor = 'end'
            if (outer.x > centerX + 10) anchor = 'start'
            return (
              <text
                key={i}
                x={outer.x}
                y={outer.y + 4}
                textAnchor={anchor}
                className="text-[11px] font-semibold tracking-wide"
                fill="var(--text-primary)"
              >
                {skill}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex gap-6 mt-4 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-violet-600 inline-block" />
          <span style={{ color: 'var(--text-secondary)' }}>Your Profile</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
          <span style={{ color: 'var(--text-secondary)' }}>Target Requirements</span>
        </div>
      </div>
    </div>
  )
}
