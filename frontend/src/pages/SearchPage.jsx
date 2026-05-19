import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSearch } from '../hooks/useSearch'
import { useNetworkContext } from '../context/NetworkContext'
import NetworkGraph from '../components/graph/NetworkGraph'
import { CATEGORIES, getCategory } from '../utils/graphHelpers'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const POPULAR = ['Designer', 'Engineer', 'Product', 'Python', 'React', 'iOS', 'Marketing']

function getInitials(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || '?'
}
function getInitialsBg(name = '') {
  const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return `hsl(${hue}, 50%, 38%)`
}

// ── Autocomplete dropdown ─────────────────────────────────────────────────────
function SuggestDrop({ suggestions, focusedIdx, onPick }) {
  if (!suggestions.length) return null
  return (
    <div className="suggest-drop">
      {suggestions.map((p, i) => {
        const cat = getCategory(p.occupation)
        const catInfo = CATEGORIES[cat]
        const photoUrl = p.photo_url
          ? (p.photo_url.startsWith('http') ? p.photo_url : `${API_BASE}${p.photo_url}`)
          : null
        return (
          <button
            key={p.id}
            className={`suggest-item${focusedIdx === i ? ' focused' : ''}`}
            onMouseDown={e => { e.preventDefault(); onPick(p) }}
          >
            {photoUrl ? (
              <img src={photoUrl} alt={p.name}
                style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                background: getInitialsBg(p.name),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 12,
              }}>
                {getInitials(p.name)}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 7 }}>
                {p.name}
                {p.is_self && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                    background: 'var(--accent-glow)', color: 'var(--accent-2)',
                  }}>You</span>
                )}
              </div>
              {(p.occupation || p.company) && (
                <div style={{ fontSize: 12, color: 'var(--text-mut)' }}>
                  {[p.occupation, p.company].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            <span className="cat-pill small" style={{ color: catInfo.color, borderColor: catInfo.color + '55', flexShrink: 0 }}>
              {catInfo.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── Path trail card ───────────────────────────────────────────────────────────
function PathTrail({ path, targetPerson, onOpenProfile }) {
  if (!path?.path?.length) return null

  return (
    <div className="card" style={{ padding: '18px 20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text)', marginBottom: 3 }}>
            Shortest intro path
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-mut)' }}>
            {path.hops} hop{path.hops !== 1 ? 's' : ''} to reach {targetPerson?.name}
          </div>
        </div>
        {targetPerson && (
          <button className="btn-ghost small" onClick={onOpenProfile}>
            Open profile →
          </button>
        )}
      </div>

      {/* Path nodes */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0 }}>
        {path.path.map((node, i) => {
          const cat = getCategory(node.occupation)
          const catColor = CATEGORIES[cat].color
          const isFirst = i === 0
          const isLast = i === path.path.length - 1
          return (
            <div key={node.id} style={{ display: 'flex', alignItems: 'center' }}>
              {/* Node card */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${isLast ? catColor + '99' : 'var(--border)'}`,
                background: isLast ? catColor + '18' : 'var(--surface-2)',
                minWidth: 130,
              }}>
                {/* Square initials */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: getInitialsBg(node.name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: 13,
                }}>
                  {getInitials(node.name)}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                    {node.is_self ? 'You' : node.name}
                  </div>
                  {node.occupation && (
                    <div style={{ fontSize: 11.5, color: isLast ? catColor : 'var(--text-mut)', marginTop: 2, whiteSpace: 'nowrap' }}>
                      {node.occupation}
                    </div>
                  )}
                </div>
              </div>
              {/* Arrow */}
              {i < path.path.length - 1 && (
                <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', color: 'var(--text-dim)', flexShrink: 0 }}>
                  <div style={{ width: 18, height: 1.5, background: 'var(--border-2)', marginRight: -2 }}/>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''
  const [inputVal, setInputVal] = useState(initialQ)
  const [showSuggest, setShowSuggest] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const fgRef = useRef()
  const inputRef = useRef()

  const { graphData, loadGraphData, people, loadPeople } = useNetworkContext()
  const {
    results, path, loading, pathLoading,
    error, pathError, query, pathTargetId,
    search, findPath,
  } = useSearch()

  useEffect(() => {
    loadGraphData()
    loadPeople()
    if (initialQ) search(initialQ)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Build suggestions from people list as user types
  const suggestions = useMemo(() => {
    const q = inputVal.trim().toLowerCase()
    if (!q || q.length < 1) return []
    return people
      .filter(p => {
        return (
          p.name.toLowerCase().includes(q) ||
          p.occupation?.toLowerCase().includes(q) ||
          p.company?.toLowerCase().includes(q) ||
          p.skills?.some(s => s.toLowerCase().includes(q))
        )
      })
      .slice(0, 6)
  }, [inputVal, people])

  const handleSubmit = (e) => {
    e.preventDefault()
    setShowSuggest(false)
    if (inputVal.trim()) search(inputVal.trim())
  }

  const handlePopular = (term) => {
    setInputVal(term)
    setShowSuggest(false)
    search(term)
  }

  const handlePickSuggestion = (person) => {
    setInputVal(person.name)
    setShowSuggest(false)
    setFocusedIdx(-1)
    // Search for this person's name and immediately find path
    search(person.name)
    if (!person.is_self) findPath(person.id)
  }

  const handleKeyDown = (e) => {
    if (!showSuggest || !suggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && focusedIdx >= 0) {
      e.preventDefault()
      handlePickSuggestion(suggestions[focusedIdx])
    } else if (e.key === 'Escape') {
      setShowSuggest(false)
      setFocusedIdx(-1)
    }
  }

  const targetPerson = results.find(p => p.id === pathTargetId) || null
  const pathNodeIds = path?.path?.map(n => n.id) || null
  const hasSearched = query.length > 0
  const showGraph = pathNodeIds && pathNodeIds.length > 0

  const handleOpenProfile = () => {
    if (targetPerson) navigate(`/people/${targetPerson.id}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Page header */}
      <div className="page-head" style={{ paddingBottom: 18 }}>
        <div>
          <div className="page-eyebrow">Search</div>
          <h1 className="page-title">Find a connection</h1>
          <p className="page-sub">Search any skill or occupation. We'll trace the shortest intro path.</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="card search-card" style={{ marginBottom: 16 }}>
        <form onSubmit={handleSubmit}>
          <div
            className="search-input big"
            style={{ position: 'relative' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--text-dim)' }}>
              <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              value={inputVal}
              onChange={e => {
                setInputVal(e.target.value)
                setShowSuggest(true)
                setFocusedIdx(-1)
              }}
              onFocus={() => setShowSuggest(true)}
              onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
              onKeyDown={handleKeyDown}
              placeholder="Search people, skills, occupation…"
              autoFocus
              style={{ fontSize: 15 }}
            />
            {loading && <div className="spinner" style={{ flexShrink: 0 }}/>}
            {inputVal && !loading && (
              <button
                type="button"
                className="clear"
                style={{ fontSize: 18, lineHeight: 1 }}
                onClick={() => { setInputVal(''); setShowSuggest(false); inputRef.current?.focus() }}
              >
                ×
              </button>
            )}

            {/* Suggestions dropdown */}
            {showSuggest && suggestions.length > 0 && (
              <SuggestDrop
                suggestions={suggestions}
                focusedIdx={focusedIdx}
                onPick={handlePickSuggestion}
              />
            )}
          </div>
        </form>
        <div className="popular-row">
          <span className="popular-label">Popular:</span>
          {POPULAR.map(term => (
            <button
              key={term}
              className={`pop${query === term ? ' active' : ''}`}
              onClick={() => handlePopular(term)}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          background: 'oklch(0.70 0.18 25 / 0.12)',
          border: '1px solid oklch(0.70 0.18 25 / 0.35)',
          color: 'var(--bad)',
        }}>
          {error}
        </div>
      )}

      {/* Path loading indicator */}
      {pathLoading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 16, padding: '12px 18px', borderRadius: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          fontSize: 13, color: 'var(--text-mut)',
        }}>
          <div className="spinner" style={{ width: 15, height: 15 }}/>
          Finding shortest intro path…
        </div>
      )}

      {/* Path not found */}
      {pathTargetId && path === null && !pathLoading && !pathError && (
        <div style={{
          marginBottom: 16, padding: '12px 18px', borderRadius: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          fontSize: 13, color: 'var(--text-mut)',
        }}>
          No path found — not reachable within 6 hops.
        </div>
      )}
      {pathError && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13,
          background: 'oklch(0.70 0.18 25 / 0.12)',
          border: '1px solid oklch(0.70 0.18 25 / 0.35)',
          color: 'var(--bad)',
        }}>
          {pathError}
        </div>
      )}

      {/* Path trail */}
      {path?.path?.length > 0 && !pathLoading && (
        <PathTrail
          path={path}
          targetPerson={targetPerson}
          onOpenProfile={handleOpenProfile}
        />
      )}

      {/* Results + mini graph */}
      {hasSearched && !loading && (
        <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0, alignItems: 'flex-start' }}>
          {/* Results list */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 12 }}>
              {results.length === 0
                ? `No results for "${query}"`
                : `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {results.map(person => {
                const isActive = pathTargetId === person.id
                const cat = getCategory(person.occupation)
                const catInfo = CATEGORIES[cat]
                const photoUrl = person.photo_url
                  ? (person.photo_url.startsWith('http') ? person.photo_url : `${API_BASE}${person.photo_url}`)
                  : null
                const hops = isActive && path?.hops != null ? path.hops : null

                return (
                  <button
                    key={person.id}
                    onClick={() => !person.is_self && findPath(person.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                      padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                      background: isActive ? catInfo.color + '14' : 'var(--surface)',
                      border: `1.5px solid ${isActive ? catInfo.color + '88' : 'var(--border)'}`,
                      cursor: person.is_self ? 'default' : 'pointer',
                      transition: 'all .15s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border-2)' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = 'var(--border)' }}
                  >
                    {/* Avatar */}
                    {photoUrl ? (
                      <img src={photoUrl} alt={person.name}
                        style={{ width: 46, height: 46, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div style={{
                        width: 46, height: 46, borderRadius: 10, flexShrink: 0,
                        background: getInitialsBg(person.name),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 15,
                      }}>
                        {getInitials(person.name)}
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{person.name}</span>
                        {person.is_self && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
                            background: 'var(--accent-glow)', color: 'var(--accent-2)',
                          }}>You</span>
                        )}
                        {hops != null && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                            background: catInfo.color + '22',
                            color: catInfo.color, border: `1px solid ${catInfo.color + '55'}`,
                          }}>
                            {hops} hop{hops !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-mut)', marginBottom: person.skills?.length > 0 ? 6 : 0 }}>
                        {[person.occupation, person.company].filter(Boolean).join(' · ') || 'No details'}
                      </div>
                      {person.skills?.length > 0 && (
                        <div className="chip-row tight">
                          {person.skills.slice(0, 4).map(s => (
                            <span key={s} className="chip" style={{ fontSize: 11 }}>{s}</span>
                          ))}
                          {person.skills.length > 4 && (
                            <span className="chip muted" style={{ fontSize: 11 }}>+{person.skills.length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right side */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {!person.is_self && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke={isActive ? catInfo.color : 'var(--text-dim)'}
                          strokeWidth="2"
                        >
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mini graph panel */}
          {showGraph && (
            <div style={{ width: 420, flexShrink: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 10,
              }}>
                Path on the graph
              </div>
              <div className="card" style={{
                padding: 0, overflow: 'hidden', height: 340, borderRadius: 12,
              }}>
                <NetworkGraph
                  graphData={graphData}
                  onNodeClick={() => {}}
                  showLabels={true}
                  fgRef={fgRef}
                  pathNodeIds={pathNodeIds}
                />
              </div>
              <button
                className="btn-ghost"
                style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}
                onClick={() => navigate(`/graph?highlight=${pathNodeIds.join(',')}`)}
              >
                Open full graph →
              </button>
            </div>
          )}

          {/* Placeholder when no path selected yet */}
          {!showGraph && results.length > 0 && (
            <div style={{
              width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '40px 24px', textAlign: 'center',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, gap: 10,
            }}>
              <div style={{ fontSize: 28, color: 'var(--text-dim)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/>
                  <line x1="7" y1="12" x2="17" y2="6"/><line x1="7" y1="12" x2="17" y2="18"/>
                </svg>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-mid)' }}>Path on the graph</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5 }}>
                Click a result to find the shortest intro path and see it on the graph
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!hasSearched && !loading && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          <div className="empty-glyph">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
              <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <div className="empty-title">Search your network</div>
          <div className="empty-sub">
            Try a skill like "Designer" or "Python" — click a result to trace the shortest intro path.
          </div>
        </div>
      )}
    </div>
  )
}
