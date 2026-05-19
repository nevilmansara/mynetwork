import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePeople } from '../../hooks/usePeople'
import { CATEGORIES, getCategory } from '../../utils/graphHelpers'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function getInitials(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || '?'
}
function getInitialsBg(name = '') {
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 50%, 38%)`
}

function CardAvatar({ person }) {
  const photoUrl = person.photo_url
    ? (person.photo_url.startsWith('http') ? person.photo_url : `${API_BASE}${person.photo_url}`)
    : null
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={person.name}
        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      className="initials big"
      style={{ background: getInitialsBg(person.name), color: '#fff', borderRadius: '50%' }}
    >
      {getInitials(person.name)}
    </div>
  )
}

export default function PersonCard({ person }) {
  const navigate = useNavigate()
  const { removePerson } = usePeople()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const cat = getCategory(person.occupation)
  const catInfo = CATEGORIES[cat]
  const visibleSkills = person.skills?.slice(0, 3) || []
  const extraSkills = (person.skills?.length || 0) - visibleSkills.length

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await removePerson(person.id)
    } catch (err) {
      setDeleteError(err.response?.data?.detail || 'Delete failed')
      setConfirming(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div
        className="contact-card"
        onClick={() => navigate(`/people/${person.id}`)}
      >
        <div className="contact-card-top">
          <CardAvatar person={person}/>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span
              className="cat-pill"
              style={{ color: catInfo.color, borderColor: catInfo.color + '55' }}
            >
              {catInfo.label}
            </span>
            {person.is_self && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 999,
                background: 'var(--accent-glow)', color: 'var(--accent-2)',
                border: '1px solid oklch(0.55 0.15 285 / 0.4)',
              }}>
                You
              </span>
            )}
          </div>
        </div>

        <div className="contact-card-body">
          <div className="contact-card-name">{person.name}</div>
          {person.occupation && (
            <div className="contact-card-occ">{person.occupation}</div>
          )}
          {person.company && (
            <div className="contact-card-co">{person.company}</div>
          )}
          {visibleSkills.length > 0 && (
            <div className="chip-row tight">
              {visibleSkills.map(skill => (
                <span key={skill} className="chip">{skill}</span>
              ))}
              {extraSkills > 0 && (
                <span className="chip muted">+{extraSkills}</span>
              )}
            </div>
          )}
        </div>

        <div className="contact-card-foot">
          <span className="foot-meta">
            {person.connections_count > 0
              ? `${person.connections_count} connection${person.connections_count !== 1 ? 's' : ''}`
              : 'No connections'}
          </span>
          <div
            style={{ display: 'flex', gap: 4 }}
            onClick={e => e.stopPropagation()}
          >
            {deleteError && (
              <span style={{ fontSize: 10, color: 'var(--bad)', marginRight: 4 }}>Error</span>
            )}
            <button
              className="btn-ghost small"
              onClick={() => navigate(`/people/${person.id}/edit`)}
            >
              Edit
            </button>
            {!person.is_self && (
              confirming ? (
                <>
                  <button
                    className="btn-ghost small"
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{ color: 'var(--bad)', borderColor: 'oklch(0.70 0.18 25 / 0.4)' }}
                  >
                    {deleting ? '…' : 'Confirm'}
                  </button>
                  <button className="btn-ghost small" onClick={() => setConfirming(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className="btn-ghost small"
                  onClick={() => setConfirming(true)}
                  style={{ color: 'var(--text-mut)' }}
                >
                  Delete
                </button>
              )
            )}
          </div>
        </div>
      </div>

    </>
  )
}
