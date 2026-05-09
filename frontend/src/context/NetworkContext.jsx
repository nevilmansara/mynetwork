import { createContext, useContext, useState } from 'react'

const NetworkContext = createContext(null)

export function NetworkProvider({ children }) {
  const [people, setPeople] = useState([])
  const [connections, setConnections] = useState([])
  const [graphData, setGraphData] = useState({ nodes: [], links: [] })

  const loadNetwork = async () => {
    // TODO: implement in Phase 3
  }

  const addPerson = async (data) => {
    // TODO: implement in Phase 3
  }

  const updatePerson = async (id, data) => {
    // TODO: implement in Phase 3
  }

  const deletePerson = async (id) => {
    // TODO: implement in Phase 3
  }

  const addConnection = async (data) => {
    // TODO: implement in Phase 3
  }

  const deleteConnection = async (id) => {
    // TODO: implement in Phase 3
  }

  return (
    <NetworkContext.Provider
      value={{ people, connections, graphData, loadNetwork, addPerson, updatePerson, deletePerson, addConnection, deleteConnection }}
    >
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetworkContext() {
  return useContext(NetworkContext)
}
