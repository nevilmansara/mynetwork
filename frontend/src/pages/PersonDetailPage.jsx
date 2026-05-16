import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { peopleService } from '../services/peopleService'
import PersonProfile from '../components/people/PersonProfile'

function SkeletonProfile() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-24 bg-gray-200" />
      <div className="px-6 pb-6">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="w-20 h-20 rounded-full bg-gray-300 ring-4 ring-white" />
        </div>
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-1/2" />
          <div className="h-3.5 bg-gray-100 rounded w-1/3" />
        </div>
        <div className="flex gap-2 mt-4">
          <div className="h-6 bg-gray-100 rounded-full w-16" />
          <div className="h-6 bg-gray-100 rounded-full w-20" />
          <div className="h-6 bg-gray-100 rounded-full w-14" />
        </div>
      </div>
    </div>
  )
}

export default function PersonDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [person, setPerson] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    peopleService
      .getById(id)
      .then((res) => setPerson(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Person not found'))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/people')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to People
      </button>

      {loading && <SkeletonProfile />}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {person && (
        <PersonProfile
          person={person}
          onUpdate={(updated) => setPerson(updated)}
        />
      )}
    </div>
  )
}
