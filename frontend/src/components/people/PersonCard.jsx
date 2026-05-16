import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import PersonForm from './PersonForm'
import { usePeople } from '../../hooks/usePeople'

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

function Avatar({ name, photoUrl }) {
  if (photoUrl) {
    return (
      <img src={photoUrl} alt={name} className="w-14 h-14 rounded-full object-cover ring-2 ring-white" />
    )
  }
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold ring-2 ring-white select-none"
      style={{ background: `hsl(${hue}, 55%, 50%)` }}
    >
      {initials}
    </div>
  )
}

export default function PersonCard({ person }) {
  const navigate = useNavigate()
  const { editPerson, removePerson } = usePeople()
  const [showEdit, setShowEdit] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

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

  const visibleSkills = person.skills?.slice(0, 3) || []
  const extraSkills = (person.skills?.length || 0) - visibleSkills.length

  return (
    <>
      <div
        className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group relative"
        onClick={() => navigate(`/people/${person.id}`)}
      >
        {person.is_self && (
          <span className="absolute top-3 right-3 text-[10px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
            You
          </span>
        )}

        <div className="flex items-start gap-4">
          <Avatar name={person.name} photoUrl={person.photo_url} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{person.name}</h3>
            {person.occupation && (
              <p className="text-sm text-gray-500 truncate">{person.occupation}</p>
            )}
            {person.company && (
              <p className="text-xs text-gray-400 truncate">{person.company}</p>
            )}
          </div>
        </div>

        {visibleSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {visibleSkills.map((skill) => (
              <span
                key={skill}
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${skillColor(skill)}`}
              >
                {skill}
              </span>
            ))}
            {extraSkills > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                +{extraSkills}
              </span>
            )}
          </div>
        )}

        {person.connections_count > 0 && (
          <p className="text-xs text-gray-400 mt-3">
            {person.connections_count} connection{person.connections_count !== 1 ? 's' : ''}
          </p>
        )}

        {deleteError && (
          <p className="text-xs text-red-500 mt-2 px-1">{deleteError}</p>
        )}

        {!person.is_self && (
          <div
            className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowEdit(true)}
              className="flex-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg py-1.5 transition"
            >
              Edit
            </button>
            {confirming ? (
              <div className="flex gap-1 flex-1">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg py-1.5 transition disabled:opacity-60"
                >
                  {deleting ? '…' : 'Confirm'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg py-1.5 transition"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="flex-1 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg py-1.5 transition"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {showEdit && (
        <PersonForm
          initialData={person}
          onSubmit={(data) => editPerson(person.id, data)}
          onClose={() => setShowEdit(false)}
        />
      )}
    </>
  )
}
