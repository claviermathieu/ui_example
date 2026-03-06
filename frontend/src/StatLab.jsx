import { useState } from 'react'

const TEMPLATES = [
  {
    id: 'normal',
    name: 'Loi Normale',
    tag: 'Continue',
    color: '#3b82f6',
    description: 'N(μ, σ²) — distribution symétrique en cloche',
    params: [
      { key: 'mean', label: 'Moyenne μ', type: 'number', default: 0, step: 0.1 },
      { key: 'std', label: 'Écart-type σ', type: 'number', default: 1, step: 0.1, min: 0.01 },
      { key: 'show_fill', label: 'Régions ±nσ', type: 'checkbox', default: true },
    ],
    plotEndpoint: '/api/plot',
    statsEndpoint: '/api/stats',
  },
  {
    id: 'poisson',
    name: 'Loi de Poisson',
    tag: 'Discrète',
    color: '#10b981',
    description: "P(λ) — nombre d'événements dans un intervalle",
    params: [
      { key: 'lam', label: 'Lambda λ', type: 'number', default: 3, step: 0.5, min: 0.1 },
      { key: 'k_max', label: 'k maximum', type: 'number', default: 15, step: 1, min: 5 },
    ],
    plotEndpoint: '/api/poisson',
    statsEndpoint: null,
  },
  {
    id: 'student',
    name: 'Loi de Student',
    tag: 'Continue',
    color: '#f59e0b',
    description: 't(ν) — robuste pour les petits échantillons',
    params: [
      { key: 'df', label: 'Degrés de liberté ν', type: 'number', default: 5, step: 1, min: 1 },
      { key: 'compare_normal', label: 'Superposer N(0,1)', type: 'checkbox', default: true },
    ],
    plotEndpoint: '/api/student',
    statsEndpoint: null,
  },
  {
    id: 'chi2',
    name: 'Loi du χ²',
    tag: 'Continue',
    color: '#ec4899',
    description: "χ²(k) — tests d'hypothèse et intervalles de confiance",
    params: [
      { key: 'df', label: 'Degrés de liberté k', type: 'number', default: 3, step: 1, min: 1 },
    ],
    plotEndpoint: '/api/chi2',
    statsEndpoint: null,
  },
]

function createPanel(template) {
  return {
    id: `${template.id}-${Date.now()}`,
    templateId: template.id,
    params: Object.fromEntries(template.params.map((p) => [p.key, p.default])),
    result: null,
    loading: false,
    error: null,
    runCount: 0,
    lastRun: null,
  }
}

function ParamField({ param, value, onChange }) {
  if (param.type === 'checkbox') {
    return (
      <label className="toggle">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span className="toggle-track"><span className="toggle-thumb" /></span>
        {param.label}
      </label>
    )
  }
  return (
    <div className="field">
      <label>{param.label}</label>
      <input
        type="number"
        value={value ?? param.default}
        step={param.step}
        min={param.min}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  )
}

function StatsGrid({ stats }) {
  const items = [
    { label: 'Moyenne μ', value: stats.mean },
    { label: 'Écart-type σ', value: stats.std },
    { label: 'Variance σ²', value: stats.variance },
    { label: 'P(μ±1σ)', value: `${(stats.p_1sigma * 100).toFixed(2)}%` },
    { label: 'P(μ±2σ)', value: `${(stats.p_2sigma * 100).toFixed(2)}%` },
    { label: 'P(μ±3σ)', value: `${(stats.p_3sigma * 100).toFixed(2)}%` },
  ]
  return (
    <div className="stats-grid">
      {items.map(({ label, value }) => (
        <div key={label} className="stat-box">
          <div className="stat-label">{label}</div>
          <div className="stat-value">{value}</div>
        </div>
      ))}
    </div>
  )
}

function TemplatePickerModal({ onSelect, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Bibliothèque de templates</div>
            <div className="modal-subtitle">
              Chaque template génère automatiquement son formulaire et appelle la fonction Python.
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="template-grid">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              className="template-option"
              onClick={() => onSelect(t)}
              style={{ '--t-color': t.color }}
            >
              <div className="template-option-header">
                <span className="template-option-dot" style={{ background: t.color }} />
                <span className="template-option-tag" style={{ color: t.color, borderColor: `${t.color}44` }}>
                  {t.tag}
                </span>
              </div>
              <div className="template-option-name">{t.name}</div>
              <div className="template-option-desc">{t.description}</div>
              <div className="template-option-arrow" style={{ color: t.color }}>Ajouter →</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function PanelCard({ instance, template, onRemove, onParamChange, onRun }) {
  return (
    <div className="panel" style={{ '--panel-color': template.color }}>
      <div className="panel-header">
        <div className="panel-title-row">
          <span className="panel-dot" style={{ background: template.color }} />
          <span className="panel-name">{template.name}</span>
          <span className="panel-tag" style={{ color: template.color, borderColor: `${template.color}44` }}>
            {template.tag}
          </span>
        </div>
        <div className="panel-actions">
          {instance.runCount > 0 && (
            <span className="run-badge">{instance.runCount} run{instance.runCount > 1 ? 's' : ''}</span>
          )}
          <button className="panel-close" onClick={() => onRemove(instance.id)}>✕</button>
        </div>
      </div>

      <div className="panel-body">
        <div className="panel-params">
          {template.params.map((param) => (
            <ParamField
              key={param.key}
              param={param}
              value={instance.params[param.key]}
              onChange={(val) => onParamChange(instance.id, param.key, val)}
            />
          ))}
        </div>
        <button
          className={`btn run-btn${instance.loading ? ' loading' : ''}`}
          style={{ '--btn-color': template.color }}
          onClick={() => onRun(instance.id, instance.params, instance.templateId)}
          disabled={instance.loading}
        >
          {instance.loading ? <><span className="spinner-small" />Exécution...</> : '▶  Exécuter'}
        </button>
      </div>

      {instance.error && <div className="error">Erreur : {instance.error}</div>}

      {instance.result && (
        <div className="panel-result">
          <img className="result-img" src={`data:image/png;base64,${instance.result.image}`} alt={template.name} />
          {instance.result.stats && <StatsGrid stats={instance.result.stats} />}
          {instance.lastRun && (
            <div className="result-meta">
              Exécuté à {instance.lastRun.toLocaleTimeString()} · {instance.runCount} run{instance.runCount > 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {!instance.result && !instance.loading && !instance.error && (
        <div className="panel-placeholder">
          Configurez les paramètres et cliquez sur <strong>Exécuter</strong>.
        </div>
      )}
    </div>
  )
}

export default function StatLab() {
  const [panels, setPanels] = useState([])
  const [showPicker, setShowPicker] = useState(false)

  const addPanel = (template) => {
    setPanels((prev) => [...prev, createPanel(template)])
    setShowPicker(false)
  }

  const removePanel = (id) => setPanels((prev) => prev.filter((p) => p.id !== id))

  const updateParam = (id, key, value) =>
    setPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, params: { ...p.params, [key]: value } } : p))
    )

  const runPanel = async (id, params, templateId) => {
    const template = TEMPLATES.find((t) => t.id === templateId)
    setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, loading: true, error: null } : p)))
    try {
      const requests = [
        fetch(template.plotEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }),
      ]
      if (template.statsEndpoint) {
        requests.push(fetch(template.statsEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }))
      }
      const responses = await Promise.all(requests)
      const [plotData, statsData] = await Promise.all(responses.map((r) => r.json()))
      if (!responses[0].ok) throw new Error(plotData.error || 'Erreur serveur')
      setPanels((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, loading: false, result: { image: plotData.image, stats: statsData ?? null }, runCount: p.runCount + 1, lastRun: new Date() }
            : p
        )
      )
    } catch (err) {
      setPanels((prev) => prev.map((p) => (p.id === id ? { ...p, loading: false, error: err.message } : p)))
    }
  }

  const runAll = () => panels.forEach((p) => runPanel(p.id, p.params, p.templateId))

  return (
    <>
      <header className="header">
        <div className="header-left">
          <h1>Stat<span>Lab</span></h1>
          <p className="header-sub">
            Fonctions Python · Azure Functions · {panels.length} analyse{panels.length !== 1 ? 's' : ''} active{panels.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="header-right">
          {panels.length > 1 && (
            <button className="btn btn-ghost" onClick={runAll}>▶▶ Tout exécuter</button>
          )}
          <button className="btn" onClick={() => setShowPicker(true)}>+ Nouvelle analyse</button>
        </div>
      </header>

      <main className="main">
        {panels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">∑</div>
            <h2>Démarrez une analyse</h2>
            <p>Sélectionnez un template — le formulaire est généré automatiquement et la fonction Python appelée via Azure Functions.</p>
            <button className="btn btn-large" onClick={() => setShowPicker(true)}>+ Nouvelle analyse</button>
            <div className="quick-pills">
              <span className="pills-label">Accès rapide :</span>
              {TEMPLATES.map((t) => (
                <button key={t.id} className="pill" style={{ '--t-color': t.color }} onClick={() => addPanel(t)}>
                  <span style={{ color: t.color }}>●</span> {t.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="panels-grid">
            {panels.map((instance) => {
              const template = TEMPLATES.find((t) => t.id === instance.templateId)
              return (
                <PanelCard key={instance.id} instance={instance} template={template}
                  onRemove={removePanel} onParamChange={updateParam} onRun={runPanel} />
              )
            })}
            <button className="add-panel-card" onClick={() => setShowPicker(true)}>
              <span className="add-panel-icon">+</span>
              <span>Ajouter une analyse</span>
            </button>
          </div>
        )}
      </main>

      {showPicker && <TemplatePickerModal onSelect={addPanel} onClose={() => setShowPicker(false)} />}
    </>
  )
}
