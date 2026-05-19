import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { peopleService } from '../services/peopleService'
import { useConnections } from '../hooks/useConnections'
import { useNetworkContext } from '../context/NetworkContext'
import ConnectionForm from '../components/connections/ConnectionForm'
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

// ── Single connection row ─────────────────────────────────────────────────────
function ConnRow({ conn, onDelete, onNavigate }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [hover, setHover] = useState(false)
  const color = REL_COLORS[conn.relationship_type] || REL_COLORS.other
  const photoUrl = conn.photo_url
    ? (conn.photo_url.startsWith('http') ? conn.photo_url : `${API_BASE}${conn.photo_url}`)
    : null

  const handleDelete = async () => {
    setDeleting(true)
    try { await onDelete(conn.connection_id) }
    finally { setDeleting(false); setConfirming(false) }
  }

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 10,
        background: hover ? 'var(--surface-2)' : 'transparent',
        transition: 'background .12s', cursor: 'pointer',
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setConfirming(false) }}
    >
      {/* Avatar — click navigates */}
      <div onClick={() => onNavigate(conn.id)} style={{ flexShrink: 0 }}>
        {photoUrl ? (
          <img src={photoUrl} alt={conn.name}
            style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: getInitialsBg(conn.name),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14,
          }}>
            {getInitials(conn.name)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }} onClick={() => onNavigate(conn.id)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{conn.name}</span>
          <span style={{
            fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 999,
            background: color + '22', color, border: `1px solid ${color}44`,
          }}>
            {conn.relationship_type}
          </span>
        </div>
        {(conn.occupation || conn.company) && (
          <div style={{ fontSize: 12, color: 'var(--text-mut)', marginTop: 2 }}>
            {[conn.occupation, conn.company].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        {confirming ? (
          <>
            <span style={{ fontSize: 11.5, color: 'var(--text-mut)' }}>Remove?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                fontSize: 11.5, fontWeight: 600, color: 'var(--bad)',
                border: 0, background: 'transparent', padding: '2px 4px',
              }}
            >
              {deleting ? '…' : 'Yes'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{ fontSize: 11.5, color: 'var(--text-mut)', border: 0, background: 'transparent', padding: '2px 4px' }}
            >
              No
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onNavigate(conn.id)}
              className="icon-btn"
              title="View profile"
              style={{ opacity: hover ? 1 : 0, transition: 'opacity .12s' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="icon-btn"
              title="Remove connection"
              style={{ opacity: hover ? 1 : 0, transition: 'opacity .12s', color: 'var(--text-dim)' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PersonDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { deleteConnection } = useConnections()
  const { people } = useNetworkContext()
  const fgRef = useRef()

  const [person, setPerson] = useState(null)
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddConn, setShowAddConn] = useState(false)

  const loadData = async () => {
    try {
      const [personRes, connRes] = await Promise.all([
        peopleService.getById(id),
        peopleService.getConnections(id),
      ])
      setPerson(personRes.data)
      setConnections(connRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Person not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build ego-network graph from this person + their connections
  const egoGraph = useMemo(() => {
    if (!person) return { nodes: [], links: [] }
    const center = {
      id: person.id, name: person.name,
      occupation: person.occupation,
      photo_url: person.photo_url,
      val: Math.max(2, connections.length),
      is_self: person.is_self,
    }
    const connNodes = connections.map(c => ({
      id: c.id, name: c.name,
      occupation: c.occupation,
      photo_url: c.photo_url,
      val: 1,
    }))
    const links = connections.map(c => ({
      source: person.id, target: c.id, type: c.relationship_type,
    }))
    return { nodes: [center, ...connNodes], links }
  }, [person, connections])

  const handleDeleteConnection = async (connectionId) => {
    await deleteConnection(connectionId)
    setConnections(prev => prev.filter(c => c.connection_id !== connectionId))
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <div className="spinner" style={{ width: 28, height: 28 }}/>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <button className="btn-ghost small" style={{ marginBottom: 20 }} onClick={() => navigate('/people')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Contacts
        </button>
        <div style={{ padding: '12px 16px', borderRadius: 8, fontSize: 13, color: 'var(--bad)', background: 'oklch(0.70 0.18 25 / 0.12)', border: '1px solid oklch(0.70 0.18 25 / 0.35)' }}>
          {error}
        </div>
      </div>
    )
  }

  if (!person) return null

  const cat = getCategory(person.occupation)
  const catInfo = CATEGORIES[cat]
  const photoUrl = person.photo_url
    ? (person.photo_url.startsWith('http') ? person.photo_url : `${API_BASE}${person.photo_url}`)
    : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Back + actions bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, flexShrink: 0 }}>
        <button className="btn-ghost small" onClick={() => navigate('/people')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Contacts
        </button>
        <button className="btn-ghost small" onClick={() => navigate(`/people/${id}/edit`)}>
          Edit
        </button>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 20, flex: 1, minHeight: 0, alignItems: 'flex-start' }}>

        {/* ── Left: person info + connections ────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Person header card */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {photoUrl ? (
                <img src={photoUrl} alt={person.name}
                  style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', flexShrink: 0 }}
                />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: 16, flexShrink: 0,
                  background: getInitialsBg(person.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 800, fontSize: 24,
                }}>
                  {getInitials(person.name)}
                </div>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span className="cat-pill" style={{ color: catInfo.color, borderColor: catInfo.color + '55' }}>
                    {catInfo.label}
                  </span>
                  {person.is_self && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
                      background: 'var(--accent-glow)', color: 'var(--accent-2)',
                      border: '1px solid oklch(0.55 0.15 285 / 0.4)',
                    }}>You</span>
                  )}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', lineHeight: 1.15, marginBottom: 4 }}>
                  {person.name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-mid)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {person.occupation && <span>{person.occupation}</span>}
                  {person.occupation && person.company && <span style={{ color: 'var(--text-dim)' }}>·</span>}
                  {person.company && <span style={{ color: 'var(--text-mut)' }}>@ {person.company}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          {person.skills?.length > 0 && (
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 10 }}>
                Skills
              </div>
              <div className="chip-row">
                {person.skills.map(s => <span key={s} className="chip">{s}</span>)}
              </div>
            </div>
          )}

          {/* Contact + Notes */}
          {(person.email || person.phone || person.location || person.notes) && (
            <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(person.email || person.phone || person.location) && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 10 }}>
                    Contact
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {person.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--text-mid)' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-dim)', flexShrink: 0 }}>
                          <rect x="2" y="4" width="20" height="16" rx="2"/><polyline points="2,4 12,13 22,4"/>
                        </svg>
                        {person.email}
                      </div>
                    )}
                    {person.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--text-mid)' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-dim)', width: 13, textAlign: 'center' }}>#</span>
                        {person.phone}
                      </div>
                    )}
                    {person.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: 'var(--text-mid)' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-dim)', width: 13, textAlign: 'center' }}>⌖</span>
                        {person.location}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {person.notes && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
                    Notes
                  </div>
                  <div style={{
                    fontSize: 13, color: 'var(--text-mid)', lineHeight: 1.65,
                    background: 'var(--surface-2)', borderRadius: 8,
                    padding: '10px 12px', border: '1px solid var(--border)',
                  }}>
                    {person.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Connections list */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                Connections ({connections.length})
              </div>
              <button className="btn-ghost small" onClick={() => setShowAddConn(true)}>
                + Add
              </button>
            </div>

            {connections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 16px' }}>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>No connections yet</div>
                <button className="btn-ghost small" onClick={() => setShowAddConn(true)}>Add first connection</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {connections.map(conn => (
                  <ConnRow
                    key={conn.connection_id}
                    conn={conn}
                    onDelete={handleDeleteConnection}
                    onNavigate={(pid) => navigate(`/people/${pid}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: ego-network graph ────────────────────────────────── */}
        <div style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Graph header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 18px', borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Connections network</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2 }}>
                  {connections.length} direct connection{connections.length !== 1 ? 's' : ''}
                </div>
              </div>
              <button
                className="btn-ghost small"
                onClick={() => navigate(`/graph?highlight=${egoGraph.nodes.map(n => n.id).join(',')}`)}
              >
                Full graph →
              </button>
            </div>

            {/* Mini graph */}
            <div style={{ height: 320, background: '#090b10', position: 'relative' }}>
              {egoGraph.nodes.length <= 1 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', height: '100%', gap: 8,
                }}>
                  <div style={{ fontSize: 28, color: 'var(--text-dim)' }}>○</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-dim)' }}>No connections to visualize</div>
                </div>
              ) : (
                <NetworkGraph
                  graphData={egoGraph}
                  onNodeClick={(node) => { if (node.id !== person.id) navigate(`/people/${node.id}`) }}
                  showLabels={true}
                  fgRef={fgRef}
                  pathNodeIds={null}
                />
              )}
            </div>

            {/* Relationship legend */}
            {connections.length > 0 && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 10, padding: '12px 16px',
                borderTop: '1px solid var(--border)',
              }}>
                {[...new Set(connections.map(c => c.relationship_type))].map(type => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-mut)' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: REL_COLORS[type] || REL_COLORS.other, display: 'inline-block' }}/>
                    <span style={{ textTransform: 'capitalize' }}>{type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="card" style={{ padding: '14px 18px', display: 'flex', gap: 0 }}>
            {[
              { label: 'Connections', value: connections.length },
              { label: 'Skills', value: person.skills?.length ?? 0 },
              { label: 'Category', value: catInfo.label },
            ].map((item, i) => (
              <div key={item.label} style={{
                flex: 1, textAlign: 'center',
                borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                padding: '4px 0',
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: i === 2 ? catInfo.color : 'var(--text)' }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add connection modal */}
      {showAddConn && (
        <ConnectionForm
          person={person}
          people={people}
          existingConnections={connections}
          onClose={() => setShowAddConn(false)}
          onSuccess={() => {
            setShowAddConn(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}
