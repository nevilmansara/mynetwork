import { useState } from 'react'
import { searchService } from '../services/searchService'

export function useSearch() {
  const [results, setResults] = useState([])
  const [path, setPath] = useState(undefined) // undefined = not searched, null = no path found
  const [loading, setLoading] = useState(false)
  const [pathLoading, setPathLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pathError, setPathError] = useState(null)
  const [query, setQuery] = useState('')
  const [pathTargetId, setPathTargetId] = useState(null)

  const search = async (q) => {
    const trimmed = q.trim()
    if (!trimmed) {
      setResults([])
      setPath(undefined)
      setQuery('')
      return
    }
    setLoading(true)
    setError(null)
    setPath(undefined)
    setPathTargetId(null)
    try {
      const res = await searchService.search(trimmed)
      setResults(res.data)
      setQuery(trimmed)
    } catch (err) {
      setError(err.response?.data?.detail || 'Search failed')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const findPath = async (toId) => {
    setPathLoading(true)
    setPathError(null)
    setPath(undefined)
    setPathTargetId(toId)
    try {
      const res = await searchService.findPath(toId)
      setPath(res.data ?? null)
    } catch (err) {
      setPathError(err.response?.data?.detail || 'Could not find path')
      setPath(null)
    } finally {
      setPathLoading(false)
    }
  }

  const clearPath = () => {
    setPath(undefined)
    setPathTargetId(null)
    setPathError(null)
  }

  return {
    results,
    path,
    loading,
    pathLoading,
    error,
    pathError,
    query,
    pathTargetId,
    search,
    findPath,
    clearPath,
  }
}
