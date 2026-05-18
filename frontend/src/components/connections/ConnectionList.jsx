import { useState } from 'react'
import { useConnections } from '../../hooks/useConnections'
import { REL_COLORS } from './ConnectionForm'

function getInitialsBg(name) {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return `hsl(${hash % 360}, 55%, 50%)`
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

  if (connections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400 mb-3">No connections yet</p>
        <button
          onClick={onAddConnection}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          + Add first connection
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {connections.map((conn) => {
        const initials = conn.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
        const badgeClass = REL_COLORS[conn.relationship_type] || REL_COLORS.other
        const isConfirming = confirmId === conn.connection_id
        const isDeleting = deleting === conn.connection_id

        return (
          <div
            key={conn.connection_id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 group transition"
          >
            {conn.photo_url ? (
              <img src={conn.photo_url} alt={conn.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: getInitialsBg(conn.name) }}
              >
                {initials}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-800 truncate">{conn.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeClass}`}>
                  {conn.relationship_type}
                </span>
              </div>
              {(conn.occupation || conn.company) && (
                <p className="text-xs text-gray-400 truncate">
                  {[conn.occupation, conn.company].filter(Boolean).join(' · ')}
                </p>
              )}
              {conn.since && (
                <p className="text-xs text-gray-400">Since {conn.since}</p>
              )}
            </div>

            <div className="flex-shrink-0">
              {isConfirming ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Remove?</span>
                  <button
                    onClick={() => handleDelete(conn.connection_id)}
                    disabled={isDeleting}
                    className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50"
                  >
                    {isDeleting ? '…' : 'Yes'}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="text-xs text-gray-500 hover:underline"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(conn.connection_id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition text-lg leading-none"
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
