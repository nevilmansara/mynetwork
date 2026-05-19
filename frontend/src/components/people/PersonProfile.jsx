import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ConnectionForm from '../connections/ConnectionForm'
import ConnectionList from '../connections/ConnectionList'
import { useNetworkContext } from '../../context/NetworkContext'
import { peopleService } from '../../services/peopleService'
import { CATEGORIES, getCategory } from '../../utils/graphHelpers'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function PersonAvatar({ person, size = 56 }) {
  const photoUrl = person.photo_url
    ? (person.photo_url.startsWith('http') ? person.photo_url : `${API_BASE}${person.photo_url}`)
    : null
  const initials = (person.name || '').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || '?'
  const hue = (person.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const r = Math.round(size * 0.36)

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={person.name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: `hsl(${hue}, 50%, 38%)`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: '#fff', fontWeight: 700,
      fontSize: r, letterSpacing: '0.02em',
    }}>
      {initials}
    </div>
  )
}

const LINK_COLORS = {
  colleague: '#60A5FA', friend: '#4ADE80', family: '#C084FC', mentor: '#FBBF24', other: '#94A3B8',
}

function getInitials(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || '?'
}
function getInitialsBg(name = '') {
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 50%, 38%)`
}

export default function PersonProfile({ person, onUpdate }) {
  const navigate = useNavigate()
  const { people } = useNetworkContext()
  const [showAddConn, setShowAddConn] = useState(false)
  const [personConnections, setPersonConnections] = useState([])

  const cat = getCategory(person.occupation)
  const catInfo = CATEGORIES[cat]

  const loadPersonConnections = async () => {
    try {
      const res = await peopleService.getConnections(person.id)
      setPersonConnections(res.data)
    } catch {
      setPersonConnections([])
    }
  }

  useEffect(() => {
    loadPersonConnections()
  }, [person.id]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="card person-card">
        <div className="person-card-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PersonAvatar person={person} size={56}/>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="cat-pill small"
                  style={{ color: catInfo.color, borderColor: catInfo.color + '55' }}
                >
                  {catInfo.label}
                </span>
                {person.is_self && (
                  <span style={{
                    fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                    background: 'var(--accent-glow)', color: 'var(--accent-2)',
                  }}>You</span>
                )}
              </div>
              <div className="person-name">{person.name}</div>
              <div className="person-meta">
                {person.occupation && <span className="person-occ">{person.occupation}</span>}
              </div>
              {person.company && <div className="person-company">{person.company}</div>}
            </div>
          </div>
          <button className="btn-ghost small" onClick={() => navigate(`/people/${person.id}/edit`)}>
            Edit
          </button>
        </div>

        <div className="person-card-body">
          {/* Skills */}
          {person.skills?.length > 0 && (
            <>
              <div className="person-section-label">Skills</div>
              <div className="chip-row">
                {person.skills.map(skill => (
                  <span key={skill} className="chip">{skill}</span>
                ))}
              </div>
            </>
          )}

          {/* Contact info */}
          {(person.email || person.phone || person.location) && (
            <>
              <div className="person-section-label">Contact</div>
              <div className="contact-list">
                {person.email && (
                  <div className="contact-row">
                    <span>@</span>
                    <span style={{ color: 'var(--text-mid)' }}>{person.email}</span>
                  </div>
                )}
                {person.phone && (
                  <div className="contact-row">
                    <span>#</span>
                    <span style={{ color: 'var(--text-mid)' }}>{person.phone}</span>
                  </div>
                )}
                {person.location && (
                  <div className="contact-row">
                    <span>⌖</span>
                    <span style={{ color: 'var(--text-mid)' }}>{person.location}</span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Notes */}
          {person.notes && (
            <>
              <div className="person-section-label">Notes</div>
              <div className="person-notes">{person.notes}</div>
            </>
          )}

          {/* Connections */}
          <div className="person-section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Connections ({personConnections.length})</span>
            <button className="link-btn" onClick={() => setShowAddConn(true)}>+ Add</button>
          </div>
          {personConnections.length > 0 ? (
            <div className="connection-pills">
              {personConnections.map(conn => (
                <span key={conn.connection_id} className="conn-pill">
                  <span className="conn-dot" style={{ background: LINK_COLORS[conn.relationship_type] || LINK_COLORS.other }}/>
                  {conn.name}
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>No connections yet</div>
          )}

          <div className="person-card-actions">
            <ConnectionList
              connections={personConnections}
              onAddConnection={() => setShowAddConn(true)}
              onDeleted={loadPersonConnections}
            />
          </div>
        </div>
      </div>

      {showAddConn && (
        <ConnectionForm
          person={person}
          people={people}
          existingConnections={personConnections}
          onClose={() => setShowAddConn(false)}
          onSuccess={loadPersonConnections}
        />
      )}
    </>
  )
}
