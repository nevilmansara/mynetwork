import { useNetworkContext } from '../context/NetworkContext'

export function usePeople() {
  const { people, addPerson, updatePerson, deletePerson } = useNetworkContext()
  return { people, addPerson, updatePerson, deletePerson }
}
