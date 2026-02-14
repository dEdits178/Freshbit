import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../services/authService'
import { validatePassword, validatePasswordMatch } from '../../utils/validation'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') || ''

  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!token) {
      setError('Invalid reset link. Missing token.')
      return
    }

    const passwordCheck = validatePassword(form.password)
    if (!passwordCheck.valid) {
      setError(passwordCheck.message)
      return
    }

    if (!validatePasswordMatch(form.password, form.confirmPassword)) {
      setError('Passwords do not match')
      return
    }

    try {
      setLoading(true)
      await resetPassword(token, form.password)
      setSuccess('Password reset successful. Redirecting to login...')
      setTimeout(() => navigate('/login', { replace: true }), 1500)
    } catch (err) {
      setError(err?.response?.data?.message || 'Reset link is invalid or expired')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Reset password</h1>
        <p className="mt-2 text-sm text-slate-600">Create a new password for your account.</p>

        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm new password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  )
}

export default ResetPassword
