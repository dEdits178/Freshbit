import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import VerifyEmail from './pages/auth/VerifyEmail'
import Settings from './pages/settings/Settings'
import Unauthorized from './pages/errors/Unauthorized'
import NotFound from './pages/errors/NotFound'

const DashboardShell = ({ title }) => (
  <div className="min-h-screen bg-slate-50 p-6">
    <div className="mx-auto max-w-5xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-600">Welcome to FreshBit.</p>
    </div>
  </div>
)

const AdminRoutes = () => <DashboardShell title="Admin Dashboard" />
const CompanyRoutes = () => <DashboardShell title="Company Dashboard" />
const CollegeRoutes = () => <DashboardShell title="College Dashboard" />

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['COMPANY']} />}>
        <Route path="/company/*" element={<CompanyRoutes />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['COLLEGE']} />}>
        <Route path="/college/*" element={<CollegeRoutes />} />
      </Route>

      {/* Settings (all authenticated users) */}
      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COMPANY', 'COLLEGE']} />}>
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Error routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
