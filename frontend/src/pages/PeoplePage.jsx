import { useState, useEffect, useRef, useMemo } from 'react'
import { usePeople } from '../hooks/usePeople'
import PersonCard from '../components/people/PersonCard'
import PersonForm from '../components/people/PersonForm'
import {
  importExportService,
  downloadTemplateCSV,
  triggerCSVDownload,
} from '../services/importExportService'

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-2.5 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <div className="h-5 bg-gray-100 rounded-full w-16" />
        <div className="h-5 bg-gray-100 rounded-full w-20" />
      </div>
    </div>
  )
}

function ImportModal({ onClose, onImported }) {
  const fileInputRef = useRef()
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [importError, setImportError] = useState(null)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.csv')) setFile(dropped)
  }

  const handleFileChange = (e) => {
    const picked = e.target.files[0]
    if (picked) setFile(picked)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setImportError(null)
    setResult(null)
    try {
      const res = await importExportService.importCSV(file)
      setResult(res.data)
      if (res.data.imported > 0) onImported()
    } catch (err) {
      setImportError(err.response?.data?.detail || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">Import from CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl px-4 py-8 text-center cursor-pointer transition ${
              dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div>
                <p className="text-sm font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-gray-500">Drop your CSV here or <span className="text-blue-600">browse</span></p>
                <p className="text-xs text-gray-400 mt-1">Columns: name, email, phone, occupation, company, skills, location, notes</p>
              </div>
            )}
          </div>

          {/* Template link */}
          <button
            onClick={downloadTemplateCSV}
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download template CSV
          </button>

          {/* Error */}
          {importError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{importError}</p>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-xl px-4 py-3 text-sm ${result.imported > 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
              <p className="font-medium text-gray-800">
                {result.imported > 0
                  ? `${result.imported} contact${result.imported !== 1 ? 's' : ''} imported`
                  : 'No new contacts imported'}
              </p>
              {result.skipped > 0 && (
                <p className="text-xs text-gray-500 mt-0.5">{result.skipped} skipped (duplicates or errors)</p>
              )}
              {result.errors?.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {result.errors.slice(0, 5).map((e, i) => (
                    <li key={i} className="text-xs text-red-500">{e}</li>
                  ))}
                  {result.errors.length > 5 && (
                    <li className="text-xs text-gray-400">…and {result.errors.length - 5} more</li>
                  )}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5">
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PeoplePage() {
  const { people, loading, error, loadPeople, addPerson } = usePeople()
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadPeople()
  }, [loadPeople])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return people
    return people.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.occupation?.toLowerCase().includes(q) ||
        p.company?.toLowerCase().includes(q) ||
        p.skills?.some((s) => s.toLowerCase().includes(q))
    )
  }, [people, search])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await importExportService.exportCSV()
      triggerCSVDownload(res.data)
    } catch {
      // silent — browser will show nothing downloaded
    } finally {
      setExporting(false)
    }
  }

  const handleImported = () => {
    loadPeople()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">People</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {people.length} {people.length === 1 ? 'person' : 'people'} in your network
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting || people.length === 0}
            title="Export contacts as CSV"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exporting…' : 'Export'}
          </button>

          {/* Import */}
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Import
          </button>

          {/* Add Person */}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition shadow-sm"
          >
            <span className="text-lg leading-none">+</span>
            Add Person
          </button>
        </div>
      </div>

      <div className="mb-5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, occupation, company or skill…"
          className="w-full max-w-md rounded-xl border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
          {error}
          <button onClick={loadPeople} className="ml-2 underline font-medium">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          {people.length === 0 ? (
            <>
              <div className="text-5xl mb-4">👥</div>
              <h2 className="text-lg font-semibold text-gray-700 mb-1">Your network is empty</h2>
              <p className="text-sm text-gray-400 mb-5">
                Start by adding the first person to your network.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowForm(true)}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition"
                >
                  Add Your First Person
                </button>
                <button
                  onClick={() => setShowImport(true)}
                  className="px-5 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition"
                >
                  Import CSV
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-sm text-gray-500">No results for "{search}"</p>
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Clear search
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((person) => (
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}

      {showForm && (
        <PersonForm
          onSubmit={addPerson}
          onClose={() => setShowForm(false)}
        />
      )}

      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImported={handleImported}
        />
      )}
    </div>
  )
}
