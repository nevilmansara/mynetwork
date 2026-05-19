import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNetworkContext } from '../context/NetworkContext'
import NetworkGraph from '../components/graph/NetworkGraph'
import PersonProfile from '../components/people/PersonProfile'
import { CATEGORIES } from '../utils/graphHelpers'

const REL_COLORS = {
  colleague: '#60A5FA', friend: '#4ADE80', family: '#C084FC', mentor: '#FBBF24', other: '#94A3B8',
}

export default function GraphPage() {
  const { graphData, people, loadGraphData, loadPeople, updatePerson } = useNetworkContext()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [showLabels, setShowLabels] = useState(true)
  const fgRef = useRef()

  const pathNodeIds = searchParams.get('highlight')
    ? searchParams.get('highlight').split(',').filter(Boolean)
    : null

  useEffect(() => {
    Promise.all([loadGraphData(), loadPeople()]).finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPerson = people.find(p => p.id === selectedPersonId) || null

  const zoomIn  = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.35, 300)
  const zoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() * 0.75, 300)
  const reset   = () => fgRef.current?.zoomToFit(400, 40)

  return (
    <>
      <div className="page-head" style={{ paddingBottom: 14 }}>
        <div>
          <div className="page-eyebrow">Graph</div>
          <h1 className="page-title">Network graph</h1>
        </div>
        <div className="page-actions">
          <button
            className="btn-ghost"
            onClick={() => setShowLabels(v => !v)}
            style={showLabels ? { borderColor: 'var(--accent)', color: 'var(--accent-2)' } : {}}
          >
            Labels {showLabels ? 'on' : 'off'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Info bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '10px 16px', borderBottom: '1px solid var(--border)',
            fontSize: 12.5, color: 'var(--text-mut)', flexShrink: 0,
          }}>
            <span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{graphData.nodes.length}</span> people
            </span>
            <span style={{ color: 'var(--border-2)' }}>·</span>
            <span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{graphData.links.length}</span> connections
            </span>
            {pathNodeIds && (
              <>
                <span style={{ color: 'var(--border-2)' }}>·</span>
                <span style={{ color: 'var(--warn)' }}>
                  Highlighting path ({pathNodeIds.length} nodes)
                </span>
              </>
            )}
          </div>

          <div className="graph-wrap" style={{ flex: 1, borderRadius: 0 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="spinner"/>
              </div>
            ) : (
              <NetworkGraph
                graphData={graphData}
                onNodeClick={(node) => setSelectedPersonId(prev => prev === node.id ? null : node.id)}
                showLabels={showLabels}
                fgRef={fgRef}
                pathNodeIds={pathNodeIds}
              />
            )}

            {/* Controls */}
            <div className="graph-controls">
              <button onClick={zoomIn} title="Zoom in">+</button>
              <button onClick={zoomOut} title="Zoom out">−</button>
              <button onClick={reset} title="Fit to screen">⊞</button>
            </div>

            {/* Legend */}
            <div className="graph-legend">
              {Object.entries(REL_COLORS).map(([type, color]) => (
                <div key={type} className="legend-item">
                  <span className="legend-dot" style={{ background: color }}/>
                  <span style={{ textTransform: 'capitalize' }}>{type}</span>
                </div>
              ))}
            </div>

            {/* Category legend */}
            <div style={{
              position: 'absolute', top: 14, left: 14,
              display: 'flex', flexWrap: 'wrap', gap: 8,
              padding: '8px 12px',
              background: 'oklch(0.16 0.012 260 / 0.85)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border)', borderRadius: 8,
              fontSize: 11.5,
            }}>
              {Object.entries(CATEGORIES).map(([key, cat]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-mid)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color, display: 'inline-block' }}/>
                  {cat.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Person profile panel */}
        {selectedPerson && (
          <div className="card" style={{ width: 320, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Details</span>
              <button className="icon-btn" onClick={() => setSelectedPersonId(null)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
              <PersonProfile person={selectedPerson} onUpdate={(updated) => updatePerson(updated.id, updated)}/>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
