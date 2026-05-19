import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SearchBar from '../components/search/SearchBar'
import { useSearch } from '../hooks/useSearch'

const SKILL_COLORS = [
  'bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700', 'bg-indigo-100 text-indigo-700',
]

function skillColor(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return SKILL_COLORS[Math.abs(h) % SKILL_COLORS.length]
}

function Avatar({ name, size = 'md' }) {
  const dim = size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm'
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none`}
      style={{ background: `hsl(${hue}, 55%, 50%)` }}
    >
      {initials}
    </div>
  )
}

function PathChain({ path, onViewOnGraph }) {
  return (
    <div>
      <div className="flex items-center flex-wrap gap-2 mt-3">
      {path.map((node, i) => (
        <div key={node.id} className="flex items-center gap-2">
          <div className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 ${
            node.is_self
              ? 'border-blue-500 bg-blue-50'
              : i === path.length - 1
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-200 bg-white'
          }`}>
            <Avatar name={node.name} size="lg" />
            <p className="text-xs font-semibold text-gray-800 text-center max-w-[80px] truncate">{node.name}</p>
            {node.occupation && (
              <p className="text-[10px] text-gray-400 text-center max-w-[80px] truncate">{node.occupation}</p>
            )}
            {node.is_self && (
              <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">You</span>
            )}
          </div>
          {i < path.length - 1 && (
            <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
      ))}
      </div>
      <button
        onClick={onViewOnGraph}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="6" cy="12" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="18" cy="18" r="2" />
          <path strokeLinecap="round" d="M8 12h8M7 10.5l9-3M7 13.5l9 3" />
        </svg>
        View on Graph
      </button>
    </div>
  )
}

function ResultCard({ person, onFindPath, isActive, pathLoading }) {
  return (
    <div className={`bg-white rounded-2xl border p-4 transition ${isActive ? 'border-blue-300 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}>
      <div className="flex items-start gap-3">
        <Avatar name={person.name} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-900">{person.name}</span>
            {person.is_self && (
              <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">You</span>
            )}
          </div>
          {(person.occupation || person.company) && (
            <p className="text-xs text-gray-500 mt-0.5">
              {[person.occupation, person.company].filter(Boolean).join(' · ')}
            </p>
          )}
          {person.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {person.skills.map((s) => (
                <span key={s} className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${skillColor(s)}`}>{s}</span>
              ))}
            </div>
          )}
        </div>
        {!person.is_self && (
          <button
            onClick={() => onFindPath(person.id)}
            disabled={pathLoading && isActive}
            className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 transition mt-0.5"
          >
            {pathLoading && isActive ? (
              <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            )}
            Find path
          </button>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''

  const {
    results, path, loading, pathLoading,
    error, pathError, query, pathTargetId,
    search, findPath,
  } = useSearch()

  useEffect(() => {
    if (initialQ) search(initialQ)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleViewOnGraph = (pathNodes) => {
    const ids = pathNodes.map((n) => n.id).join(',')
    navigate(`/graph?highlight=${ids}`)
  }

  const hasSearched = query.length > 0

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Search Network</h1>
        <p className="text-sm text-gray-500">Find people by name, skill, occupation, or company</p>
      </div>

      <SearchBar onSearch={search} loading={loading} initialValue={initialQ} />

      {error && (
        <p className="mt-4 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      {hasSearched && !loading && (
        <p className="mt-5 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          {results.length === 0
            ? `No results for "${query}"`
            : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
        </p>
      )}

      {results.length > 0 && (
        <div className="mt-3 space-y-3">
          {results.map((person) => {
            const isActive = pathTargetId === person.id
            return (
              <div key={person.id}>
                <ResultCard
                  person={person}
                  onFindPath={findPath}
                  isActive={isActive}
                  pathLoading={pathLoading}
                />

                {isActive && path !== undefined && (
                  <div className="ml-2 mt-2 px-4 py-4 bg-gray-50 rounded-xl border border-gray-100">
                    {pathLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        Finding shortest path…
                      </div>
                    ) : pathError ? (
                      <p className="text-sm text-red-500">{pathError}</p>
                    ) : path === null ? (
                      <p className="text-sm text-gray-400">
                        No path found — <strong>{person.name}</strong> is not reachable within 6 hops.
                      </p>
                    ) : (
                      <>
                        <p className="text-xs font-semibold text-gray-500">
                          {path.hops} hop{path.hops !== 1 ? 's' : ''} away
                        </p>
                        <PathChain
                          path={path.path}
                          onViewOnGraph={() => handleViewOnGraph(path.path)}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="mt-20 text-center select-none">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-400 text-sm">
            Search for a skill like <strong className="text-gray-500">"Designer"</strong> or <strong className="text-gray-500">"Python"</strong>
            <br />then click <strong className="text-gray-500">Find path</strong> to see how you&apos;re connected
          </p>
        </div>
      )}
    </div>
  )
}
