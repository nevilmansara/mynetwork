import { useState } from 'react'
import { useConnections } from '../../hooks/useConnections'

const REL_COLORS = {
  colleague: '#60A5FA', friend: '#4ADE80', family: '#C084FC', mentor: '#FBBF24', other: '#94A3B8',
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}
function getInitialsBg(name) {
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 50%, 38%)`
}

export default function ConnectionList({ connections, onAddConnection, onDeleted }) {
  const { deleteConnection } = useConnections()
  const [confirmId, setConfirmId] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async (connectionId) => {
    setDeleting(connectionId)
    try {
      await deleteConnection(connectionId)
      onDeleted?.()
    } finally {
      setDeleting(null)
      setConfirmId(null)
    }
  }

  if (connections.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 8 }}>
      {connections.map(conn => {
        const color = REL_COLORS[conn.relationship_type] || REL_COLORS.other
        const isConfirming = confirmId === conn.connection_id
        const isDeleting = deleting === conn.connection_id

        return (
          <div
            key={conn.connection_id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 10px', borderRadius: 8,
              transition: 'background .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div
              className="initials"
              style={{ background: getInitialsBg(conn.name), color: '#fff', flexShrink: 0 }}
            >
              {getInitials(conn.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{conn.name}</span>
                <span style={{
                  fontSize: 10, padding: '1px 6px', borderRadius: 4,
                  background: color + '22', color, border: `1px solid ${color}44`,
                  fontWeight: 500,
                }}>
                  {conn.relationship_type}
                </span>
              </div>
              {(conn.occupation || conn.company) && (
                <div style={{ fontSize: 11.5, color: 'var(--text-mut)' }}>
                  {[conn.occupation, conn.company].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            <div style={{ flexShrink: 0 }}>
              {isConfirming ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-mut)' }}>Remove?</span>
                  <button
                    onClick={() => handleDelete(conn.connection_id)}
                    disabled={isDeleting}
                    style={{ fontSize: 11, color: 'var(--bad)', fontWeight: 500, border: 0, background: 'transparent', padding: 0 }}
                  >
                    {isDeleting ? '…' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    style={{ fontSize: 11, color: 'var(--text-mut)', border: 0, background: 'transparent', padding: 0 }}
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(conn.connection_id)}
                  style={{
                    border: 0, background: 'transparent', color: 'var(--text-dim)',
                    fontSize: 16, padding: '0 4px', lineHeight: 1,
                  }}
                  title="Remove connection"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
