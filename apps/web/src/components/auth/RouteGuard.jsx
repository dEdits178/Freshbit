import { Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const RouteGuard = ({ children }) => {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" />
          <p className="mt-3 text-sm text-slate-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return children || <Outlet />
}

export default RouteGuard
