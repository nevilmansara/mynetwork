import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNetworkContext } from '../context/NetworkContext'
import NetworkGraph from '../components/graph/NetworkGraph'
import GraphControls from '../components/graph/GraphControls'
import PersonProfile from '../components/people/PersonProfile'

export default function GraphPage() {
  const { graphData, people, loadGraphData, loadPeople, updatePerson } = useNetworkContext()
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [selectedPersonId, setSelectedPersonId] = useState(null)

  const pathNodeIds = searchParams.get('highlight')
    ? searchParams.get('highlight').split(',').filter(Boolean)
    : null
  const [showLabels, setShowLabels] = useState(false)
  const fgRef = useRef()

  useEffect(() => {
    Promise.all([loadGraphData(), loadPeople()]).finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPerson = people.find((p) => p.id === selectedPersonId) || null

  const handleNodeClick = (node) => {
    setSelectedPersonId((prev) => (prev === node.id ? null : node.id))
  }

  const handlePersonUpdate = (updated) => {
    updatePerson(updated.id, updated)
  }

  const zoomIn = () => {
    if (!fgRef.current) return
    fgRef.current.zoom(fgRef.current.zoom() * 1.35, 300)
  }

  const zoomOut = () => {
    if (!fgRef.current) return
    fgRef.current.zoom(fgRef.current.zoom() * 0.75, 300)
  }

  const resetView = () => {
    fgRef.current?.zoomToFit(400, 40)
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Graph canvas area */}
      <div className="relative flex-1 min-w-0">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-50">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <NetworkGraph
            graphData={graphData}
            onNodeClick={handleNodeClick}
            showLabels={showLabels}
            fgRef={fgRef}
            pathNodeIds={pathNodeIds}
          />
        )}

        {/* Floating controls */}
        <div className="absolute bottom-6 left-5 z-10">
          <GraphControls
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onReset={resetView}
            showLabels={showLabels}
            onToggleLabels={() => setShowLabels((v) => !v)}
          />
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 right-5 z-10 bg-white border border-gray-200 rounded-xl shadow-sm px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Relationships</p>
          {[
            { type: 'colleague', color: '#3B82F6', label: 'Colleague' },
            { type: 'friend',    color: '#10B981', label: 'Friend' },
            { type: 'family',    color: '#8B5CF6', label: 'Family' },
            { type: 'mentor',    color: '#F59E0B', label: 'Mentor' },
            { type: 'other',     color: '#9CA3AF', label: 'Other' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
              <div className="w-6 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        {/* Node count badge */}
        <div className="absolute top-4 left-5 z-10 bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-1.5 flex items-center gap-3">
          <span className="text-xs text-gray-500">
            <span className="font-semibold text-gray-800">{graphData.nodes.length}</span> people
          </span>
          <span className="text-gray-200">|</span>
          <span className="text-xs text-gray-500">
            <span className="font-semibold text-gray-800">{graphData.links.length}</span> connections
          </span>
        </div>
      </div>

      {/* Person profile side panel */}
      {selectedPerson && (
        <div className="w-80 xl:w-96 border-l border-gray-200 bg-white overflow-y-auto flex-shrink-0 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <span className="text-sm font-semibold text-gray-700">Person Details</span>
            <button
              onClick={() => setSelectedPersonId(null)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <PersonProfile person={selectedPerson} onUpdate={handlePersonUpdate} />
          </div>
        </div>
      )}
    </div>
  )
}
