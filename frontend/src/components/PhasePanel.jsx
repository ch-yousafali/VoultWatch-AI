import { usePredictions, useHistory } from '../hooks/useApi'
import { DHA_PHASES, STATUS_COLORS, STATUS_LABELS } from '../config'
import ReportButton from './ReportButton'

function formatHour(h) {
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:00 ${ampm}`
}

function ConfidenceBadge({ score }) {
  const pct = Math.round(score * 100)
  const color = pct >= 75 ? 'var(--red)' : pct >= 50 ? 'var(--amber)' : 'var(--muted)'
  return (
    <span style={{
      fontSize: '11px',
      fontFamily: 'var(--font-display)',
      fontWeight: 600,
      color,
      background: pct >= 75 ? 'var(--red-dim)' : pct >= 50 ? 'var(--amber-dim)' : '#1a1a1a',
      padding: '2px 7px',
      borderRadius: '4px',
      letterSpacing: '0.04em',
    }}>
      {pct}%
    </span>
  )
}

export default function PhasePanel({ phase, phaseData, onClose, onReport }) {
  const config = DHA_PHASES[phase]
  const { predictions } = usePredictions(phase)
  const { history } = useHistory(phase, 7)

  if (!config || !phaseData) return null

  const statusColor = STATUS_COLORS[phaseData.status] || STATUS_COLORS.unknown
  const statusLabel = STATUS_LABELS[phaseData.status] || 'No Data'
  const upcoming = predictions.filter(p => p.is_upcoming)

  return (
    <div style={styles.panel}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.phaseLabel}>{config.label}</div>
          <div style={styles.areaLabel}>{config.area}</div>
        </div>
        <div style={styles.headerRight}>
          <span style={{ ...styles.statusBadge, color: statusColor, borderColor: statusColor, background: `${statusColor}18` }}>
            {statusLabel}
          </span>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Predictions */}
      {upcoming.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>PREDICTED OUTAGES TODAY</div>
          <div style={styles.predList}>
            {upcoming.slice(0, 3).map((p, i) => (
              <div key={i} style={styles.predRow}>
                <span style={styles.predTime}>{formatHour(p.predicted_hour)}</span>
                <div style={styles.predRight}>
                  {p.estimated_duration_hours && (
                    <span style={styles.duration}>~{p.estimated_duration_hours}h</span>
                  )}
                  <ConfidenceBadge score={p.confidence_score} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      {history && (
        <div style={styles.section}>
          <div style={styles.sectionLabel}>LAST 7 DAYS</div>
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <div style={styles.statNum}>{history.total_outages}</div>
              <div style={styles.statLabel}>outages</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNum}>{history.avg_outages_per_day}</div>
              <div style={styles.statLabel}>per day</div>
            </div>
            <div style={styles.stat}>
              <div style={styles.statNum}>{history.avg_duration_hours ?? '—'}h</div>
              <div style={styles.statLabel}>avg duration</div>
            </div>
          </div>

          {history.worst_hours?.length > 0 && (
            <div style={styles.worstHours}>
              <span style={styles.worstLabel}>Worst times: </span>
              {history.worst_hours.map((h, i) => (
                <span key={i} style={styles.worstHour}>
                  {formatHour(h.hour)}{i < history.worst_hours.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={styles.divider} />

      {/* Report */}
      <div style={styles.reportSection}>
        <ReportButton selectedPhase={phase} onReport={onReport} />
      </div>
    </div>
  )
}

const styles = {
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    borderRadius: '16px 16px 0 0',
    padding: '20px 20px 28px',
    zIndex: 1000,
    animation: 'slideUp 0.2s ease-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0',
  },
  phaseLabel: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '18px',
    color: 'var(--text)',
    letterSpacing: '-0.01em',
  },
  areaLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    color: 'var(--muted)',
    marginTop: '2px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  statusBadge: {
    fontSize: '11px',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    padding: '4px 10px',
    borderRadius: '20px',
    border: '1px solid',
    letterSpacing: '0.05em',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--muted)',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
    lineHeight: 1,
  },
  divider: {
    height: '1px',
    background: 'var(--border)',
    margin: '14px 0',
  },
  section: {
    marginBottom: '14px',
  },
  sectionLabel: {
    fontFamily: 'var(--font-display)',
    fontSize: '10px',
    fontWeight: 600,
    color: 'var(--muted)',
    letterSpacing: '0.1em',
    marginBottom: '10px',
  },
  predList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  predRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  predTime: {
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    fontSize: '14px',
    color: 'var(--text)',
  },
  predRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  duration: {
    fontFamily: 'var(--font-body)',
    fontSize: '12px',
    color: 'var(--muted)',
  },
  statsRow: {
    display: 'flex',
    gap: '0',
  },
  stat: {
    flex: 1,
    textAlign: 'center',
  },
  statNum: {
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: '22px',
    color: 'var(--text)',
  },
  statLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '11px',
    color: 'var(--muted)',
    marginTop: '2px',
  },
  worstHours: {
    marginTop: '10px',
    fontSize: '12px',
    fontFamily: 'var(--font-body)',
    color: 'var(--muted)',
  },
  worstLabel: {
    color: 'var(--muted)',
  },
  worstHour: {
    color: 'var(--amber)',
  },
  reportSection: {
    display: 'flex',
    justifyContent: 'center',
  }
}