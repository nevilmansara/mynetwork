import api from './api'

export const peopleService = {
  getAll: () => api.get('/people'),
  getById: (id) => api.get(`/people/${id}`),
  create: (data) => api.post('/people', data),
  update: (id, data) => api.put(`/people/${id}`, data),
  delete: (id) => api.delete(`/people/${id}`),
  getConnections: (id) => api.get(`/people/${id}/connections`),
}
