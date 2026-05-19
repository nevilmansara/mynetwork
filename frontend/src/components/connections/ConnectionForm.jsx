import { useState, useEffect } from 'react'
import { useConnections } from '../../hooks/useConnections'

const RELATIONSHIP_TYPES = [
  { value: 'colleague', label: 'Colleague', color: '#60A5FA' },
  { value: 'friend',    label: 'Friend',    color: '#4ADE80' },
  { value: 'family',    label: 'Family',    color: '#C084FC' },
  { value: 'mentor',    label: 'Mentor',    color: '#FBBF24' },
  { value: 'other',     label: 'Other',     color: '#94A3B8' },
]

export const REL_COLORS = {
  colleague: '#60A5FA', friend: '#4ADE80', family: '#C084FC', mentor: '#FBBF24', other: '#94A3B8',
}

export default function ConnectionForm({ person, people, existingConnections = [], onClose, onSuccess }) {
  const { addConnection } = useConnections()
  const [personId2, setPersonId2] = useState('')
  const [relType, setRelType] = useState('colleague')
  const [since, setSince] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const connectedIds = new Set(existingConnections.map(c => c.id))
  const available = people.filter(p => p.id !== person.id && !connectedIds.has(p.id))

  useEffect(() => {
    if (available.length > 0) setPersonId2(available[0].id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!personId2) { setError('Please select a person to connect with'); return }
    setSubmitting(true)
    setError('')
    try {
      await addConnection({
        person1_id: person.id,
        person2_id: personId2,
        relationship_type: relType,
        since: since.trim() || null,
        notes: notes.trim() || null,
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create connection')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-head">
          <div>
            <div className="modal-title">Add connection</div>
            <div style={{ fontSize: 12, color: 'var(--text-mut)', marginTop: 2 }}>
              From <span style={{ color: 'var(--text-mid)', fontWeight: 500 }}>{person.name}</span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {available.length === 0 ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: 13, color: 'var(--text-mut)', marginBottom: 16 }}>
              All people in your network are already connected to {person.name}.
            </div>
            <button className="btn-ghost" onClick={onClose}>Close</button>
          </div>
        ) : (
          <>
            <div className="modal-body">
              <form id="conn-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {error && (
                  <div style={{
                    padding: '10px 14px', borderRadius: 8, fontSize: 13,
                    background: 'oklch(0.70 0.18 25 / 0.12)',
                    border: '1px solid oklch(0.70 0.18 25 / 0.35)',
                    color: 'var(--bad)',
                  }}>
                    {error}
                  </div>
                )}

                <label className="field" style={{ margin: 0 }}>
                  <span>Connect with</span>
                  <select
                    className="select-field"
                    value={personId2}
                    onChange={e => setPersonId2(e.target.value)}
                    style={{ background: 'var(--bg-2)' }}
                  >
                    {available.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name}{p.occupation ? ` — ${p.occupation}` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-mid)', marginBottom: 8 }}>
                    Relationship type
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {RELATIONSHIP_TYPES.map(({ value, label, color }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRelType(value)}
                        style={relType === value ? {
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                          border: `1px solid ${color}55`,
                          background: `${color}22`, color,
                        } : {
                          padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                          border: '1px solid var(--border)', background: 'transparent',
                          color: 'var(--text-mid)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-row" style={{ marginBottom: 0 }}>
                  <label className="field" style={{ margin: 0 }}>
                    <span>Since (optional)</span>
                    <input value={since} onChange={e => setSince(e.target.value)} placeholder="2020"/>
                  </label>
                  <label className="field" style={{ margin: 0 }}>
                    <span>Notes (optional)</span>
                    <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="How they met…"/>
                  </label>
                </div>
              </form>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
              <button type="submit" form="conn-form" className="btn-primary" disabled={submitting}>
                {submitting ? 'Connecting…' : 'Add connection'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
