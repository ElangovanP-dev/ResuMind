import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STAGES = [
  { id: 'validate', label: 'File Validated', icon: '📄', description: 'PDF format and size verified' },
  { id: 'connect', label: 'Server Connected', icon: '🔗', description: 'Established secure connection' },
  { id: 'parsing', label: 'Parsing Resume', icon: '📝', description: 'Extracting text and structure' },
  { id: 'analyzing', label: 'AI Analyzing', icon: '🧠', description: '5-pillar deep analysis in progress' },
  { id: 'scoring', label: 'Computing Scores', icon: '📊', description: 'Calculating pillar-level scores' },
  { id: 'complete', label: 'Analysis Complete', icon: '✅', description: 'Ready to view results' }
]

const STAGE_TIMINGS = [0, 1500, 4000, 8000, 18000, 40000]

export default function AnalysisProgress({ isActive, onStageChange }) {
  const [currentStage, setCurrentStage] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  // Progress through stages based on elapsed time
  useEffect(() => {
    if (!isActive) {
      setCurrentStage(0)
      setElapsed(0)
      return
    }

    const startTime = Date.now()
    const timer = setInterval(() => {
      const e = Date.now() - startTime
      setElapsed(e)

      // Find which stage we should be at
      for (let i = STAGE_TIMINGS.length - 1; i >= 0; i--) {
        if (e >= STAGE_TIMINGS[i]) {
          setCurrentStage((prev) => {
            if (i > prev) {
              onStageChange?.(STAGES[i].id)
              return i
            }
            return prev
          })
          break
        }
      }
    }, 500)

    return () => clearInterval(timer)
  }, [isActive, onStageChange])

  if (!isActive) return null

  return (
    <div className="analysis-progress-container">
      <div className="analysis-progress-header">
        <div className="analysis-progress-spinner" />
        <div>
          <h3 className="analysis-progress-title">Analyzing Your Resume</h3>
          <p className="analysis-progress-elapsed">
            {Math.floor(elapsed / 1000)}s elapsed
          </p>
        </div>
      </div>

      <div className="analysis-progress-stages">
        <AnimatePresence>
          {STAGES.map((stage, index) => {
            const isCompleted = index < currentStage
            const isCurrent = index === currentStage
            const isUpcoming = index > currentStage

            if (isUpcoming) return null

            return (
              <motion.div
                key={stage.id}
                className={`analysis-stage ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              >
                <div className="analysis-stage-icon">
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="analysis-stage-check"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </motion.div>
                  ) : isCurrent ? (
                    <div className="analysis-stage-spinner-mini" />
                  ) : (
                    <span>{stage.icon}</span>
                  )}
                </div>
                <div className="analysis-stage-content">
                  <span className="analysis-stage-label">{stage.label}</span>
                  <span className="analysis-stage-desc">{stage.description}</span>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Contextual hints for long waits */}
      <AnimatePresence>
        {elapsed > 12000 && elapsed < 25000 && (
          <motion.p
            className="analysis-progress-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            💡 Server may be waking up (free hosting). This is normal on first use.
          </motion.p>
        )}
        {elapsed >= 25000 && elapsed < 50000 && (
          <motion.p
            className="analysis-progress-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            🧠 AI is performing deep 5-pillar analysis — complex resumes take a bit longer.
          </motion.p>
        )}
        {elapsed >= 50000 && (
          <motion.p
            className="analysis-progress-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            ⏳ Almost there! Free-tier servers can take up to 90 seconds on cold starts.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
