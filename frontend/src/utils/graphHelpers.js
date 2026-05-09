// Transform API graph data into react-force-graph format
export function transformGraphData(apiData) {
  return {
    nodes: apiData.nodes || [],
    links: apiData.links || [],
  }
}

// Get node color by occupation category
export function getNodeColor(occupation, OCCUPATION_COLORS) {
  if (!occupation) return OCCUPATION_COLORS["Other"]
  const category = Object.keys(OCCUPATION_COLORS).find((cat) =>
    occupation.toLowerCase().includes(cat.toLowerCase())
  )
  return category ? OCCUPATION_COLORS[category] : OCCUPATION_COLORS["Other"]
}
