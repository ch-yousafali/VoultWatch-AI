// API base URL — swap for production
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// DHA Lahore Phase centers for map markers
// Approximate lat/lng centers per phase
export const DHA_PHASES = {
  1: { center: [31.4812, 74.3798], label: 'Phase 1', area: 'Near Cavalry Ground' },
  2: { center: [31.4750, 74.3900], label: 'Phase 2', area: 'Near Lahore Cantt' },
  3: { center: [31.4680, 74.3980], label: 'Phase 3', area: 'Near Faisal Town' },
  4: { center: [31.4600, 74.4100], label: 'Phase 4', area: 'Near Phase 4 Comm' },
  5: { center: [31.4520, 74.4200], label: 'Phase 5', area: 'Main Boulevard' },
  6: { center: [31.4430, 74.4280], label: 'Phase 6', area: 'Near Expo Centre' },
  7: { center: [31.4350, 74.4400], label: 'Phase 7', area: 'Sector A-F' },
  8: { center: [31.4250, 74.4520], label: 'Phase 8', area: 'New Extension' },
}

export const STATUS_COLORS = {
  out:     '#E63946',
  on:      '#2EC4B6',
  unknown: '#444444',
}

export const STATUS_LABELS = {
  out:     'Power Out',
  on:      'Power On',
  unknown: 'No Data',
}