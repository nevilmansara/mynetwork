import { useState, useEffect } from 'react'
import { healthService } from '../services/healthService'

function StatusBadge({ label, status, loading }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
        <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-sm text-gray-500">{label}: checking…</span>
      </div>
    )
  }

  const ok = status === 'ok'
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
        ok ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className={`text-sm font-medium ${ok ? 'text-green-700' : 'text-red-700'}`}>
        {label}: {ok ? 'Connected ✓' : 'Error ✗'}
      </span>
    </div>
  )
}

export default function LoginPage() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    healthService
      .check()
      .then((res) => setHealth(res.data))
      .catch((err) => {
        setFetchError(err.message)
        setHealth({ api: 'error', database: 'error' })
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MyNetwork</h1>
          <p className="text-gray-500 mt-1">Your visual people network</p>
        </div>

        {/* System Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
            System Status
          </h2>
          <div className="flex flex-col gap-2">
            <StatusBadge label="API" status={health?.api} loading={loading} />
            <StatusBadge label="Database" status={health?.database} loading={loading} />
          </div>

          {!loading && health?.database === 'error' && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-600 font-mono break-all">
                {health.error || fetchError || 'Cannot reach Neo4j. Is Docker running?'}
              </p>
            </div>
          )}

          {!loading && health?.database === 'ok' && (
            <p className="text-xs text-gray-400 mt-3">
              Last checked: {health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '—'}
            </p>
          )}
        </div>

        {/* Login form placeholder — implemented in Phase 3 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-center text-gray-400 text-sm">
            Login form — coming in Phase 3
          </p>
        </div>
      </div>
    </div>
  )
}
