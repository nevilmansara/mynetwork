import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePeople } from '../hooks/usePeople'
import PersonCard from '../components/people/PersonCard'
import { CATEGORIES, getCategory } from '../utils/graphHelpers'
import {
  importExportService,
  downloadTemplateCSV,
  triggerCSVDownload,
} from '../services/importExportService'

function ImportModal({ onClose, onImported }) {
  const fileInputRef = useRef()
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [importError, setImportError] = useState(null)

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.csv')) setFile(dropped)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true); setImportError(null); setResult(null)
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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <span className="modal-title">Import from CSV</span>
          <button className="icon-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            className={`drop-zone${dragging ? ' over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) setFile(e.target.files[0]) }}/>
            {file ? (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-mut)', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 24, marginBottom: 8, color: 'var(--text-dim)' }}>↑</div>
                <div style={{ fontSize: 13, color: 'var(--text-mid)' }}>
                  Drop your CSV here or <span style={{ color: 'var(--accent-2)' }}>browse</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-mut)', marginTop: 4 }}>
                  name, email, phone, occupation, company, skills, location, notes
                </div>
              </div>
            )}
          </div>

          <button className="link-btn" onClick={downloadTemplateCSV} style={{ alignSelf: 'flex-start' }}>
            ↓ Download template CSV
          </button>

          {importError && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, fontSize: 13,
              background: 'oklch(0.70 0.18 25 / 0.12)',
              border: '1px solid oklch(0.70 0.18 25 / 0.35)',
              color: 'var(--bad)',
            }}>
              {importError}
            </div>
          )}

          {result && (
            <div style={{
              padding: '12px 14px', borderRadius: 8, fontSize: 13,
              background: result.imported > 0 ? 'oklch(0.74 0.16 155 / 0.12)' : 'var(--bg-2)',
              border: `1px solid ${result.imported > 0 ? 'oklch(0.74 0.16 155 / 0.3)' : 'var(--border)'}`,
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>
                {result.imported > 0
                  ? `${result.imported} contact${result.imported !== 1 ? 's' : ''} imported`
                  : 'No new contacts imported'}
              </div>
              {result.skipped > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-mut)', marginTop: 4 }}>
                  {result.skipped} skipped (duplicates)
                </div>
              )}
              {result.errors?.slice(0, 5).map((e, i) => (
                <div key={i} style={{ fontSize: 11.5, color: 'var(--bad)', marginTop: 2 }}>{e}</div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose}>{result ? 'Close' : 'Cancel'}</button>
          {!result && (
            <button className="btn-primary" onClick={handleImport} disabled={!file || importing}>
              {importing ? 'Importing…' : 'Import'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const ALL_CATS = [
  { key: 'all', label: 'All' },
  ...Object.entries(CATEGORIES).map(([key, cat]) => ({ key, label: cat.label, color: cat.color })),
]

export default function PeoplePage() {
  const { people, loading, error, loadPeople } = usePeople()
  const navigate = useNavigate()
  const [showImport, setShowImport] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState('all')

  useEffect(() => { loadPeople() }, [loadPeople])

  const nonSelf = useMemo(() => people.filter(p => !p.is_self), [people])
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return nonSelf.filter(p => {
      if (activeCat !== 'all' && getCategory(p.occupation) !== activeCat) return false
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.occupation?.toLowerCase().includes(q) ||
        p.company?.toLowerCase().includes(q) ||
        p.skills?.some(s => s.toLowerCase().includes(q))
      )
    })
  }, [nonSelf, search, activeCat])

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await importExportService.exportCSV()
      triggerCSVDownload(res.data)
    } catch { /* silent */ } finally { setExporting(false) }
  }

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-eyebrow">Contacts</div>
          <h1 className="page-title">People</h1>
          <p className="page-sub">{nonSelf.length} {nonSelf.length === 1 ? 'person' : 'people'} in your network</p>
        </div>
        <div className="page-actions">
          <button
            className="btn-ghost"
            onClick={handleExport}
            disabled={exporting || nonSelf.length === 0}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button className="btn-ghost" onClick={() => setShowImport(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
            </svg>
            Import CSV
          </button>
          <button className="btn-primary" onClick={() => navigate('/people/new')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add person
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="people-toolbar">
        <div className="search-input">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, skill, company…"
          />
          {search && (
            <button className="clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>
        <div className="filter-chips">
          {ALL_CATS.map(({ key, label, color }) => (
            <button
              key={key}
              className={activeCat === key ? 'active' : ''}
              onClick={() => setActiveCat(key)}
            >
              {color && <span className="legend-dot" style={{ background: color }}/>}
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          marginBottom: 16, padding: '10px 14px', borderRadius: 8,
          background: 'oklch(0.70 0.18 25 / 0.12)',
          border: '1px solid oklch(0.70 0.18 25 / 0.35)',
          fontSize: 13, color: 'var(--bad)',
        }}>
          {error}{' '}
          <button className="link-btn" onClick={loadPeople}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="people-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              height: 180, borderRadius: 'var(--radius-lg)',
              background: 'var(--surface)', border: '1px solid var(--border)',
              animation: 'pulse 1.5s infinite',
            }}/>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          {nonSelf.length === 0 ? (
            <>
              <div className="empty-glyph">⬡</div>
              <div className="empty-title">Your network is empty</div>
              <div className="empty-sub">Start by adding the first person to your network.</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <button className="btn-primary" onClick={() => navigate('/people/new')}>Add first contact</button>
                <button className="btn-ghost" onClick={() => setShowImport(true)}>Import CSV</button>
              </div>
            </>
          ) : (
            <>
              <div className="empty-glyph">○</div>
              <div className="empty-title">No results</div>
              <div className="empty-sub">Try a different search or category filter.</div>
              <button className="btn-ghost" style={{ marginTop: 14 }} onClick={() => { setSearch(''); setActiveCat('all') }}>
                Clear filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="people-grid">
          {filtered.map(person => (
            <PersonCard key={person.id} person={person}/>
          ))}
        </div>
      )}

      {showImport && (
        <ImportModal onClose={() => setShowImport(false)} onImported={loadPeople}/>
      )}
    </>
  )
}
