import { useNetworkContext } from '../context/NetworkContext'

export function useConnections() {
  const { connections, addConnection, deleteConnection } = useNetworkContext()
  return { connections, addConnection, deleteConnection }
}
