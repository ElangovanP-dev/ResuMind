import { useRef } from 'react'

export default function DnaCard({ score = 75, skills = [], fileName = 'Resume' }) {
  const cardRef = useRef(null)

  const downloadPng = () => {
    const svgEl = cardRef.current
    if (!svgEl) return

    try {
      const svgString = new XMLSerializer().serializeToString(svgEl)
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const URL = window.URL || window.webkitURL || window
      const blobURL = URL.createObjectURL(svgBlob)
      
      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 600
        canvas.height = 400
        const context = canvas.getContext('2d')
        context.drawImage(image, 0, 0)
        
        const png = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.href = png
        downloadLink.download = `${fileName.replace('.pdf', '')}_ResuMind_DNA.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
      }
      image.src = blobURL
    } catch (e) {
      console.error('Failed to export canvas image:', e)
    }
  }

  // Draw core competencies (first 6 skills)
  const displaySkills = skills.slice(0, 6)

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white/40 dark:bg-themed-surface/40 backdrop-blur-sm rounded-2xl border border-themed">
      <div className="mb-4 text-center">
        <h3 className="text-base font-bold gold-text">Resume DNA Shareable Card</h3>
        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Download this beautiful profile card to share your metrics on LinkedIn or Twitter.</p>
      </div>

      {/* SVG Canvas to render the card */}
      <svg
        ref={cardRef}
        width="600"
        height="400"
        viewBox="0 0 600 400"
        className="w-full max-w-[480px] shadow-2xl rounded-2xl border overflow-hidden"
        style={{ borderColor: 'var(--border-color)' }}
      >
        {/* Background Gradients */}
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0c0815" />
            <stop offset="50%" stopColor="#1a0b36" />
            <stop offset="100%" stopColor="#0f0a1a" />
          </linearGradient>
          <linearGradient id="glowGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="goldTextGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        <rect width="600" height="400" fill="url(#bgGrad)" />

        {/* Decorative Grid Lines */}
        <path d="M 0,50 L 600,50 M 0,100 L 600,100 M 0,150 L 600,150 M 0,200 L 600,200 M 0,250 L 600,250 M 0,300 L 600,300 M 0,350 L 600,350" fill="none" stroke="rgba(124, 58, 237, 0.05)" strokeWidth="1" />
        <path d="M 100,0 L 100,400 M 200,0 L 200,400 M 300,0 L 300,400 M 400,0 L 400,400 M 500,0 L 500,400" fill="none" stroke="rgba(124, 58, 237, 0.05)" strokeWidth="1" />

        {/* Glowing header banner */}
        <rect y="0" width="600" height="85" fill="rgba(124, 58, 237, 0.15)" />
        <line x1="0" y1="85" x2="600" y2="85" stroke="rgba(124, 58, 237, 0.3)" strokeWidth="1.5" />

        {/* App Title logo */}
        <g transform="translate(30, 25)">
          <rect width="36" height="36" rx="10" fill="linear-gradient(135deg,#7c3aed,#a855f7)" />
          <path d="M12 24h12M12 28h12M14 17h8a2 2 0 012 2v9a2 2 0 01-2 2h-8M21 21v-4" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
          <text x="50" y="24" fill="url(#goldTextGrad)" fontSize="20" fontWeight="800" fontFamily="Inter, sans-serif">ResuMind</text>
          <text x="50" y="36" fill="#a78bfa" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="1.5">AI RESUME DNA</text>
        </g>

        {/* Verified Badge */}
        <g transform="translate(480, 30)">
          <rect width="90" height="26" rx="13" fill="rgba(16, 185, 129, 0.1)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
          <text x="45" y="17" fill="#10b981" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif" textAnchor="middle">✓ VERIFIED ATS</text>
        </g>

        {/* Score Radial Ring */}
        <g transform="translate(140, 240)">
          <circle r="65" fill="none" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="12" />
          <circle r="65" fill="none" stroke="#7c3aed" strokeWidth="12" strokeDasharray="408.4" strokeDashoffset={408.4 - (408.4 * score) / 100} transform="rotate(-90)" strokeLinecap="round" />
          
          <text textAnchor="middle" y="5" fill="#f5f3ff" fontSize="34" fontWeight="800" fontFamily="Inter, sans-serif">{score}</text>
          <text textAnchor="middle" y="22" fill="#a78bfa" fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif" letterSpacing="1">ATS SCORE</text>
          <text textAnchor="middle" y="-20" fill="#fbbf24" fontSize="10" fontWeight="800" fontFamily="Inter, sans-serif" letterSpacing="1.5">
            {score >= 80 ? 'EXCELLENT' : score >= 60 ? 'OPTIMIZED' : 'NEEDS WORK'}
          </text>
        </g>

        {/* Competencies details */}
        <g transform="translate(290, 130)">
          <text x="0" y="0" fill="#f5f3ff" fontSize="14" fontWeight="800" fontFamily="Inter, sans-serif" letterSpacing="1">CORE COMPETENCIES</text>
          <line x1="0" y1="8" x2="270" y2="8" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1.5" />
          
          {displaySkills.map((skill, index) => {
            const row = Math.floor(index / 2)
            const col = index % 2
            const xPos = col * 140
            const yPos = 35 + row * 45
            return (
              <g key={skill} transform={`translate(${xPos}, ${yPos})`}>
                <rect width="125" height="30" rx="8" fill="rgba(124, 58, 237, 0.1)" stroke="rgba(124, 58, 237, 0.2)" strokeWidth="1" />
                <circle cx="15" cy="15" r="3" fill="#fbbf24" />
                <text x="26" y="19" fill="#f5f3ff" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">{skill}</text>
              </g>
            )
          })}
        </g>

        {/* Footer info */}
        <g transform="translate(30, 360)">
          <text x="0" y="0" fill="#7c3aed" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">REPORT: {fileName.substring(0, 30)}</text>
          <text x="540" y="0" fill="rgba(167, 139, 250, 0.5)" fontSize="9" fontWeight="600" fontFamily="Inter, sans-serif" textAnchor="end">resumind-web.pages.dev</text>
        </g>
      </svg>

      <button
        onClick={downloadPng}
        className="btn-primary px-6 py-2.5 mt-5 text-sm font-semibold tracking-wide"
      >
        📥 Download Skill DNA Card
      </button>
    </div>
  )
}
