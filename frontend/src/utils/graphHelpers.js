// Category system — maps occupation keywords → visual category
export const CATEGORIES = {
  designer:  { label: 'Design',      color: '#C084FC' },
  developer: { label: 'Engineering', color: '#60A5FA' },
  finance:   { label: 'Finance',     color: '#4ADE80' },
  marketing: { label: 'Marketing',   color: '#FBBF24' },
  product:   { label: 'Product',     color: '#FB923C' },
  ops:       { label: 'Operations',  color: '#94A3B8' },
}

export function getCategory(occupation) {
  const o = (occupation || '').toLowerCase()
  if (/design|ui|ux|figma|brand|motion|creat|illustrat|visual/.test(o)) return 'designer'
  if (/engineer|developer|dev|backend|frontend|full.?stack|ml|ios|android|swift|python|java\b|go\b/.test(o)) return 'developer'
  if (/financ|cfo|investor|account|capital|vc\b|fund/.test(o)) return 'finance'
  if (/market|growth|seo|content|social|advertis/.test(o)) return 'marketing'
  if (/product|pm\b|founder|ceo|chief exec/.test(o)) return 'product'
  return 'ops'
}

export const LINK_COLORS = {
  colleague: '#60A5FA',
  friend:    '#4ADE80',
  family:    '#C084FC',
  mentor:    '#FBBF24',
  other:     '#94A3B8',
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function getNodeColor(occupation, alpha = 1) {
  const cat = getCategory(occupation)
  return hexToRgba(CATEGORIES[cat].color, alpha)
}

export function getLinkColor(type, alpha = 1) {
  return hexToRgba(LINK_COLORS[type] || LINK_COLORS.other, alpha)
}

export function getNodeRadius(val) {
  return Math.max(7, Math.sqrt((val || 1) + 1) * 4.5)
}
