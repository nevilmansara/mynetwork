import api from './api'

export const importExportService = {
  exportCSV: () => api.get('/import-export/export', { responseType: 'blob' }),
  importCSV: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/import-export/import', form)
  },
}

export function downloadTemplateCSV() {
  const rows = [
    'name,email,phone,occupation,company,skills,location,notes',
    'Jane Doe,jane@example.com,+1234567890,Software Engineer,Acme Corp,"Python;React",New York,Met at conference',
    'Bob Smith,,+9876543210,Designer,,"Figma;UI Design",London,',
  ]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mynetwork_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function triggerCSVDownload(blob, filename = 'mynetwork_people.csv') {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
