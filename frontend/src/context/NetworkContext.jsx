import { createContext, useContext, useState, useCallback } from 'react'
import { peopleService } from '../services/peopleService'
import { connectionService } from '../services/connectionService'

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

  const loadConnections = useCallback(async () => {
    try {
      const res = await connectionService.getAll()
      setConnections(res.data)
    } catch {
      // non-fatal — connections just won't show in graph
    }
  }, [])

  const loadNetwork = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [peopleRes, connRes] = await Promise.all([
        peopleService.getAll(),
        connectionService.getAll(),
      ])
      setPeople(peopleRes.data)
      setConnections(connRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load network')
    } finally {
      setLoading(false)
    }
  }, [])

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
    setConnections((prev) => prev.filter((c) => c.person1_id !== id && c.person2_id !== id))
  }, [])

  const addConnection = useCallback(async (data) => {
    const res = await connectionService.create(data)
    setConnections((prev) => [...prev, res.data])
    // Refresh people to update connections_count on cards
    const peopleRes = await peopleService.getAll()
    setPeople(peopleRes.data)
    return res.data
  }, [])

  const deleteConnection = useCallback(async (id) => {
    await connectionService.delete(id)
    setConnections((prev) => prev.filter((c) => c.id !== id))
    // Refresh people to update connections_count on cards
    const peopleRes = await peopleService.getAll()
    setPeople(peopleRes.data)
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
        loadConnections,
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
