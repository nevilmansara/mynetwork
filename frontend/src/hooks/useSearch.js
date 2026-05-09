import { useState } from 'react'

export function useSearch() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const search = async (query) => {
    // TODO: implement in Phase 5
  }

  const findPath = async (skill) => {
    // TODO: implement in Phase 5
  }

  return { results, loading, error, search, findPath }
}
