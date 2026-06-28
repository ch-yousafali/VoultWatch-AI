import { STATUS_COLORS } from '../config'

export default function Legend({ mapData }) {
  const counts = { out: 0, on: 0, unknown: 0 }
  mapData.forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1 })

  return (
    <div style={styles.legend}>
      <div style={styles.row}>
        <span style={{ ...styles.dot, background: STATUS_COLORS.out }} />
        <span style={styles.label}>Power Out ({counts.out})</span>
      </div>
      <div style={styles.row}>
        <span style={{ ...styles.dot, background: STATUS_COLORS.on }} />
        <span style={styles.label}>Power On ({counts.on})</span>
      </div>
      <div style={styles.row}>
        <span style={{ ...styles.dot, background: '#444' }} />
        <span style={styles.label}>No Data ({counts.unknown})</span>
      </div>
    </div>
  )
}

const styles = {
  legend: {
    position: 'absolute',
    bottom: 80,
    left: 14,
    zIndex: 999,
    background: 'rgba(14,14,14,0.88)',
    border: '1px solid #222',
    borderRadius: '10px',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '7px',
    backdropFilter: 'blur(8px)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
    flexShrink: 0,
  },
  label: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '11px',
    color: '#999',
  }
}