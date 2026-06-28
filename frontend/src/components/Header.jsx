export default function Header({ lastUpdated, outageCount }) {
  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
    : '--:--'

  return (
    <div style={styles.header}>
      <div style={styles.logo}>
        <span style={styles.logoIcon}>⚡</span>
        <span style={styles.logoText}>VoltWatch</span>
        <span style={styles.logoSub}>DHA Lahore</span>
      </div>

      <div style={styles.right}>
        {outageCount > 0 && (
          <div style={styles.alertBadge}>
            <span style={styles.alertDot} />
            {outageCount} out
          </div>
        )}
        <div style={styles.updated}>
          <span style={styles.liveDot} />
          {timeStr}
        </div>
      </div>
    </div>
  )
}

const styles = {
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 18px',
    background: 'linear-gradient(to bottom, rgba(10,10,10,0.95) 0%, transparent 100%)',
    pointerEvents: 'none',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    fontSize: '18px',
  },
  logoText: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '17px',
    color: '#F0F0F0',
    letterSpacing: '-0.02em',
  },
  logoSub: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: '11px',
    color: '#666',
    letterSpacing: '0.05em',
    fontWeight: 500,
    marginTop: '1px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  alertBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(230,57,70,0.15)',
    border: '1px solid rgba(230,57,70,0.4)',
    borderRadius: '20px',
    padding: '3px 10px',
    fontSize: '11px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
    color: '#E63946',
    letterSpacing: '0.04em',
  },
  alertDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#E63946',
    animation: 'blink 1s ease-in-out infinite',
    display: 'inline-block',
  },
  updated: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '11px',
    fontFamily: "'Inter', sans-serif",
    color: '#666',
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#2EC4B6',
    display: 'inline-block',
  },
}