import { createContext, useContext, useState, useCallback } from 'react'
import { peopleService } from '../services/peopleService'

const NetworkContext = createContext(null)

export function NetworkProvider({ children }) {
  const [people, setPeople] = useState([])
  const [connections, setConnections] = useState([])
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadPeople = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await peopleService.getAll()
      setPeople(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load people')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadNetwork = useCallback(async () => {
    await loadPeople()
    // connections + graphData loaded in Phase 5
  }, [loadPeople])

  const addPerson = useCallback(async (data) => {
    const res = await peopleService.create(data)
    setPeople((prev) => [...prev, res.data])
    return res.data
  }, [])

  const updatePerson = useCallback(async (id, data) => {
    const res = await peopleService.update(id, data)
    setPeople((prev) => prev.map((p) => (p.id === id ? res.data : p)))
    return res.data
  }, [])

  const deletePerson = useCallback(async (id) => {
    await peopleService.delete(id)
    setPeople((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const addConnection = useCallback(async (_data) => {
    // implemented in Phase 5
  }, [])

  const deleteConnection = useCallback(async (_id) => {
    // implemented in Phase 5
  }, [])

  return (
    <NetworkContext.Provider
      value={{
        people,
        connections,
        graphData,
        loading,
        error,
        loadPeople,
        loadNetwork,
        addPerson,
        updatePerson,
        deletePerson,
        addConnection,
        deleteConnection,
      }}
    >
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetworkContext() {
  return useContext(NetworkContext)
}
