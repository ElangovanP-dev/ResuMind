import { useState } from 'react'
import api from '../services/api'

export default function GithubImport({ isOpen, onClose, onImport }) {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bullets, setBullets] = useState([])
  const [selectedBullets, setSelectedBullets] = useState([])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!repoUrl) return
    setLoading(true)
    setError('')
    setBullets([])
    setSelectedBullets([])

    // Parse owner/repo from URL
    let repoName = repoUrl.replace('https://github.com/', '').trim()
    if (repoName.endsWith('/')) repoName = repoName.slice(0, -1)

    try {
      // Fetch README content from public GitHub raw endpoint safely in frontend, or simulate
      let readmeText = ''
      try {
        const rawReadmeResponse = await fetch(`https://raw.githubusercontent.com/${repoName}/main/README.md`)
        if (rawReadmeResponse.ok) {
          readmeText = await rawReadmeResponse.text()
        } else {
          // Try master fallback
          const rawReadmeResponseMaster = await fetch(`https://raw.githubusercontent.com/${repoName}/master/README.md`)
          if (rawReadmeResponseMaster.ok) {
            readmeText = await rawReadmeResponseMaster.text()
          }
        }
      } catch (fError) {
        console.warn('CORS or fetch error reading README from GitHub Raw, falling back to repository title scan.')
      }

      if (!readmeText) {
        readmeText = `This is a developer repository named ${repoName}. It implements production code, clean API logic, database schemas, and structured services.`
      }

      const res = await api.post('/api/premium/github-import', {
        repoName,
        readmeText
      })

      setBullets(res.data.bullets || [])
      setSelectedBullets(res.data.bullets || [])
    } catch (err) {
      setError('Failed to scan GitHub repository. Verify the repository path is public.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelect = (bullet) => {
    if (selectedBullets.includes(bullet)) {
      setSelectedBullets(selectedBullets.filter(b => b !== bullet))
    } else {
      setSelectedBullets([...selectedBullets, bullet])
    }
  }

  const handleConfirm = () => {
    onImport(selectedBullets)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="glass-card w-full max-w-lg p-6 md:p-8 flex flex-col justify-between max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-glass)' }}>
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold gold-text flex items-center gap-2">
              <svg className="w-6 h-6 text-violet-500" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              GitHub Project Auto-Import
            </h3>
            <button onClick={onClose} className="text-themed-secondary hover:text-red-500 font-semibold p-1">✕</button>
          </div>

          <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>
            Enter a public GitHub repository link (e.g. <code>owner/repository</code>). We will scan the project README and automatically generate high-impact, professional resume bullet points.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>GitHub Repository Path</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. ElangovanP-dev/ResuMind"
                  className="input-field"
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary px-6 text-xs font-bold uppercase tracking-wide whitespace-nowrap"
                >
                  {loading ? 'Scanning...' : 'Scan Repo'}
                </button>
              </div>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs text-center">
              {error}
            </div>
          )}

          {bullets.length > 0 && (
            <div className="mt-6 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Generated Bullets (Select to import):</h4>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                {bullets.map((bullet, idx) => {
                  const isSelected = selectedBullets.includes(bullet)
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelect(bullet)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-violet-500 bg-violet-500/5'
                          : 'border-themed bg-themed-surface/20'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Controlled by outer click
                        className="mt-0.5"
                      />
                      <span style={{ color: 'var(--text-primary)' }}>{bullet}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-themed flex gap-3 justify-end">
          <button onClick={onClose} className="px-5 py-2 text-xs font-semibold rounded-xl border border-themed" style={{ color: 'var(--text-primary)' }}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedBullets.length === 0}
            className="btn-primary px-6 py-2 text-xs font-bold disabled:opacity-50"
          >
            Import Selected ({selectedBullets.length})
          </button>
        </div>
      </div>
    </div>
  )
}
