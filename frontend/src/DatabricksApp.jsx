import { useState, useRef } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const CLUSTERS = [
  { id: 'axa-prod-01', name: 'Prod — DS4v2 (4-8 workers)' },
  { id: 'axa-dev-02',  name: 'Dev  — DS3v2 (2-4 workers)' },
  { id: 'axa-ml-gpu',  name: 'ML GPU — NC6s v3' },
  { id: 'axa-etl-01',  name: 'ETL — DS5v2 (8-16 workers)' },
]

const USERS = [
  { id: 'j.dupont',  name: 'Jean Dupont',    initials: 'JD', team: 'Actuariat' },
  { id: 'm.martin',  name: 'Marie Martin',   initials: 'MM', team: 'Data Science' },
  { id: 'p.bernard', name: 'Pierre Bernard', initials: 'PB', team: 'Data Eng.' },
  { id: 's.leroy',   name: 'Sophie Leroy',   initials: 'SL', team: 'Marketing' },
  { id: 't.petit',   name: 'Thomas Petit',   initials: 'TP', team: 'Finance' },
]

const CENTRAL_DATASETS = [
  { id: 'contrats_2026',    name: 'Contrats actifs 2026',        path: 'adls://axa-shared/referentiel/contrats_actifs.parquet', size: '2.4 GB', updated: '01/03/2026' },
  { id: 'sinistres_q4',     name: 'Sinistres Q4 2025',           path: 'adls://axa-shared/claims/sinistres_q4_2025.delta',      size: '856 MB', updated: '15/01/2026' },
  { id: 'portefeuille_vie', name: 'Portefeuille Vie — Déc. 2025',path: 'adls://axa-shared/actuariat/ptf_vie_dec25.delta',       size: '1.2 GB', updated: '05/01/2026' },
  { id: 'referentiel_tiers',name: 'Référentiel Tiers',           path: 'adls://axa-shared/referentiel/tiers.parquet',           size: '340 MB', updated: '28/02/2026' },
  { id: 'tarifs_2026',      name: 'Grille tarifaire 2026',       path: 'adls://axa-shared/tarification/grille_2026.parquet',    size: '18 MB',  updated: '10/01/2026' },
]

const STATUS_CONFIG = {
  SUCCESS: { label: 'Succès',     color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '✓' },
  FAILED:  { label: 'Échec',      color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '✕' },
  RUNNING: { label: 'En cours',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', icon: '●' },
  PENDING: { label: 'En attente', color: '#94a3b8', bg: 'rgba(148,163,184,0.10)',icon: '○' },
}

const APP_STATUS_CONFIG = {
  production: { label: 'Production', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  beta:       { label: 'Beta',       color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  dev:        { label: 'Dev',        color: '#64748b', bg: 'rgba(100,116,139,0.10)' },
}

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899']
const PRESET_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899']
const CATEGORIES    = ['Actuariat', 'Finance', 'Marketing', 'Data Engineering', 'RH', 'Autre']

const INITIAL_APPS = [
  {
    id: 'fraud-detection',
    name: 'Fraud Detection',
    description: 'Détection de fraude en temps réel sur les sinistres auto et MRH via XGBoost et Isolation Forest.',
    category: 'Actuariat',
    color: '#ef4444',
    icon: '⚡',
    team: 'Data Science — Sinistres',
    status: 'production',
    notebooks: [
      '/axa-shared/claims/fraud_detection_xgb',
      '/axa-shared/claims/fraud_scoring_batch',
      '/axa-shared/claims/fraud_isolation_forest',
    ],
    runCount: 142,
    lastRunAgo: 'il y a 5min',
  },
  {
    id: 'motor-pricing',
    name: 'Motor Pricing',
    description: 'Modèle de tarification auto intégrant 180+ variables comportementales et géographiques.',
    category: 'Actuariat',
    color: '#3b82f6',
    icon: '◈',
    team: 'Actuariat — Non-Vie',
    status: 'production',
    notebooks: [
      '/axa-shared/actuariat/non-vie/pricing_motor_v3',
      '/axa-shared/actuariat/non-vie/pricing_motor_v4_staging',
      '/axa-shared/actuariat/non-vie/ibnr_estimation',
    ],
    runCount: 87,
    lastRunAgo: 'il y a 18min',
  },
  {
    id: 'solvency-ii',
    name: 'Solvency II',
    description: 'Calcul trimestriel du SCR et MCR avec rapports réglementaires automatisés (EIOPA).',
    category: 'Finance',
    color: '#8b5cf6',
    icon: '∑',
    team: 'Finance — Réglementation',
    status: 'production',
    notebooks: [
      '/axa-shared/finance/solvency_ii_quarterly',
      '/axa-shared/finance/scr_calculation',
      '/axa-shared/finance/mcr_validation',
    ],
    runCount: 24,
    lastRunAgo: 'il y a 2j',
  },
  {
    id: 'crm-scoring',
    name: 'CRM Scoring',
    description: "Score de propension à la résiliation et opportunités de cross-sell sur portefeuille clients.",
    category: 'Marketing',
    color: '#10b981',
    icon: '◎',
    team: 'Marketing — CRM',
    status: 'beta',
    notebooks: [
      '/axa-shared/marketing/crm_scoring_2026',
      '/axa-shared/marketing/churn_propensity',
      '/axa-shared/marketing/cross_sell_opportunities',
    ],
    runCount: 31,
    lastRunAgo: 'il y a 1h',
  },
  {
    id: 'etl-contracts',
    name: 'ETL Contracts',
    description: "Pipeline d'ingestion quotidienne des contrats depuis les systèmes sources vers le Data Lake.",
    category: 'Data Engineering',
    color: '#f59e0b',
    icon: '⟳',
    team: 'Data Engineering',
    status: 'production',
    notebooks: [
      '/axa-shared/data-eng/etl_contracts_daily',
      '/axa-shared/data-eng/etl_contracts_delta',
      '/axa-shared/data-eng/etl_quality_checks',
    ],
    runCount: 365,
    lastRunAgo: 'il y a 42min',
  },
  {
    id: 'hr-attrition',
    name: 'HR Attrition',
    description: "Prédiction du risque d'attrition par collaborateur et segmentation des profils RH à risque.",
    category: 'RH',
    color: '#ec4899',
    icon: '◑',
    team: 'RH — People Analytics',
    status: 'dev',
    notebooks: [
      '/axa-shared/rh/attrition_prediction',
      '/axa-shared/rh/attrition_features',
    ],
    runCount: 8,
    lastRunAgo: 'il y a 3j',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Utils
// ─────────────────────────────────────────────────────────────────────────────
function generateInitialRuns(notebooks) {
  const nb = (idx) => notebooks[idx % notebooks.length]
  const plan = [
    { status: 'SUCCESS', nbIdx: 0, uIdx: 0, clIdx: 0, minAgo: 5   },
    { status: 'SUCCESS', nbIdx: 1, uIdx: 1, clIdx: 1, minAgo: 18  },
    { status: 'RUNNING', nbIdx: 2, uIdx: 2, clIdx: 0, minAgo: 3   },
    { status: 'FAILED',  nbIdx: 0, uIdx: 3, clIdx: 1, minAgo: 42  },
    { status: 'SUCCESS', nbIdx: 1, uIdx: 4, clIdx: 3, minAgo: 67  },
    { status: 'SUCCESS', nbIdx: 2, uIdx: 0, clIdx: 2, minAgo: 95  },
    { status: 'RUNNING', nbIdx: 0, uIdx: 1, clIdx: 0, minAgo: 2   },
    { status: 'SUCCESS', nbIdx: 1, uIdx: 2, clIdx: 1, minAgo: 130 },
    { status: 'FAILED',  nbIdx: 2, uIdx: 3, clIdx: 0, minAgo: 158 },
    { status: 'SUCCESS', nbIdx: 0, uIdx: 4, clIdx: 3, minAgo: 200 },
    { status: 'SUCCESS', nbIdx: 1, uIdx: 0, clIdx: 1, minAgo: 240 },
    { status: 'SUCCESS', nbIdx: 2, uIdx: 1, clIdx: 2, minAgo: 310 },
  ]
  return plan.map((p, i) => {
    const cluster = CLUSTERS[p.clIdx]
    const sec = Math.floor(Math.random() * 540 + 60)
    return {
      id: `RUN-${10042 + plan.length - i}`,
      notebook:         nb(p.nbIdx),
      clusterId:        cluster.id,
      clusterName:      cluster.name,
      user:             USERS[p.uIdx],
      status:           p.status,
      duration:         (p.status === 'RUNNING' || p.status === 'PENDING') ? null : `${Math.floor(sec/60)}m ${sec%60}s`,
      startedAt:        new Date(Date.now() - p.minAgo * 60000),
      params:           { env: p.uIdx % 2 === 0 ? 'prod' : 'dev', date: new Date().toISOString().split('T')[0] },
      error:            p.status === 'FAILED' ? 'SparkException: Job aborted — Task serialization error (OutOfMemoryError)' : null,
      uploadedFiles:    p.nbIdx % 3 === 0 ? ['features_train.csv', 'config.yml'] : [],
      selectedDatasets: p.nbIdx % 2 === 0 ? [CENTRAL_DATASETS[0].id] : [CENTRAL_DATASETS[1].id, CENTRAL_DATASETS[2].id],
    }
  })
}

function relativeTime(date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins}m`
  if (hours < 24) return `il y a ${hours}h`
  return date.toLocaleDateString('fr-FR')
}

function triggerDownload(filename, content, mime = 'text/csv;charset=utf-8;') {
  const blob = new Blob(['\uFEFF' + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function buildInputsCsv(run) {
  const datasets = (run.selectedDatasets ?? [])
    .map((id) => CENTRAL_DATASETS.find((d) => d.id === id)?.name ?? id)
    .join(' | ')
  const files = (run.uploadedFiles ?? []).join(' | ')
  return [
    'run_id,notebook,cluster,user,team,env,date,central_datasets,uploaded_files',
    `${run.id},"${run.notebook}",${run.clusterName},"${run.user.name}",${run.user.team},${run.params?.env ?? ''},${run.params?.date ?? ''},"${datasets}","${files}"`,
  ].join('\n')
}

function buildOutputsCsv(run) {
  const rows = Math.floor(Math.random() * 1800000 + 50000).toLocaleString('fr-FR')
  const score = (Math.random() * 0.08 + 0.90).toFixed(4)
  return [
    'run_id,status,duration,rows_processed,model_score,completed_at',
    `${run.id},${run.status},${run.duration ?? ''},${rows},${score},${run.startedAt.toISOString()}`,
  ].join('\n')
}

function getMockLogs(run) {
  const ts = (ms) =>
    new Date(run.startedAt.getTime() + ms).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const nb = run.notebook.split('/').pop()
  const lines = [
    { t: ts(0),    level: 'INFO',  msg: `Job ${run.id} initialisé` },
    { t: ts(500),  level: 'INFO',  msg: `Connexion au cluster ${run.clusterName}...` },
    { t: ts(4200), level: 'INFO',  msg: `Cluster prêt — notebook : ${nb}` },
  ]
  if ((run.selectedDatasets ?? []).length > 0) {
    const names = run.selectedDatasets.map((id) => CENTRAL_DATASETS.find((d) => d.id === id)?.name ?? id)
    lines.push({ t: ts(5000), level: 'INFO', msg: `Chargement données centrales : ${names.join(', ')}` })
  }
  if ((run.uploadedFiles ?? []).length > 0) {
    lines.push({ t: ts(5500), level: 'INFO', msg: `Fichiers uploadés détectés : ${run.uploadedFiles.join(', ')}` })
  }
  lines.push({ t: ts(6000), level: 'INFO', msg: `Chargement depuis Azure Data Lake...` })
  if (run.status === 'SUCCESS') {
    lines.push(
      { t: ts(48000), level: 'INFO',  msg: `${(Math.random() * 2 + 0.5).toFixed(1)}M lignes chargées` },
      { t: ts(92000), level: 'INFO',  msg: `Résultats écrits dans Delta table (${run.params?.env})` },
      { t: ts(94000), level: 'INFO',  msg: `✓ Job terminé — durée : ${run.duration}` },
    )
  } else if (run.status === 'FAILED') {
    lines.push(
      { t: ts(21000), level: 'ERROR', msg: `SparkException: Job aborted due to stage failure` },
      { t: ts(21100), level: 'ERROR', msg: `Task 8 in stage 3.0 failed: OutOfMemoryError` },
      { t: ts(21200), level: 'FATAL', msg: `Exécution interrompue` },
    )
  } else {
    lines.push({ t: ts(6200), level: 'INFO', msg: `Exécution en cours...` })
  }
  return lines
}

// ─────────────────────────────────────────────────────────────────────────────
// Small components
// ─────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING
  return (
    <span className="status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {status === 'RUNNING'
        ? <span className="status-pulse" style={{ background: cfg.color }} />
        : <span className="status-icon">{cfg.icon}</span>}
      {cfg.label}
    </span>
  )
}

function AppStatusBadge({ status }) {
  const cfg = APP_STATUS_CONFIG[status] ?? APP_STATUS_CONFIG.dev
  return (
    <span className="app-status-badge" style={{ color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  )
}

function Avatar({ user, idx }) {
  return (
    <span className="avatar" style={{ background: AVATAR_COLORS[idx % AVATAR_COLORS.length] }}>
      {user.initials}
    </span>
  )
}

function DownloadMenu({ run }) {
  const [open, setOpen] = useState(false)
  const canDownloadOutputs = run.status === 'SUCCESS'
  return (
    <div className="dl-menu-wrap">
      <button
        className="dl-btn dl-inputs"
        title="Télécharger les inputs"
        onClick={(e) => { e.stopPropagation(); triggerDownload(`inputs_${run.id}.csv`, buildInputsCsv(run)) }}
      >
        ↓ Inputs
      </button>
      <div className="dl-split">
        <button
          className={`dl-btn dl-outputs${!canDownloadOutputs ? ' disabled' : ''}`}
          title={canDownloadOutputs ? 'Télécharger les outputs' : 'Disponible après succès'}
          disabled={!canDownloadOutputs}
          onClick={(e) => { e.stopPropagation(); if (canDownloadOutputs) triggerDownload(`outputs_${run.id}.csv`, buildOutputsCsv(run)) }}
        >
          ↓ Outputs
        </button>
        {canDownloadOutputs && (
          <button className="dl-btn dl-caret" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}>▾</button>
        )}
      </div>
      {open && (
        <div className="dl-dropdown" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { triggerDownload(`outputs_${run.id}.csv`, buildOutputsCsv(run)); setOpen(false) }}>↓ CSV (.csv)</button>
          <button onClick={() => { triggerDownload(`outputs_${run.id}.xlsx`, buildOutputsCsv(run), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); setOpen(false) }}>↓ Excel (.xlsx)</button>
        </div>
      )}
    </div>
  )
}

function RunRow({ run, userIdx, onClick, isSelected }) {
  const nb = run.notebook.split('/').slice(-2).join('/')
  return (
    <tr
      className={`dbx-row${isSelected ? ' selected' : ''}${run.status === 'RUNNING' ? ' row-running' : ''}`}
      onClick={onClick}
      style={isSelected ? { '--row-color': STATUS_CONFIG[run.status]?.color } : {}}
    >
      <td><span className="run-id">{run.id}</span></td>
      <td><span className="nb-path" title={run.notebook}>/{nb}</span></td>
      <td><span className="cluster-name">{run.clusterName.split('—')[0].trim()}</span></td>
      <td className="cell-user">
        <Avatar user={run.user} idx={userIdx} />
        <span className="user-name">{run.user.name}</span>
        <span className="user-team">{run.user.team}</span>
      </td>
      <td><StatusBadge status={run.status} /></td>
      <td className="cell-duration">{run.duration ?? '—'}</td>
      <td className="cell-time">{relativeTime(run.startedAt)}</td>
      <td className="cell-actions" onClick={(e) => e.stopPropagation()}>
        <DownloadMenu run={run} />
      </td>
    </tr>
  )
}

function RunDetailPanel({ run, onClose }) {
  const logs = getMockLogs(run)
  const datasets = (run.selectedDatasets ?? []).map((id) => CENTRAL_DATASETS.find((d) => d.id === id)).filter(Boolean)
  return (
    <aside className="dbx-detail">
      <div className="dbx-detail-header">
        <div>
          <div className="dbx-detail-id">{run.id}</div>
          <StatusBadge status={run.status} />
        </div>
        <button className="dbx-detail-close" onClick={onClose}>✕</button>
      </div>
      <div className="dbx-detail-section">
        <div className="dbx-detail-row"><span className="dbx-detail-key">Notebook</span><span className="dbx-detail-val monospace">{run.notebook}</span></div>
        <div className="dbx-detail-row"><span className="dbx-detail-key">Cluster</span><span className="dbx-detail-val">{run.clusterName}</span></div>
        <div className="dbx-detail-row"><span className="dbx-detail-key">Utilisateur</span><span className="dbx-detail-val">{run.user.name} — {run.user.team}</span></div>
        <div className="dbx-detail-row"><span className="dbx-detail-key">Démarré</span><span className="dbx-detail-val">{run.startedAt.toLocaleString('fr-FR')}</span></div>
        <div className="dbx-detail-row"><span className="dbx-detail-key">Durée</span><span className="dbx-detail-val">{run.duration ?? 'En cours...'}</span></div>
        <div className="dbx-detail-row">
          <span className="dbx-detail-key">Paramètres</span>
          <span className="dbx-detail-val monospace">{Object.entries(run.params ?? {}).map(([k, v]) => `${k}=${v}`).join('  ·  ')}</span>
        </div>
      </div>
      {(datasets.length > 0 || (run.uploadedFiles ?? []).length > 0) && (
        <div className="dbx-detail-section">
          <span className="dbx-detail-key" style={{ marginBottom: '0.4rem', display: 'block' }}>Sources de données</span>
          {datasets.map((ds) => (
            <div key={ds.id} className="dbx-source-item">
              <span className="source-icon">◈</span>
              <div><div className="source-name">{ds.name}</div><div className="source-path monospace">{ds.path}</div></div>
              <span className="source-size">{ds.size}</span>
            </div>
          ))}
          {(run.uploadedFiles ?? []).map((f) => (
            <div key={f} className="dbx-source-item">
              <span className="source-icon">↑</span>
              <div><div className="source-name">{f}</div></div>
            </div>
          ))}
        </div>
      )}
      <div className="dbx-detail-section">
        <span className="dbx-detail-key" style={{ marginBottom: '0.5rem', display: 'block' }}>Téléchargements</span>
        <div className="dbx-dl-row">
          <button className="dbx-dl-full-btn" onClick={() => triggerDownload(`inputs_${run.id}.csv`, buildInputsCsv(run))}>↓ Inputs (.csv)</button>
          <button className={`dbx-dl-full-btn${run.status !== 'SUCCESS' ? ' disabled' : ''}`} disabled={run.status !== 'SUCCESS'} onClick={() => run.status === 'SUCCESS' && triggerDownload(`outputs_${run.id}.csv`, buildOutputsCsv(run))}>↓ Outputs (.csv)</button>
          <button className={`dbx-dl-full-btn${run.status !== 'SUCCESS' ? ' disabled' : ''}`} disabled={run.status !== 'SUCCESS'} onClick={() => run.status === 'SUCCESS' && triggerDownload(`outputs_${run.id}.xlsx`, buildOutputsCsv(run), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}>↓ Outputs (.xlsx)</button>
        </div>
      </div>
      {run.error && (
        <div className="dbx-detail-error">
          <div className="dbx-detail-error-title">Erreur</div>
          <div className="monospace">{run.error}</div>
        </div>
      )}
      <div className="dbx-logs">
        <div className="dbx-logs-title">Logs</div>
        <div className="dbx-logs-body">
          {logs.map((line, i) => (
            <div key={i} className={`log-line log-${line.level.toLowerCase()}`}>
              <span className="log-time">{line.t}</span>
              <span className="log-level">{line.level}</span>
              <span className="log-msg">{line.msg}</span>
            </div>
          ))}
          {(run.status === 'RUNNING' || run.status === 'PENDING') && (
            <div className="log-line log-running"><span className="log-cursor">▌</span></div>
          )}
        </div>
      </div>
    </aside>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modals
// ─────────────────────────────────────────────────────────────────────────────
function LaunchModal({ notebooks, onClose, onLaunch }) {
  const [notebook,         setNotebook]         = useState(notebooks[0])
  const [cluster,          setCluster]          = useState(CLUSTERS[0].id)
  const [env,              setEnv]              = useState('prod')
  const [date,             setDate]             = useState(new Date().toISOString().split('T')[0])
  const [selectedDatasets, setSelectedDatasets] = useState([])
  const [uploadedFiles,    setUploadedFiles]    = useState([])
  const [dragging,         setDragging]         = useState(false)
  const fileRef = useRef(null)

  const toggleDataset = (id) =>
    setSelectedDatasets((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id])

  const addFiles = (files) => {
    const names = Array.from(files).map((f) => f.name)
    setUploadedFiles((prev) => [...new Set([...prev, ...names])])
  }

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }

  const handleSubmit = (e) => {
    e.preventDefault()
    onLaunch({ notebookPath: notebook, clusterId: cluster, params: { env, date }, uploadedFiles, selectedDatasets })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal dbx-launch-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Lancer un run</div>
            <div className="modal-subtitle">Configurez le job, les données sources et les fichiers d'entrée.</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="dbx-launch-form">
          <div className="dbx-form-row">
            <div className="dbx-form-field">
              <label>Notebook</label>
              <select value={notebook} onChange={(e) => setNotebook(e.target.value)}>
                {notebooks.map((nb) => <option key={nb} value={nb}>{nb.split('/').pop()}</option>)}
              </select>
              <span className="dbx-form-hint">{notebook}</span>
            </div>
            <div className="dbx-form-field">
              <label>Cluster</label>
              <select value={cluster} onChange={(e) => setCluster(e.target.value)}>
                {CLUSTERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="dbx-form-row">
            <div className="dbx-form-field">
              <label>Environnement</label>
              <div className="dbx-radio-group">
                {['prod', 'dev', 'staging'].map((e) => (
                  <label key={e} className="dbx-radio">
                    <input type="radio" name="env" value={e} checked={env === e} onChange={() => setEnv(e)} />
                    {e}
                  </label>
                ))}
              </div>
            </div>
            <div className="dbx-form-field">
              <label>Date de référence</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="dbx-form-separator"><span>Sources de données</span></div>
          <div className="dbx-form-field">
            <label>Données centrales de la plateforme</label>
            <div className="central-data-list">
              {CENTRAL_DATASETS.map((ds) => (
                <label key={ds.id} className={`central-data-item${selectedDatasets.includes(ds.id) ? ' selected' : ''}`}>
                  <input type="checkbox" checked={selectedDatasets.includes(ds.id)} onChange={() => toggleDataset(ds.id)} />
                  <div className="cds-info">
                    <span className="cds-name">{ds.name}</span>
                    <span className="cds-path monospace">{ds.path}</span>
                  </div>
                  <div className="cds-meta">
                    <span className="cds-size">{ds.size}</span>
                    <span className="cds-date">màj {ds.updated}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="dbx-form-field">
            <label>Fichiers personnalisés</label>
            <div
              className={`dbx-upload-zone${dragging ? ' drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" multiple accept=".csv,.xlsx,.xls,.parquet,.json" style={{ display: 'none' }} onChange={(e) => addFiles(e.target.files)} />
              <span className="upload-icon">↑</span>
              <span className="upload-label">Glisser-déposer ou cliquer pour parcourir</span>
              <span className="upload-hint">.csv · .xlsx · .parquet · .json</span>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="uploaded-files-list">
                {uploadedFiles.map((f) => (
                  <div key={f} className="uploaded-file">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{f}</span>
                    <button type="button" className="file-remove" onClick={() => setUploadedFiles((prev) => prev.filter((x) => x !== f))}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="dbx-launch-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn">▶ Lancer</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddAppModal({ onClose, onAdd }) {
  const [name,          setName]          = useState('')
  const [description,   setDescription]   = useState('')
  const [category,      setCategory]      = useState('Actuariat')
  const [color,         setColor]         = useState(PRESET_COLORS[0])
  const [icon,          setIcon]          = useState('◈')
  const [notebooksText, setNotebooksText] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const notebooks = notebooksText.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!name.trim() || notebooks.length === 0) return
    onAdd({
      id:          `custom-${Date.now()}`,
      name:        name.trim(),
      description: description.trim(),
      category,
      color,
      icon:        icon.trim() || '◈',
      team:        category,
      status:      'dev',
      notebooks,
      runCount:    0,
      lastRunAgo:  null,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal dbx-launch-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">Configurer une nouvelle app</div>
            <div className="modal-subtitle">Connectez un ou plusieurs notebooks Databricks à la plateforme.</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="dbx-launch-form">
          <div className="dbx-form-row">
            <div className="dbx-form-field">
              <label>Nom de l'application *</label>
              <input
                type="text"
                className="dbx-text-input"
                placeholder="ex: Churn Prediction"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="dbx-form-field">
              <label>Catégorie</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="dbx-form-field">
            <label>Description</label>
            <textarea
              className="dbx-textarea"
              placeholder="Décrivez l'objectif et le périmètre de l'application..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="dbx-form-row">
            <div className="dbx-form-field">
              <label>Icône</label>
              <input
                type="text"
                className="dbx-text-input"
                placeholder="◈ ⚡ ∑ ◎ ◑ ⟳"
                value={icon}
                maxLength={4}
                onChange={(e) => setIcon(e.target.value)}
              />
            </div>
            <div className="dbx-form-field">
              <label>Couleur</label>
              <div className="color-swatches">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch${color === c ? ' selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="dbx-form-separator"><span>Notebooks</span></div>
          <div className="dbx-form-field">
            <label>Chemins des notebooks (un par ligne) *</label>
            <textarea
              className="dbx-textarea monospace"
              placeholder={'/axa-shared/mon-equipe/mon_notebook\n/axa-shared/mon-equipe/mon_notebook_v2'}
              value={notebooksText}
              onChange={(e) => setNotebooksText(e.target.value)}
              rows={4}
              required
            />
            <span className="dbx-form-hint">Chemin complet dans le workspace Databricks</span>
          </div>
          <div className="dbx-launch-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn" disabled={!name.trim() || !notebooksText.trim()}>
              + Ajouter l'application
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Marketplace
// ─────────────────────────────────────────────────────────────────────────────
function AppCard({ app, onSelect }) {
  const statusCfg = APP_STATUS_CONFIG[app.status] ?? APP_STATUS_CONFIG.dev
  return (
    <div className="dbx-app-card" style={{ '--app-color': app.color }} onClick={onSelect}>
      <div className="app-card-top">
        <span className="app-card-icon" style={{ color: app.color }}>{app.icon}</span>
        <div className="app-card-top-right">
          <div className="app-card-name">{app.name}</div>
          <span className="app-status-badge" style={{ color: statusCfg.color, background: statusCfg.bg }}>
            {statusCfg.label}
          </span>
        </div>
      </div>
      <p className="app-card-desc">{app.description}</p>
      <div className="app-card-footer">
        <span className="app-card-category" style={{ color: app.color, borderColor: `${app.color}44` }}>
          {app.category}
        </span>
        <span className="app-card-team">{app.team}</span>
      </div>
      <div className="app-card-meta">
        <span className="app-card-runs">{app.runCount} runs</span>
        {app.lastRunAgo && <span className="app-card-lastrun">· {app.lastRunAgo}</span>}
        <span className="app-card-open" style={{ color: app.color }}>Ouvrir →</span>
      </div>
    </div>
  )
}

function AddAppCard({ onAdd }) {
  return (
    <button className="dbx-app-card-add" onClick={onAdd}>
      <span className="add-app-plus">+</span>
      <span className="add-app-label">Configurer une nouvelle app</span>
      <span className="add-app-hint">Connectez un notebook Databricks à la plateforme</span>
    </button>
  )
}

function Marketplace({ apps, onSelect, onAddApp }) {
  const [search,         setSearch]         = useState('')
  const [activeCategory, setActiveCategory] = useState('Toutes')

  const allCategories = ['Toutes', ...new Set(apps.map((a) => a.category))]

  const filtered = apps.filter((app) => {
    const matchCat    = activeCategory === 'Toutes' || app.category === activeCategory
    const q           = search.toLowerCase()
    const matchSearch = !q || app.name.toLowerCase().includes(q) || app.description.toLowerCase().includes(q) || app.category.toLowerCase().includes(q)
    return matchCat && matchSearch
  })

  return (
    <div className="dbx-marketplace">
      <div className="dbx-market-topbar">
        <div>
          <div className="dbx-market-title">App Catalog</div>
          <div className="dbx-market-sub">
            {apps.length} application{apps.length !== 1 ? 's' : ''} disponible{apps.length !== 1 ? 's' : ''} sur la plateforme
          </div>
        </div>
        <input
          className="dbx-search dbx-market-search"
          placeholder="Rechercher une app..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="dbx-market-cats">
        {allCategories.map((cat) => (
          <button
            key={cat}
            className={`dbx-filter-btn${activeCategory === cat ? ' active' : ''}`}
            style={activeCategory === cat ? { '--f-color': '#3b82f6' } : {}}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
            <span className="filter-count">
              {cat === 'Toutes' ? apps.length : apps.filter((a) => a.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      <div className="dbx-market-grid">
        {filtered.map((app) => (
          <AppCard key={app.id} app={app} onSelect={() => onSelect(app)} />
        ))}
        <AddAppCard onAdd={onAddApp} />
      </div>

      {filtered.length === 0 && (
        <div className="dbx-empty">Aucune application ne correspond à la recherche.</div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Run Monitor (per-app run history view)
// ─────────────────────────────────────────────────────────────────────────────
function RunMonitor({ app, onBack }) {
  const [runs,         setRuns]         = useState(() => generateInitialRuns(app.notebooks))
  const [filter,       setFilter]       = useState({ status: 'ALL', user: 'ALL', search: '' })
  const [showLauncher, setShowLauncher] = useState(false)
  const [selectedRun,  setSelectedRun]  = useState(null)

  const launchRun = ({ notebookPath, clusterId, params, uploadedFiles, selectedDatasets }) => {
    const cluster = CLUSTERS.find((c) => c.id === clusterId)
    const newRun = {
      id:               `RUN-${10042 + runs.length + 1}`,
      notebook:         notebookPath,
      clusterId,
      clusterName:      cluster.name,
      user:             USERS[0],
      status:           'PENDING',
      duration:         null,
      startedAt:        new Date(),
      params,
      error:            null,
      uploadedFiles,
      selectedDatasets,
    }
    setRuns((prev) => [newRun, ...prev])
    setShowLauncher(false)
    setSelectedRun(newRun)

    const update = (patch) => {
      setRuns((prev) => prev.map((r) => r.id === newRun.id ? { ...r, ...patch } : r))
      setSelectedRun((r) => r?.id === newRun.id ? { ...r, ...patch } : r)
    }

    setTimeout(() => update({ status: 'RUNNING' }), 1500)
    const totalMs = Math.floor(Math.random() * 7000 + 4000)
    setTimeout(() => {
      const success = Math.random() > 0.15
      const durStr  = `${Math.floor(totalMs / 60000)}m ${Math.floor((totalMs % 60000) / 1000)}s`
      update({
        status:   success ? 'SUCCESS' : 'FAILED',
        duration: durStr,
        error:    success ? null : 'SparkException: Job aborted — Task serialization error (OutOfMemoryError)',
      })
    }, 1500 + totalMs)
  }

  const filteredRuns = runs.filter((r) => {
    if (filter.status !== 'ALL' && r.status !== filter.status) return false
    if (filter.user !== 'ALL' && r.user.id !== filter.user) return false
    if (filter.search) {
      const q = filter.search.toLowerCase()
      if (!r.notebook.includes(q) && !r.id.toLowerCase().includes(q) && !r.user.name.toLowerCase().includes(q)) return false
    }
    return true
  })

  const counts = {
    total:   runs.length,
    success: runs.filter((r) => r.status === 'SUCCESS').length,
    running: runs.filter((r) => r.status === 'RUNNING' || r.status === 'PENDING').length,
    failed:  runs.filter((r) => r.status === 'FAILED').length,
  }
  const done        = counts.success + counts.failed
  const successRate = done > 0 ? Math.round((counts.success / done) * 100) : 0

  return (
    <>
      {/* Header */}
      <div className="dbx-header">
        <div className="dbx-header-left">
          <button className="dbx-back-btn" onClick={onBack}>← Catalogue</button>
          <div className="dbx-run-title">
            <span className="dbx-run-icon" style={{ color: app.color }}>{app.icon}</span>
            <span className="dbx-header-title">{app.name}</span>
            <AppStatusBadge status={app.status} />
          </div>
          <div className="dbx-header-sub">
            {app.category} · {app.team} · {counts.running} job{counts.running !== 1 ? 's' : ''} en cours
          </div>
        </div>
        <button className="btn" style={{ '--btn-accent': app.color }} onClick={() => setShowLauncher(true)}>
          ▶ Lancer un run
        </button>
      </div>

      {/* Stats */}
      <div className="dbx-stats-bar">
        {[
          { label: 'Total runs',  value: counts.total,   color: '#e2e8f0' },
          { label: 'Succès',      value: counts.success, color: '#10b981', sub: `${successRate}% taux` },
          { label: 'En cours',    value: counts.running, color: '#3b82f6' },
          { label: 'Échecs',      value: counts.failed,  color: '#ef4444' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="dbx-stat-card">
            <div className="dbx-stat-value" style={{ color }}>{value}</div>
            <div className="dbx-stat-label">{label}</div>
            {sub && <div className="dbx-stat-sub">{sub}</div>}
          </div>
        ))}
        <div className="dbx-users-card">
          <div className="dbx-users-label">Utilisateurs actifs</div>
          <div className="dbx-avatars-row">
            {USERS.map((u, i) => <Avatar key={u.id} user={u} idx={i} />)}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="dbx-toolbar">
        <div className="dbx-filter-group">
          {['ALL', 'SUCCESS', 'RUNNING', 'FAILED', 'PENDING'].map((s) => (
            <button
              key={s}
              className={`dbx-filter-btn${filter.status === s ? ' active' : ''}`}
              style={filter.status === s ? { '--f-color': s === 'ALL' ? '#3b82f6' : STATUS_CONFIG[s].color } : {}}
              onClick={() => setFilter((f) => ({ ...f, status: s }))}
            >
              {s === 'ALL' ? 'Tous' : STATUS_CONFIG[s].label}
              <span className="filter-count">
                {s === 'ALL' ? runs.length : runs.filter((r) => r.status === s).length}
              </span>
            </button>
          ))}
        </div>
        <div className="dbx-toolbar-right">
          <select className="dbx-select" value={filter.user} onChange={(e) => setFilter((f) => ({ ...f, user: e.target.value }))}>
            <option value="ALL">Tous les utilisateurs</option>
            {USERS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input
            className="dbx-search"
            placeholder="Rechercher run, notebook, user..."
            value={filter.search}
            onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))}
          />
        </div>
      </div>

      {/* Table + Detail */}
      <div className={`dbx-content${selectedRun ? ' has-detail' : ''}`}>
        <div className="dbx-table-wrap">
          <table className="dbx-table">
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Notebook</th>
                <th>Cluster</th>
                <th>Utilisateur</th>
                <th>Statut</th>
                <th>Durée</th>
                <th>Démarré</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRuns.map((run) => (
                <RunRow
                  key={run.id}
                  run={run}
                  userIdx={USERS.findIndex((u) => u.id === run.user.id)}
                  onClick={() => setSelectedRun((r) => (r?.id === run.id ? null : run))}
                  isSelected={selectedRun?.id === run.id}
                />
              ))}
            </tbody>
          </table>
          {filteredRuns.length === 0 && (
            <div className="dbx-empty">Aucun run ne correspond aux filtres sélectionnés.</div>
          )}
        </div>
        {selectedRun && <RunDetailPanel run={selectedRun} onClose={() => setSelectedRun(null)} />}
      </div>

      {showLauncher && (
        <LaunchModal notebooks={app.notebooks} onClose={() => setShowLauncher(false)} onLaunch={launchRun} />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────────────────────
export default function DatabricksApp() {
  const [apps,        setApps]        = useState(INITIAL_APPS)
  const [selectedApp, setSelectedApp] = useState(null)
  const [showAddApp,  setShowAddApp]  = useState(false)

  const handleAddApp = (newApp) => {
    setApps((prev) => [...prev, newApp])
    setShowAddApp(false)
  }

  return (
    <div className="dbx">
      {selectedApp
        ? <RunMonitor app={selectedApp} onBack={() => setSelectedApp(null)} />
        : <Marketplace apps={apps} onSelect={setSelectedApp} onAddApp={() => setShowAddApp(true)} />
      }
      {showAddApp && <AddAppModal onClose={() => setShowAddApp(false)} onAdd={handleAddApp} />}
    </div>
  )
}
