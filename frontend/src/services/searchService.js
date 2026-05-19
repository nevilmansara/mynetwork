import api from './api'

export const searchService = {
  search: (q) => api.get('/search', { params: { q } }),
  findPath: (toId) => api.get('/search/path', { params: { to: toId } }),
}
