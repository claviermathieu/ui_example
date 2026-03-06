import { useState } from 'react'
import StatLab from './StatLab.jsx'
import DatabricksApp from './DatabricksApp.jsx'

const TABS = [
  { id: 'statlab',    label: 'StatLab',         icon: '∑' },
  { id: 'databricks', label: 'Databricks Runs',  icon: '◈' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('statlab')

  return (
    <div className="app">
      <nav className="global-nav">
        <div className="global-nav-brand">
          <span className="global-brand-icon">⬡</span>
          Plateforme Data
        </div>
        <div className="global-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`global-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="global-tab-icon">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {activeTab === 'statlab' ? <StatLab /> : <DatabricksApp />}
    </div>
  )
}
