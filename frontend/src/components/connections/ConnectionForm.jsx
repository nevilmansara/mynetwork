import { useState, useEffect } from 'react'
import { useConnections } from '../../hooks/useConnections'

const RELATIONSHIP_TYPES = [
  { value: 'colleague', label: 'Colleague' },
  { value: 'friend',    label: 'Friend' },
  { value: 'family',    label: 'Family' },
  { value: 'mentor',    label: 'Mentor' },
  { value: 'other',     label: 'Other' },
]

const REL_COLORS = {
  colleague: 'bg-blue-100 text-blue-700',
  friend:    'bg-emerald-100 text-emerald-700',
  family:    'bg-violet-100 text-violet-700',
  mentor:    'bg-amber-100 text-amber-700',
  other:     'bg-gray-100 text-gray-600',
}

export { REL_COLORS }

export default function ConnectionForm({ person, people, existingConnections = [], onClose, onSuccess }) {
  const { addConnection } = useConnections()
  const [personId2, setPersonId2] = useState('')
  const [relType, setRelType] = useState('colleague')
  const [since, setSince] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // People the current person is NOT already connected to (and not themselves)
  const connectedIds = new Set(existingConnections.map((c) => c.id))
  const available = people.filter(
    (p) => p.id !== person.id && !connectedIds.has(p.id)
  )

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Add Connection</h2>
            <p className="text-xs text-gray-400 mt-0.5">Connecting from <span className="font-medium text-gray-600">{person.name}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {available.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-gray-500">All people in your network are already connected to {person.name}.</p>
            <button onClick={onClose} className="mt-4 text-sm text-blue-600 hover:underline">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Connect with</label>
              <select
                value={personId2}
                onChange={(e) => setPersonId2(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {available.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}{p.occupation ? ` — ${p.occupation}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Relationship type</label>
              <div className="flex flex-wrap gap-2">
                {RELATIONSHIP_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRelType(value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      relType === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Since (optional)</label>
                <input
                  value={since}
                  onChange={(e) => setSince(e.target.value)}
                  placeholder="e.g. 2020"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How they met…"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition"
              >
                {submitting ? 'Connecting…' : 'Add Connection'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
