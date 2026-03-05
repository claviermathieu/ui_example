import { useState, useCallback, useRef } from 'react'

export default function App() {
  const [params, setParams] = useState({
    mean: 0,
    std: 1,
    x_min: -4,
    x_max: 4,
    show_fill: true,
  })
  const [image, setImage] = useState(null)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const autoXRange = useRef(true)

  const set = (key) => (e) => {
    const val = key === 'show_fill' ? e.target.checked : parseFloat(e.target.value)
    setParams((p) => {
      const next = { ...p, [key]: val }
      if (autoXRange.current && (key === 'mean' || key === 'std')) {
        const mean = key === 'mean' ? val : next.mean
        const std = key === 'std' ? val : next.std
        if (!isNaN(mean) && !isNaN(std) && std > 0) {
          next.x_min = parseFloat((mean - 4 * std).toFixed(4))
          next.x_max = parseFloat((mean + 4 * std).toFixed(4))
        }
      }
      return next
    })
  }

  const generate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [plotRes, statsRes] = await Promise.all([
        fetch('/api/plot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }),
        fetch('/api/stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }),
      ])

      const plotData = await plotRes.json()
      const statsData = await statsRes.json()

      if (!plotRes.ok) throw new Error(plotData.error || 'Erreur serveur')
      if (!statsRes.ok) throw new Error(statsData.error || 'Erreur serveur')

      setImage(plotData.image)
      setStats(statsData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [params])

  return (
    <div className="app">
      <h1>
        Loi <span>Normale</span>
      </h1>

      <div className="card">
        <div className="controls">
          <div className="field">
            <label>Moyenne (μ)</label>
            <input type="number" value={params.mean} step="0.1" onChange={set('mean')} />
          </div>
          <div className="field">
            <label>Écart-type (σ)</label>
            <input
              type="number"
              value={params.std}
              step="0.1"
              min="0.01"
              onChange={set('std')}
            />
          </div>
          <div className="field">
            <label>x min</label>
            <input
              type="number"
              value={params.x_min}
              step="0.5"
              onChange={(e) => {
                autoXRange.current = false
                set('x_min')(e)
              }}
            />
          </div>
          <div className="field">
            <label>x max</label>
            <input
              type="number"
              value={params.x_max}
              step="0.5"
              onChange={(e) => {
                autoXRange.current = false
                set('x_max')(e)
              }}
            />
          </div>
        </div>

        <div className="row" style={{ marginTop: '1.25rem' }}>
          <label className="toggle">
            <input type="checkbox" checked={params.show_fill} onChange={set('show_fill')} />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
            Afficher les régions σ
          </label>
          <button
            className={`btn${loading ? ' loading' : ''}`}
            onClick={generate}
            disabled={loading}
            style={{ marginLeft: 'auto' }}
          >
            {loading ? 'Génération...' : 'Générer le graphe'}
          </button>
        </div>
      </div>

      {error && <div className="error">Erreur : {error}</div>}

      <div className="card">
        <div className="plot-area">
          {loading ? (
            <div className="spinner" />
          ) : image ? (
            <img src={`data:image/png;base64,${image}`} alt="Loi normale" />
          ) : (
            <p className="placeholder">
              Renseignez les paramètres et cliquez sur &quot;Générer le graphe&quot;.
            </p>
          )}
        </div>
      </div>

      {stats && (
        <div className="card">
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Moyenne μ</div>
              <div className="stat-value">{stats.mean}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Écart-type σ</div>
              <div className="stat-value">{stats.std}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">Variance σ²</div>
              <div className="stat-value">{stats.variance}</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">P(μ±1σ)</div>
              <div className="stat-value">{(stats.p_1sigma * 100).toFixed(2)}%</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">P(μ±2σ)</div>
              <div className="stat-value">{(stats.p_2sigma * 100).toFixed(2)}%</div>
            </div>
            <div className="stat-box">
              <div className="stat-label">P(μ±3σ)</div>
              <div className="stat-value">{(stats.p_3sigma * 100).toFixed(2)}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
