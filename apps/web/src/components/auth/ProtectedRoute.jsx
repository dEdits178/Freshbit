import { Navigate, Outlet } from 'react-router-dom'
import RouteGuard from './RouteGuard'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ allowedRoles = [], requireVerification = false, children }) => {
  const { isAuthenticated, user } = useAuth()

  return (
    <RouteGuard>
      {!isAuthenticated ? (
        <Navigate to="/login" replace />
      ) : requireVerification && !user?.emailVerified ? (
        <Navigate to="/verify-email" replace />
      ) : allowedRoles.length > 0 && !allowedRoles.includes(user?.role) ? (
        <Navigate to="/unauthorized" replace />
      ) : (
        children || <Outlet />
      )}
    </RouteGuard>
  )
}

export default ProtectedRoute
