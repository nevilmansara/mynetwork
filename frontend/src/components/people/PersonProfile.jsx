import { useState, useEffect } from 'react'
import { usePeople } from '../../hooks/usePeople'
import PersonForm from './PersonForm'
import ConnectionForm from '../connections/ConnectionForm'
import ConnectionList from '../connections/ConnectionList'
import { useNetworkContext } from '../../context/NetworkContext'
import { peopleService } from '../../services/peopleService'

const SKILL_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
]

function skillColor(skill) {
  let hash = 0
  for (let i = 0; i < skill.length; i++) hash = skill.charCodeAt(i) + ((hash << 5) - hash)
  return SKILL_COLORS[Math.abs(hash) % SKILL_COLORS.length]
}

function Avatar({ name, photoUrl, size = 'lg' }) {
  const dim = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-14 h-14 text-lg'
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`${dim} rounded-full object-cover ring-4 ring-white shadow`} />
  }
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center text-white font-bold ring-4 ring-white shadow select-none`}
      style={{ background: `hsl(${hue}, 55%, 50%)` }}
    >
      {initials}
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <span className="text-gray-400 mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  )
}

export default function PersonProfile({ person, onUpdate }) {
  const { editPerson } = usePeople()
  const { people } = useNetworkContext()
  const [showEdit, setShowEdit] = useState(false)
  const [showAddConn, setShowAddConn] = useState(false)
  const [personConnections, setPersonConnections] = useState([])

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

  const handleEdit = async (data) => {
    const updated = await editPerson(person.id, data)
    onUpdate?.(updated)
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <Avatar name={person.name} photoUrl={person.photo_url} />
            {!person.is_self && (
              <button
                onClick={() => setShowEdit(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 15H9v-2z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          <div className="mb-1 flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">{person.name}</h2>
            {person.is_self && (
              <span className="text-[10px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                You
              </span>
            )}
          </div>
          {person.occupation && (
            <p className="text-sm text-gray-500">
              {person.occupation}
              {person.company && ` · ${person.company}`}
            </p>
          )}

          {person.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {person.skills.map((skill) => (
                <span
                  key={skill}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${skillColor(skill)}`}
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
            <InfoRow icon="📧" label="Email" value={person.email} />
            <InfoRow icon="📞" label="Phone" value={person.phone} />
            <InfoRow icon="📍" label="Location" value={person.location} />
            {person.notes && (
              <div className="flex items-start gap-3">
                <span className="text-gray-400 mt-0.5 shrink-0">📝</span>
                <div>
                  <p className="text-xs text-gray-400">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{person.notes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Connections ({personConnections.length})
              </p>
              <button
                onClick={() => setShowAddConn(true)}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                + Add
              </button>
            </div>
            <ConnectionList
              connections={personConnections}
              onAddConnection={() => setShowAddConn(true)}
              onDeleted={loadPersonConnections}
            />
          </div>
        </div>
      </div>

      {showEdit && (
        <PersonForm
          initialData={person}
          onSubmit={handleEdit}
          onClose={() => setShowEdit(false)}
        />
      )}

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
