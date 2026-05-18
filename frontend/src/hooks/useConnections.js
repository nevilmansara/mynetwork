import { useNetworkContext } from '../context/NetworkContext'

export function useConnections() {
  const { connections, loading, error, loadConnections, addConnection, deleteConnection } =
    useNetworkContext()
  return { connections, loading, error, loadConnections, addConnection, deleteConnection }
}
