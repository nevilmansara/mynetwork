import { useNetworkContext } from '../context/NetworkContext'

export function usePeople() {
  const { people, loading, error, loadPeople, addPerson, updatePerson, deletePerson } =
    useNetworkContext()

  const editPerson = (id, data) => updatePerson(id, data)
  const removePerson = (id) => deletePerson(id)

  return { people, loading, error, loadPeople, addPerson, editPerson, removePerson }
}
