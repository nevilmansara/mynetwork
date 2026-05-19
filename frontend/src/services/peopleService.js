import api from './api'

export const peopleService = {
  getAll: () => api.get('/people'),
  getById: (id) => api.get(`/people/${id}`),
  create: (data) => api.post('/people', data),
  update: (id, data) => api.put(`/people/${id}`, data),
  delete: (id) => api.delete(`/people/${id}`),
  getConnections: (id) => api.get(`/people/${id}/connections`),
  uploadPhoto: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/people/${id}/photo`, form)
  },
}
