import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../services/authService'
import { validateEmail } from '../../utils/validation'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setLoading(true)
      await requestPasswordReset(email)
      setSuccess('Check your email for reset link')
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to process request right now')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Forgot password?</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your registered email address and we&apos;ll send a password reset link.
        </p>

        {error && <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>}

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
