import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SHOWCASE_ITEMS = [
  {
    original: 'Responsible for managing team projects and ensuring deadlines were met.',
    improved: 'Led cross-functional team of 8 engineers, delivering 12 product releases on schedule with 99.2% uptime.',
    pillar: 'Impact',
    pillarIcon: '📊',
    delta: '+32',
    insight: 'Added quantified metrics and strong action verb'
  },
  {
    original: 'Worked on developing web applications using various technologies.',
    improved: 'Engineered 3 production React/Node.js applications serving 50K+ monthly active users, reducing page load by 40%.',
    pillar: 'Hard Skills',
    pillarIcon: '🎯',
    delta: '+28',
    insight: 'Specified technologies and measurable outcomes'
  },
  {
    original: 'Helped the company improve its sales process and customer satisfaction.',
    improved: 'Spearheaded CRM pipeline optimization, boosting conversion rates 23% and increasing NPS from 42 to 71 within Q3.',
    pillar: 'Clarity',
    pillarIcon: '✍️',
    delta: '+35',
    insight: 'Replaced passive voice with executive-level specificity'
  },
  {
    original: 'Duties included writing code, testing software, and fixing bugs in production.',
    improved: 'Architected CI/CD pipeline with 95% test coverage, reducing production incidents by 60% and deployment time from 4hrs to 18min.',
    pillar: 'ATS Layout',
    pillarIcon: '📋',
    delta: '+41',
    insight: 'ATS-friendly structure with STAR methodology'
  },
  {
    original: 'Participated in meetings and contributed to project planning activities.',
    improved: 'Drove sprint planning for $2.4M initiative, coordinating 3 distributed teams across 2 time zones to deliver MVP 2 weeks ahead of schedule.',
    pillar: 'Structure',
    pillarIcon: '🏗️',
    delta: '+38',
    insight: 'Transformed vague participation into leadership narrative'
  }
]

export default function DynamicShowcaseSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef(null)

  const goTo = useCallback((index) => {
    setCurrentIndex((index + SHOWCASE_ITEMS.length) % SHOWCASE_ITEMS.length)
  }, [])

  const next = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo])
  const prev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo])

  // Auto-advance
  useEffect(() => {
    if (isPaused) return
    intervalRef.current = setInterval(next, 5000)
    return () => clearInterval(intervalRef.current)
  }, [next, isPaused])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev])

  const item = SHOWCASE_ITEMS[currentIndex]

  return (
    <div
      className="showcase-slider-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Resume improvement showcase"
      aria-roledescription="carousel"
    >
      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="showcase-arrow showcase-arrow-left"
        aria-label="Previous example"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        onClick={next}
        className="showcase-arrow showcase-arrow-right"
        aria-label="Next example"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -60 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="showcase-card"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={(e, info) => {
            if (info.offset.x < -60) next()
            else if (info.offset.x > 60) prev()
          }}
        >
          {/* Pillar Badge */}
          <div className="showcase-badge-row">
            <span className="showcase-pillar-badge">
              {item.pillarIcon} {item.pillar}
            </span>
            <span className="showcase-delta">
              {item.delta} pts
            </span>
          </div>

          {/* Before */}
          <div className="showcase-before">
            <span className="showcase-label">✗ Before</span>
            <p>{item.original}</p>
          </div>

          {/* After */}
          <div className="showcase-after">
            <span className="showcase-label showcase-label-after">✓ After</span>
            <p>{item.improved}</p>
          </div>

          {/* Insight */}
          <div className="showcase-insight">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
            <span>{item.insight}</span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className="showcase-dots" role="tablist" aria-label="Slide indicators">
        {SHOWCASE_ITEMS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`showcase-dot ${i === currentIndex ? 'active' : ''}`}
            role="tab"
            aria-selected={i === currentIndex}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
