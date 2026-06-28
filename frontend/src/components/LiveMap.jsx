import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import { DHA_PHASES, STATUS_COLORS } from '../config'
import 'leaflet/dist/leaflet.css'

const DHA_CENTER = [31.455, 74.415]
const ZOOM = 13

function PulsingMarkers({ mapData, onPhaseClick }) {
  const map = useMap()

  return mapData.map(phase => {
    const config = DHA_PHASES[phase.phase]
    if (!config) return null

    const color = STATUS_COLORS[phase.status] || STATUS_COLORS.unknown
    const isOut = phase.status === 'out'

    return (
      <CircleMarker
        key={phase.phase}
        center={config.center}
        radius={isOut ? 28 : 22}
        pathOptions={{
          fillColor: color,
          fillOpacity: isOut ? 0.35 : 0.2,
          color: color,
          weight: isOut ? 3 : 1.5,
          opacity: 0.9,
        }}
        eventHandlers={{ click: () => onPhaseClick(phase.phase) }}
      >
        <Tooltip 
  permanent 
  direction="center" 
  className="phase-tooltip"
  offset={[0, 0]}
>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 600,
            fontSize: '11px',
            color: color,
            letterSpacing: '0.05em'
          }}>
            P{phase.phase}
          </span>
        </Tooltip>
      </CircleMarker>
    )
  })
}

export default function LiveMap({ mapData, selectedPhase, onPhaseClick }) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <style>{`
        .phase-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .phase-tooltip::before { display: none !important; }
        .leaflet-tooltip-pane .leaflet-tooltip { pointer-events: none; }

        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      <MapContainer
        center={DHA_CENTER}
        zoom={ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution=""
        />
        <PulsingMarkers mapData={mapData} onPhaseClick={onPhaseClick} />
      </MapContainer>
    </div>
  )
}