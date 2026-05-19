import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import { dashboardService } from '../services/dashboardService'

const SKILL_COLORS = [
  'bg-violet-100 text-violet-700', 'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700', 'bg-indigo-100 text-indigo-700',
]

function skillColor(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return SKILL_COLORS[Math.abs(h) % SKILL_COLORS.length]
}

function Avatar({ name }) {
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 select-none text-xs"
      style={{ background: `hsl(${hue}, 55%, 50%)` }}
    >
      {initials}
    </div>
  )
}

function StatCard({ label, value, desc, colorClass, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`bg-white rounded-2xl border border-gray-200 p-5 text-left w-full ${
        onClick ? 'hover:border-gray-300 hover:shadow-sm transition cursor-pointer' : ''
      }`}
    >
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 truncate ${colorClass}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{desc}</p>
    </Tag>
  )
}

const QUICK_ACTIONS = [
  {
    label: 'Add person',
    desc: 'Add someone to your network',
    path: '/people',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
  },
  {
    label: 'Search network',
    desc: 'Find by skill or name',
    path: '/search',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    label: 'View graph',
    desc: 'Visualize your full network',
    path: '/graph',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <circle cx="6" cy="12" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="18" cy="18" r="2" />
        <path strokeLinecap="round" d="M8 12h8M7 10.5l9-3M7 13.5l9 3" />
      </svg>
    ),
  },
]

export default function DashboardPage() {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardService.getStats()
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{greeting}, {firstName}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening in your network</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="People"
          value={loading ? '—' : (stats?.total_people ?? 0)}
          desc="Contacts in your network"
          colorClass="text-blue-600"
          onClick={() => navigate('/people')}
        />
        <StatCard
          label="Connections"
          value={loading ? '—' : (stats?.total_connections ?? 0)}
          desc="Relationships mapped"
          colorClass="text-emerald-600"
          onClick={() => navigate('/graph')}
        />
        <StatCard
          label="Most connected"
          value={loading ? '—' : (stats?.most_connected?.name ?? 'None yet')}
          desc={
            stats?.most_connected
              ? `${stats.most_connected.connections_count} connection${stats.most_connected.connections_count !== 1 ? 's' : ''}`
              : 'Connect people to see this'
          }
          colorClass="text-amber-600"
        />
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick actions</p>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_ACTIONS.map(({ label, desc, path, icon }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="flex flex-col items-start gap-2 bg-white border border-gray-200 rounded-2xl px-4 py-4 text-left hover:border-blue-200 hover:bg-blue-50 transition group"
            >
              <span className="text-gray-500 group-hover:text-blue-600 transition">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recently added */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Recently added</p>
            {stats?.recent_people?.length > 0 && (
              <button
                onClick={() => navigate('/people')}
                className="text-xs text-blue-600 hover:underline"
              >
                View all
              </button>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[52px] bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : stats?.recent_people?.length > 0 ? (
            <div className="space-y-2">
              {stats.recent_people.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate('/people')}
                  className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:border-gray-200 cursor-pointer transition"
                >
                  <Avatar name={p.name} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    {(p.occupation || p.company) && (
                      <p className="text-xs text-gray-400 truncate">
                        {[p.occupation, p.company].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center">
              <p className="text-sm text-gray-400">No people added yet.</p>
              <button
                onClick={() => navigate('/people')}
                className="mt-1.5 text-xs text-blue-600 hover:underline"
              >
                Add your first contact
              </button>
            </div>
          )}
        </div>

        {/* Top skills */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Top skills in network
          </p>
          {loading ? (
            <div className="flex flex-wrap gap-2">
              {[80, 64, 96, 72, 56, 88].map((w) => (
                <div
                  key={w}
                  className="h-6 bg-gray-100 rounded-full animate-pulse"
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
          ) : stats?.top_skills?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stats.top_skills.map(({ skill, count }) => (
                <button
                  key={skill}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(skill)}`)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${skillColor(skill)} hover:opacity-80 transition`}
                  title={`${count} person${count !== 1 ? 's' : ''} with this skill`}
                >
                  {skill}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-200 px-4 py-6 text-center">
              <p className="text-sm text-gray-400">No skills recorded yet.</p>
              <p className="text-xs text-gray-400 mt-1">Add skills when creating contacts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
