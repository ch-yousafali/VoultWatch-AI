import { useState } from 'react'
import { submitReport } from '../hooks/useApi'

export default function ReportButton({ selectedPhase, onReport }) {
  const [state, setState] = useState('idle') // idle | confirming | loading | done | error
  const [reportType, setReportType] = useState(null)

  function handleClick(type) {
    if (!selectedPhase) return
    setReportType(type)
    setState('confirming')
  }

  async function handleConfirm() {
    setState('loading')
    try {
      await submitReport(selectedPhase, reportType)
      setState('done')
      onReport?.()
      setTimeout(() => setState('idle'), 2500)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }
  }

  if (!selectedPhase) {
    return (
      <div style={styles.hint}>
        Tap a phase on the map to report
      </div>
    )
  }

  if (state === 'confirming') {
    return (
      <div style={styles.confirm}>
        <p style={styles.confirmText}>
          Report <strong style={{ color: reportType === 'OUT' ? 'var(--red)' : 'var(--teal)' }}>
            {reportType === 'OUT' ? 'Power Out' : 'Power Restored'}
          </strong> for Phase {selectedPhase}?
        </p>
        <div style={styles.confirmRow}>
          <button style={styles.cancelBtn} onClick={() => setState('idle')}>Cancel</button>
          <button style={{
            ...styles.confirmBtn,
            background: reportType === 'OUT' ? 'var(--red)' : 'var(--teal)',
          }} onClick={handleConfirm}>Confirm</button>
        </div>
      </div>
    )
  }

  if (state === 'loading') {
    return <div style={styles.feedback}>Sending report...</div>
  }

  if (state === 'done') {
    return <div style={{ ...styles.feedback, color: 'var(--teal)' }}>✓ Report submitted. Thanks.</div>
  }

  if (state === 'error') {
    return <div style={{ ...styles.feedback, color: 'var(--red)' }}>Failed to submit. Try again.</div>
  }

  return (
    <div style={styles.buttons}>
      <button style={styles.outBtn} onClick={() => handleClick('OUT')}>
        ⚡ Power is Out
      </button>
      <button style={styles.backBtn} onClick={() => handleClick('BACK')}>
        ✓ Power is Back
      </button>
    </div>
  )
}

const btn = {
  border: 'none',
  borderRadius: '8px',
  padding: '12px 20px',
  fontSize: '14px',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: '0.02em',
  transition: 'opacity 0.15s',
}

const styles = {
  buttons: {
    display: 'flex',
    gap: '10px',
  },
  outBtn: {
    ...btn,
    background: 'var(--red)',
    color: '#fff',
  },
  backBtn: {
    ...btn,
    background: 'var(--teal)',
    color: '#0A0A0A',
  },
  hint: {
    color: 'var(--muted)',
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    textAlign: 'center',
    padding: '12px 0',
  },
  confirm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'center',
  },
  confirmText: {
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    color: 'var(--text)',
  },
  confirmRow: {
    display: 'flex',
    gap: '10px',
  },
  cancelBtn: {
    ...btn,
    background: 'var(--border)',
    color: 'var(--muted)',
  },
  confirmBtn: {
    ...btn,
    color: '#fff',
  },
  feedback: {
    fontFamily: 'var(--font-display)',
    fontSize: '14px',
    color: 'var(--muted)',
    padding: '12px 0',
    textAlign: 'center',
  }
}