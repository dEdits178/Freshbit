import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { verifyEmail } from '../../services/authService'
import { useAuth } from '../../contexts/AuthContext'

const VerifyEmail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const { user, roleRedirectPath } = useAuth()

  const token = params.get('token') || ''

  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('Verifying your email...')
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const runVerification = async () => {
      if (!token) {
        setStatus('error')
        setMessage('Missing verification token. Please use the link from your email.')
        return
      }

      try {
        await verifyEmail(token)
        setStatus('success')
        setMessage('Email verified successfully! Redirecting to dashboard...')
      } catch (err) {
        setStatus('error')
        setMessage(err?.response?.data?.message || 'Verification failed or token expired.')
      }
    }

    runVerification()
  }, [token])

  useEffect(() => {
    if (status !== 'success') return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (user?.role) {
            navigate(roleRedirectPath(user.role), { replace: true })
          } else {
            navigate('/login', { replace: true })
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [status, navigate, user, roleRedirectPath])

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
          {status === 'loading' ? '⏳' : status === 'success' ? '✅' : '❌'}
        </div>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">Email Verification</h1>
        <p className="mt-3 text-slate-600">{message}</p>

        {status === 'success' && (
          <p className="mt-2 text-sm text-slate-500">Redirecting in {countdown} second(s)...</p>
        )}

        {status === 'error' && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-slate-500">
              If your link expired, request a new verification email by logging in again.
            </p>
            <Link
              to="/login"
              state={location.state}
              className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Go to login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
