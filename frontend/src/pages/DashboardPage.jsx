import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { useNetworkContext } from '../context/NetworkContext'
import { dashboardService } from '../services/dashboardService'
import { peopleService } from '../services/peopleService'
import NetworkGraph from '../components/graph/NetworkGraph'
import { CATEGORIES, getCategory } from '../utils/graphHelpers'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const REL_COLORS = {
  colleague: '#60A5FA', friend: '#4ADE80', family: '#C084FC', mentor: '#FBBF24', other: '#94A3B8',
}

function getInitials(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || '?'
}
function getInitialsBg(name = '') {
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 50%, 38%)`
}

// ── Compact node detail panel ─────────────────────────────────────────────────
function NodeDetailPanel({ person, onClose }) {
  const navigate = useNavigate()
  const [connections, setConnections] = useState([])

  useEffect(() => {
    if (!person) return
    peopleService.getConnections(person.id)
      .then(r => setConnections(r.data))
      .catch(() => setConnections([]))
  }, [person?.id])

  if (!person) return null

  const cat = getCategory(person.occupation)
  const catInfo = CATEGORIES[cat]
  const photoUrl = person.photo_url
    ? (person.photo_url.startsWith('http') ? person.photo_url : `${API_BASE}${person.photo_url}`)
    : null

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden', flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '16px 16px 14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {photoUrl ? (
            <img src={photoUrl} alt={person.name}
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: getInitialsBg(person.name),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 17,
            }}>
              {getInitials(person.name)}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', lineHeight: 1.2 }}>
              {person.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <span className="cat-pill small" style={{ color: catInfo.color, borderColor: catInfo.color + '55' }}>
                {catInfo.label}
              </span>
              {person.occupation && (
                <span style={{ fontSize: 12, color: 'var(--text-mut)' }}>{person.occupation}</span>
              )}
            </div>
            {person.company && (
              <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 3 }}>@ {person.company}</div>
            )}
          </div>
        </div>
        <button className="icon-btn" onClick={onClose} style={{ marginLeft: 4, flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div style={{ borderTop: '1px solid var(--border)' }}/>

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Skills */}
        {person.skills?.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 7 }}>
              Skills
            </div>
            <div className="chip-row tight">
              {person.skills.map(s => <span key={s} className="chip">{s}</span>)}
            </div>
          </div>
        )}

        {/* Contact */}
        {(person.email || person.phone || person.location) && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 7 }}>
              Contact
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {person.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-mid)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--text-dim)' }}>
                    <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
                  </svg>
                  {person.email}
                </div>
              )}
              {person.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-mid)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>#</span>
                  {person.phone}
                </div>
              )}
              {person.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--text-mid)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>⌖</span>
                  {person.location}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {person.notes && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 7 }}>
              Notes
            </div>
            <div style={{
              fontSize: 12.5, color: 'var(--text-mid)', lineHeight: 1.55,
              background: 'var(--surface-2)', borderRadius: 8, padding: '8px 10px',
              border: '1px solid var(--border)',
            }}>
              {person.notes}
            </div>
          </div>
        )}

        {/* Connections */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 7 }}>
            Connections ({connections.length})
          </div>
          {connections.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {connections.map(c => (
                <span key={c.connection_id} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 9px', borderRadius: 999, fontSize: 12,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  color: 'var(--text-mid)',
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: REL_COLORS[c.relationship_type] || REL_COLORS.other,
                  }}/>
                  {c.name}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No connections</div>
          )}
        </div>

        {/* Edit details button */}
        <button
          className="btn-ghost"
          style={{ width: '100%', justifyContent: 'center', marginTop: 2 }}
          onClick={() => navigate(`/people/${person.id}/edit`)}
        >
          Edit details
        </button>
      </div>
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthContext()
  const { graphData, people, loadGraphData, loadPeople } = useNetworkContext()
  const navigate = useNavigate()
  const fgRef = useRef()

  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPersonId, setSelectedPersonId] = useState(null)
  const [showLabels, setShowLabels] = useState(true)

  const selectedPerson = people.find(p => p.id === selectedPersonId) || null

  useEffect(() => {
    Promise.all([
      loadGraphData(),
      loadPeople(),
      dashboardService.getStats().then(r => setStats(r.data)).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const catCounts = {}
  people.forEach(p => {
    if (p.is_self) return
    const cat = getCategory(p.occupation)
    catCounts[cat] = (catCounts[cat] || 0) + 1
  })
  const maxCat = Math.max(1, ...Object.values(catCounts))

  const handleZoomIn  = () => fgRef.current?.zoom(fgRef.current.zoom() * 1.35, 300)
  const handleZoomOut = () => fgRef.current?.zoom(fgRef.current.zoom() * 0.75, 300)
  const handleReset   = () => fgRef.current?.zoomToFit(400, 40)

  const handleNodeClick = (node) => {
    setSelectedPersonId(prev => prev === node.id ? null : node.id)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Dashboard</div>
          <h1 className="page-title">{greeting}, {firstName}</h1>
          <p className="page-sub">Here's what's happening in your network</p>
        </div>
        <div className="page-actions">
          <button className="btn-ghost" onClick={() => navigate('/search')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search
          </button>
          <button className="btn-primary" onClick={() => navigate('/people/new')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add person
          </button>
        </div>
      </div>

      <div className="dash-grid">
        {/* Left — graph */}
        <div className="card graph-card">
          <div className="card-head">
            <div>
              <div className="card-title">Network graph</div>
              <div className="card-sub">
                {loading ? '…' : `${graphData.nodes.length} people · ${graphData.links.length} connections`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="btn-ghost small"
                onClick={() => setShowLabels(v => !v)}
                style={showLabels ? { borderColor: 'var(--accent)', color: 'var(--accent-2)' } : {}}
              >
                Labels {showLabels ? 'on' : 'off'}
              </button>
              <button className="btn-ghost small" onClick={() => navigate('/graph')}>
                Full view →
              </button>
            </div>
          </div>
          <div className="graph-wrap" style={{ minHeight: 480, flex: 1 }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div className="spinner"/>
              </div>
            ) : (
              <NetworkGraph
                graphData={graphData}
                onNodeClick={handleNodeClick}
                showLabels={showLabels}
                fgRef={fgRef}
                pathNodeIds={null}
              />
            )}
            <div className="graph-controls">
              <button onClick={handleZoomIn} title="Zoom in">+</button>
              <button onClick={handleZoomOut} title="Zoom out">−</button>
              <button onClick={handleReset} title="Fit">⊞</button>
            </div>
            <div className="graph-legend">
              {Object.entries(REL_COLORS).map(([type, color]) => (
                <div key={type} className="legend-item">
                  <span className="legend-dot" style={{ background: color }}/>
                  <span style={{ textTransform: 'capitalize' }}>{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — stats sidebar */}
        <div className="side-stats">
          {/* Node detail panel — shown when a node is clicked */}
          {selectedPerson && (
            <NodeDetailPanel
              person={selectedPerson}
              onClose={() => setSelectedPersonId(null)}
            />
          )}

          {/* Stats card */}
          <div className="card stat-card">
            <div className="card-head">
              <div className="card-title">Network stats</div>
            </div>
            <div className="stat-row">
              <span className="stat-label">Total contacts</span>
              <span className="stat-val">{loading ? '—' : (stats?.total_people ?? 0)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Connections</span>
              <span className="stat-val">{loading ? '—' : (stats?.total_connections ?? 0)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Most connected</span>
              <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 14, fontWeight: 600 }}>
                {loading ? '—' : (stats?.most_connected?.name ?? 'None')}
              </span>
            </div>
          </div>

          {/* Category breakdown */}
          <div className="card cat-card">
            <div className="card-head" style={{ borderBottom: 0, padding: '16px 18px 8px' }}>
              <div className="card-title">By category</div>
            </div>
            <div className="cat-list">
              {Object.entries(CATEGORIES).map(([key, cat]) => {
                const count = catCounts[key] || 0
                return (
                  <div key={key}>
                    <div className="cat-row-head">
                      <div className="cat-row-label">
                        <span className="legend-dot" style={{ background: cat.color }}/>
                        {cat.label}
                      </div>
                      <span className="cat-row-count">{count}</span>
                    </div>
                    <div className="cat-bar">
                      <div
                        className="cat-bar-fill"
                        style={{ width: `${(count / maxCat) * 100}%`, background: cat.color }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recently added */}
          <div className="card recent-card">
            <div className="card-head" style={{ borderBottom: 0, padding: '16px 18px 4px' }}>
              <div className="card-title">Recently added</div>
              <button className="link-btn" onClick={() => navigate('/people')}>View all</button>
            </div>
            <div className="recent-list">
              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} style={{
                    height: 44, margin: '2px 2px', borderRadius: 8,
                    background: 'var(--surface-2)', animation: 'pulse 1.5s infinite',
                  }}/>
                ))
              ) : stats?.recent_people?.length > 0 ? (
                stats.recent_people.map(p => (
                  <button
                    key={p.id}
                    className={`recent-row${selectedPersonId === p.id ? ' active' : ''}`}
                    onClick={() => setSelectedPersonId(prev => prev === p.id ? null : p.id)}
                  >
                    <div
                      className="initials"
                      style={{ background: getInitialsBg(p.name), color: '#fff' }}
                    >
                      {getInitials(p.name)}
                    </div>
                    <div className="recent-meta">
                      <div className="recent-name">{p.name}</div>
                      <div className="recent-sub">
                        {[p.occupation, p.company].filter(Boolean).join(' · ') || 'No details'}
                      </div>
                    </div>
                    <svg className="recent-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                ))
              ) : (
                <div className="empty-state small">
                  <div className="empty-sub">No contacts yet</div>
                  <button
                    className="link-btn"
                    style={{ marginTop: 6 }}
                    onClick={() => navigate('/people/new')}
                  >
                    Add your first contact
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Top skills */}
          {stats?.top_skills?.length > 0 && (
            <div className="card" style={{ padding: '14px 18px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Top skills</div>
              <div className="chip-row">
                {stats.top_skills.map(({ skill }) => (
                  <button
                    key={skill}
                    className="pop"
                    onClick={() => navigate(`/search?q=${encodeURIComponent(skill)}`)}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
