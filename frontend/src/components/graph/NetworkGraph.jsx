import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { getNodeColor, getLinkColor, getNodeRadius } from '../../utils/graphHelpers'

export default function NetworkGraph({ graphData, onNodeClick, showLabels, fgRef, pathNodeIds }) {
  const containerRef = useRef()
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [hoveredNode, setHoveredNode] = useState(null)
  const pathSet = pathNodeIds ? new Set(pathNodeIds) : null

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

  // Neighbor set for the hovered node — used to dim unrelated nodes/links
  const highlightNodes = useMemo(() => {
    if (!hoveredNode) return null
    const set = new Set([hoveredNode.id])
    graphData.links.forEach((link) => {
      const src = link.source?.id ?? link.source
      const tgt = link.target?.id ?? link.target
      if (src === hoveredNode.id) set.add(tgt)
      if (tgt === hoveredNode.id) set.add(src)
    })
    return set
  }, [hoveredNode, graphData.links])

  const nodeCanvasObject = useCallback(
    (node, ctx, globalScale) => {
      const radius = getNodeRadius(node.val)
      const isLit = !highlightNodes || highlightNodes.has(node.id)
      const inPath = pathSet && pathSet.has(node.id)
      const alpha = isLit ? 1 : 0.12

      // Path highlight: yellow-orange fill overrides occupation color
      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI)
      if (inPath) {
        ctx.fillStyle = `rgba(251,146,60,${alpha})`  // orange-400
      } else {
        ctx.fillStyle = getNodeColor(node.occupation, alpha)
      }
      ctx.fill()

      // Path node outer ring (amber glow)
      if (inPath) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI)
        ctx.strokeStyle = `rgba(245,158,11,${isLit ? 0.8 : 0.1})`
        ctx.lineWidth = 2.5
        ctx.stroke()
      }

      // "You" ring for self node
      if (node.is_self && !inPath) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, radius + 3, 0, 2 * Math.PI)
        ctx.strokeStyle = getNodeColor(node.occupation, isLit ? 0.6 : 0.1)
        ctx.lineWidth = 2.5
        ctx.stroke()
      }

      // Label — always for self/path nodes, or when showLabels/zoomed
      const labelAlpha = isLit ? 1 : 0.12
      if (showLabels || node.is_self || inPath || globalScale > 2) {
        const fontSize = Math.min(13, Math.max(7, 11 / globalScale))
        ctx.font = `${node.is_self || inPath ? '600 ' : ''}${fontSize}px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        ctx.fillStyle = `rgba(17,24,39,${labelAlpha})`
        ctx.fillText(node.name, node.x, node.y + radius + 2)
      }
    },
    [highlightNodes, showLabels, pathSet]
  )

  const nodePointerAreaPaint = useCallback((node, color, ctx) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(node.x, node.y, getNodeRadius(node.val) + 4, 0, 2 * Math.PI)
    ctx.fill()
  }, [])

  const getLinkColorCb = useCallback(
    (link) => {
      const src = link.source?.id ?? link.source
      const tgt = link.target?.id ?? link.target
      const lit = !hoveredNode || src === hoveredNode.id || tgt === hoveredNode.id
      return getLinkColor(link.type, lit ? 0.75 : 0.08)
    },
    [hoveredNode]
  )

  const getLinkWidth = useCallback(
    (link) => {
      if (!hoveredNode) return 1.5
      const src = link.source?.id ?? link.source
      const tgt = link.target?.id ?? link.target
      return src === hoveredNode.id || tgt === hoveredNode.id ? 3 : 1
    },
    [hoveredNode]
  )

  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node || null)
    document.body.style.cursor = node ? 'pointer' : 'default'
  }, [])

  if (!graphData.nodes.length) {
    return (
      <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="text-center select-none">
          <div className="text-5xl mb-4">🕸️</div>
          <p className="text-gray-500 font-medium mb-1">Your network is empty</p>
          <p className="text-gray-400 text-sm">Add people and connect them to see the graph</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="#F9FAFB"
        nodeVal={(node) => node.val || 1}
        nodeLabel={(node) =>
          `<div style="font-family:system-ui;font-size:13px;padding:4px 8px;background:#1f2937;color:#fff;border-radius:6px">${node.name}${node.occupation ? `<br/><span style="opacity:.7;font-size:11px">${node.occupation}</span>` : ''}</div>`
        }
        nodeCanvasObject={nodeCanvasObject}
        nodeCanvasObjectMode={() => 'replace'}
        nodePointerAreaPaint={nodePointerAreaPaint}
        linkColor={getLinkColorCb}
        linkWidth={getLinkWidth}
        linkCurvature={0.1}
        onNodeClick={onNodeClick}
        onNodeHover={handleNodeHover}
        cooldownTicks={80}
        onEngineStop={() => fgRef?.current?.zoomToFit(400, 40)}
      />
    </div>
  )
}
