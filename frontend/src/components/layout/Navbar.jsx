import { useAuthContext } from '../../context/AuthContext'

function Avatar({ name }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold select-none shrink-0"
      style={{ background: `hsl(${hue}, 55%, 50%)` }}
    >
      {initials}
    </div>
  )
}

export default function Navbar() {
  const { user, logout } = useAuthContext()

  return (
    <nav className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
      <div /> {/* spacer — page headings live inside pages */}

      <div className="flex items-center gap-3">
        {user && (
          <>
            <Avatar name={user.name} />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900 leading-tight">{user.name}</p>
              <p className="text-xs text-gray-400 leading-tight">{user.email}</p>
            </div>
            <button
              onClick={logout}
              className="ml-2 text-xs font-medium text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-lg transition"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
