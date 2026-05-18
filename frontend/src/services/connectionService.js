import api from './api'

export const connectionService = {
  getAll: () => api.get('/connections'),
  create: (data) => api.post('/connections', data),
  delete: (id) => api.delete(`/connections/${id}`),
  getGraph: () => api.get('/graph'),
}
