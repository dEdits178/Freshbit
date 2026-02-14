import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { validateEmail, validateRequired } from '../../utils/validation'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, roleRedirectPath } = useAuth()

  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    const emailRequired = validateRequired(form.email, 'Email')
    if (emailRequired) return emailRequired
    if (!validateEmail(form.email)) return 'Please enter a valid email address'

    const passwordRequired = validateRequired(form.password, 'Password')
    if (passwordRequired) return passwordRequired

    return null
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setLoading(true)
      const user = await login(form.email, form.password)
      const redirectTo = location.state?.from?.pathname || roleRedirectPath(user.role)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in to your FreshBit account.</p>

        {error && <p className="mt-4 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}

        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="email"
              aria-label="Email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 pr-20 outline-none focus:ring-2 focus:ring-indigo-500"
                autoComplete="current-password"
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-indigo-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600">
              <input type="checkbox" name="remember" checked={form.remember} onChange={onChange} />
              Remember me
            </label>
            <Link to="/forgot-password" className="text-indigo-600 hover:underline">Forgot password?</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}

export default Login
