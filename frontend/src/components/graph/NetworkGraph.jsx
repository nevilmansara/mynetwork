import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { getCategory, CATEGORIES, getLinkColor } from '../../utils/graphHelpers'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

function getInitials(name = '') {
  return name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase() || '?'
}

function getNodeRadius(val) {
  return Math.max(14, Math.sqrt((val || 1) + 1) * 5.5)
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function getNodeColor(occupation, alpha = 1) {
  const cat = getCategory(occupation)
  return hexToRgba(CATEGORIES[cat].color, alpha)
}

export default function NetworkGraph({ graphData, onNodeClick, showLabels = true, fgRef, pathNodeIds }) {
  const containerRef = useRef()
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [hoveredNode, setHoveredNode] = useState(null)
  const imageCache = useRef({})
  const pathSet = pathNodeIds ? new Set(pathNodeIds) : null

  // Sync container size
  useEffect(() => {
    if (!containerRef.current) return
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        })
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Configure d3 forces for wide, well-spaced layout
  useEffect(() => {
    if (!fgRef?.current || !graphData.nodes.length) return
    const fg = fgRef.current
    // Strong repulsion so nodes spread far apart
    fg.d3Force('charge')?.strength(-260)
    // Link distance — keep edges visible but not too tight
    fg.d3Force('link')?.distance(100).strength(0.4)
    // Weak centering so the graph still centres loosely
    fg.d3Force('center')?.strength(0.04)
    fg.d3ReheatSimulation()
  }, [graphData.nodes.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-load photos into canvas Image objects
  useEffect(() => {
    graphData.nodes.forEach(node => {
      if (node.photo_url && !imageCache.current[node.id]) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = node.photo_url.startsWith('http') ? node.photo_url : `${API_BASE}${node.photo_url}`
        img.onload = () => { imageCache.current[node.id] = img }
      }
    })
  }, [graphData.nodes])

  // Compute highlight set on hover
  const highlightNodes = useMemo(() => {
    if (!hoveredNode) return null
    const set = new Set([hoveredNode.id])
    graphData.links.forEach(link => {
      const src = link.source?.id ?? link.source
      const tgt = link.target?.id ?? link.target
      if (src === hoveredNode.id) set.add(tgt)
      if (tgt === hoveredNode.id) set.add(src)
    })
    return set
  }, [hoveredNode, graphData.links])

  const nodeCanvasObject = useCallback(
    (node, ctx) => {
      const radius = getNodeRadius(node.val)
      const isLit = !highlightNodes || highlightNodes.has(node.id)
      const inPath = pathSet && pathSet.has(node.id)
      const alpha = isLit ? 1 : 0.15
      const drawLabel = showLabels

      // ── Self node outer glow rings ──────────────────────────────────
      if (node.is_self) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI)
        ctx.strokeStyle = getNodeColor(node.occupation, isLit ? 0.5 : 0.08)
        ctx.lineWidth = 2.5
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI)
        ctx.strokeStyle = getNodeColor(node.occupation, isLit ? 0.18 : 0.04)
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // ── Path highlight ring ─────────────────────────────────────────
      if (inPath) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI)
        ctx.strokeStyle = `rgba(245,158,11,${isLit ? 0.9 : 0.1})`
        ctx.lineWidth = 2.5
        ctx.stroke()
      }

      // ── Filled circle ───────────────────────────────────────────────
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      ctx.fillStyle = inPath
        ? `rgba(251,146,60,${alpha})`
        : getNodeColor(node.occupation, alpha)
      ctx.fill()

      // ── Photo or initials ───────────────────────────────────────────
      const photo = imageCache.current[node.id]
      if (photo && photo.complete && photo.naturalWidth > 0) {
        ctx.save()
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius - 1.5, 0, 2 * Math.PI)
        ctx.clip()
        ctx.globalAlpha = alpha
        const d = (radius - 1.5) * 2
        ctx.drawImage(photo, node.x - radius + 1.5, node.y - radius + 1.5, d, d)
        ctx.restore()
      } else {
        const initials = getInitials(node.name)
        const fontSize = Math.max(8, radius * 0.52)
        ctx.font = `700 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = `rgba(8,8,18,${alpha * 0.88})`
        ctx.fillText(initials, node.x, node.y)
      }

      // ── Name label below node ───────────────────────────────────────
      if (drawLabel) {
        const label = node.is_self ? 'You' : node.name
        const lblSize = 11
        ctx.font = `${node.is_self || inPath ? '700' : '500'} ${lblSize}px Inter, ui-sans-serif, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = `rgba(0,0,0,${alpha * 0.55})`
        ctx.fillText(label, node.x + 0.5, node.y + radius + 5.5)
        ctx.fillStyle = `rgba(210,218,255,${alpha * 0.92})`
        ctx.fillText(label, node.x, node.y + radius + 5)
      }
    },
    [highlightNodes, pathSet, showLabels]
  )

  const nodePointerAreaPaint = useCallback((node, color, ctx) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(node.x, node.y, getNodeRadius(node.val) + 6, 0, 2 * Math.PI)
    ctx.fill()
  }, [])

  const getLinkColorCb = useCallback(
    link => {
      const src = link.source?.id ?? link.source
      const tgt = link.target?.id ?? link.target
      const lit = !hoveredNode || src === hoveredNode.id || tgt === hoveredNode.id
      return getLinkColor(link.type, lit ? 0.45 : 0.04)
    },
    [hoveredNode]
  )

  const getLinkWidth = useCallback(
    link => {
      if (!hoveredNode) return 1.2
      const src = link.source?.id ?? link.source
      const tgt = link.target?.id ?? link.target
      return src === hoveredNode.id || tgt === hoveredNode.id ? 2.5 : 0.5
    },
    [hoveredNode]
  )

  const handleNodeHover = useCallback(node => {
    setHoveredNode(node || null)
    document.body.style.cursor = node ? 'pointer' : 'default'
  }, [])

  if (!graphData.nodes.length) {
    return (
      <div ref={containerRef} className="w-full h-full" style={{ background: '#090b10' }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          height: '100%', userSelect: 'none',
        }}>
          <div style={{ fontSize: 40, marginBottom: 14, color: 'var(--text-dim)' }}>⬡</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-mid)', marginBottom: 4 }}>
            Your network is empty
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-mut)' }}>
            Add people and connect them to see the graph
          </div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full" style={{ background: '#090b10' }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#090b10"
        nodeVal={node => node.val || 1}
        nodeLabel={() => ''}
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => 'replace'}
        nodePointerAreaPaint={nodePointerAreaPaint}
        linkColor={getLinkColorCb}
        linkWidth={getLinkWidth}
        linkCurvature={0.08}
        onNodeClick={onNodeClick}
        onNodeHover={handleNodeHover}
        warmupTicks={150}
        cooldownTicks={60}
        onEngineStop={() => fgRef?.current?.zoomToFit(500, 80)}
        d3AlphaDecay={0.015}
        d3VelocityDecay={0.25}
      />
    </div>
  )
}
