import { useState, useEffect, useMemo } from 'react'
import { usePeople } from '../hooks/usePeople'
import PersonCard from '../components/people/PersonCard'
import PersonForm from '../components/people/PersonForm'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-2.5 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-5 bg-gray-100 rounded-full w-16" />
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
    </div>
  )
}

export default function PeoplePage() {
  const { people, loading, error, loadPeople, addPerson } = usePeople()
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadPeople()
  }, [loadPeople])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return people
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.occupation?.toLowerCase().includes(q) ||
        p.company?.toLowerCase().includes(q) ||
        p.skills?.some((s) => s.toLowerCase().includes(q))
    )
  }, [people, search])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {people.length} {people.length === 1 ? 'person' : 'people'} in your network
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Add Person
        </button>
      </div>

      <div className="mb-5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, occupation, company or skill…"
          className="w-full max-w-md rounded-xl border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          {error}
          <button onClick={loadPeople} className="ml-2 underline font-medium">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {people.length === 0 ? (
            <>
              <div className="text-5xl mb-4">👥</div>
              <h2 className="text-lg font-semibold text-gray-700 mb-1">Your network is empty</h2>
              <p className="text-sm text-gray-400 mb-5">
                Start by adding the first person to your network.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition"
              >
                Add Your First Person
              </button>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm text-gray-500">No results for "{search}"</p>
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Clear search
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}

      {showForm && (
        <PersonForm
          onSubmit={addPerson}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
