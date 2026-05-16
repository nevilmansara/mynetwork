import { useAuthContext } from '../context/AuthContext'

export default function DashboardPage() {
  const { user, logout } = useAuthContext()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        Welcome, {user?.name} 👋
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Your personal network is ready to grow.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'People', value: '—', desc: 'Contacts in your network' },
          { label: 'Connections', value: '—', desc: 'Relationships mapped' },
          { label: 'Your node', value: user?.name ?? '—', desc: 'You in the graph' },
        ].map(({ label, value, desc }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-gray-400">
        More features coming in the next phases — people, connections, and graph visualization.
      </p>
    </div>
  )
}
