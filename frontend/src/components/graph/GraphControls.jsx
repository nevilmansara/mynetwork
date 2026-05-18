export default function GraphControls({ onZoomIn, onZoomOut, onReset, showLabels, onToggleLabels }) {
  const btn = 'w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition'
  const base = `${btn} bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 shadow-sm`
  const active = `${btn} bg-blue-600 border-blue-600 text-white shadow-sm`

  return (
    <div className="flex flex-col gap-1.5">
      <button onClick={onZoomIn} className={base} title="Zoom in">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      <button onClick={onZoomOut} className={base} title="Zoom out">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </button>
      <button onClick={onReset} className={base} title="Fit to view">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V5a1 1 0 011-1h3M4 16v3a1 1 0 001 1h3m10-14h-3a1 1 0 00-1 1v3m4 10v-3a1 1 0 00-1-1h-3" />
        </svg>
      </button>
      <div className="border-t border-gray-100 my-0.5" />
      <button
        onClick={onToggleLabels}
        className={showLabels ? active : base}
        title="Toggle labels"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </button>
    </div>
  )
}
