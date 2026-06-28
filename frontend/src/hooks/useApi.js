import { useState, useEffect, useCallback } from 'react'
import { API_BASE } from '../config'

export function useMapData(refreshInterval = 30000) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/map`)
      if (!res.ok) throw new Error('Failed to fetch map data')
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch_()
    const interval = setInterval(fetch_, refreshInterval)
    return () => clearInterval(interval)
  }, [fetch_, refreshInterval])

  return { data, loading, error, lastUpdated, refresh: fetch_ }
}

export function usePredictions(phase) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!phase) return
    setLoading(true)
    fetch(`${API_BASE}/api/predictions/${phase}`)
      .then(r => r.json())
      .then(d => setPredictions(d.predictions || []))
      .finally(() => setLoading(false))
  }, [phase])

  return { predictions, loading }
}

export function useHistory(phase, days = 7) {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!phase) return
    setLoading(true)
    fetch(`${API_BASE}/api/history/${phase}?days=${days}`)
      .then(r => r.json())
      .then(setHistory)
      .finally(() => setLoading(false))
  }, [phase, days])

  return { history, loading }
}

export async function submitReport(phase, reportType) {
  const res = await fetch(`${API_BASE}/api/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase, report_type: reportType })
  })
  if (!res.ok) throw new Error('Report failed')
  return res.json()
}