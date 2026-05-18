import { OCCUPATION_COLORS } from './constants'

export const LINK_COLORS = {
  colleague: '#3B82F6',
  friend:    '#10B981',
  family:    '#8B5CF6',
  mentor:    '#F59E0B',
  other:     '#9CA3AF',
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function getNodeColor(occupation, alpha = 1) {
  if (!occupation) return hexToRgba(OCCUPATION_COLORS['Other'], alpha)
  const key = Object.keys(OCCUPATION_COLORS).find((k) =>
    occupation.toLowerCase().includes(k.toLowerCase())
  )
  return hexToRgba(key ? OCCUPATION_COLORS[key] : OCCUPATION_COLORS['Other'], alpha)
}

export function getLinkColor(type, alpha = 1) {
  return hexToRgba(LINK_COLORS[type] || LINK_COLORS.other, alpha)
}

export function getNodeRadius(val) {
  return Math.max(7, Math.sqrt((val || 1) + 1) * 4.5)
}
