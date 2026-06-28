import { useState } from 'react'
import { useMapData } from './hooks/useApi'
import LiveMap from './components/LiveMap'
import PhasePanel from './components/PhasePanel'
import Header from './components/Header'
import Legend from './components/Legend'

export default function App() {
  const { data: mapData, loading, lastUpdated, refresh } = useMapData(30000)
  const [selectedPhase, setSelectedPhase] = useState(null)

  const selectedPhaseData = mapData.find(p => p.phase === selectedPhase)
  const outageCount = mapData.filter(p => p.status === 'out').length

  function handlePhaseClick(phase) {
    setSelectedPhase(prev => prev === phase ? null : phase)
  }

  return (
    <div style={{ position: 'relative', height: '100vh', width: '100vw', overflow: 'hidden', background: '#0A0A0A' }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>

      {!loading && (
        <LiveMap
          mapData={mapData}
          selectedPhase={selectedPhase}
          onPhaseClick={handlePhaseClick}
        />
      )}

      {loading && (
        <div style={styles.loading}>
          <span style={styles.loadingIcon}>⚡</span>
          <span style={styles.loadingText}>Loading VoltWatch...</span>
        </div>
      )}

      <Header lastUpdated={lastUpdated} outageCount={outageCount} />

      {!loading && mapData.length > 0 && (
        <Legend mapData={mapData} />
      )}

      {selectedPhase && (
        <PhasePanel
          phase={selectedPhase}
          phaseData={selectedPhaseData}
          onClose={() => setSelectedPhase(null)}
          onReport={refresh}
        />
      )}

      {!selectedPhase && !loading && (
        <div style={styles.hint}>
          Tap any phase to view status and report
        </div>
      )}
    </div>
  )
}

const styles = {
  loading: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    background: '#0A0A0A',
    zIndex: 2000,
  },
  loadingIcon: {
    fontSize: '32px',
    animation: 'blink 1s ease-in-out infinite',
  },
  loadingText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '14px',
    color: '#666',
    letterSpacing: '0.05em',
  },
  hint: {
    position: 'absolute',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontFamily: "'Inter', sans-serif",
    fontSize: '12px',
    color: '#555',
    background: 'rgba(14,14,14,0.85)',
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid #222',
    whiteSpace: 'nowrap',
    zIndex: 999,
    backdropFilter: 'blur(8px)',
  }
}