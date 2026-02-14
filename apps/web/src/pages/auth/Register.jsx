import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired
} from '../../utils/validation'

const Register = () => {
  const navigate = useNavigate()
  const { register, roleRedirectPath } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'COMPANY',
    organizationName: '',
    acceptedTerms: false
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const validate = () => {
    const requiredName = validateRequired(form.name, 'Name')
    if (requiredName) return requiredName

    if (!validateEmail(form.email)) return 'Please provide a valid email address'

    const passwordCheck = validatePassword(form.password)
    if (!passwordCheck.valid) return passwordCheck.message

    if (!validatePasswordMatch(form.password, form.confirmPassword)) {
      return 'Passwords do not match'
    }

    if (form.role === 'COLLEGE' && !form.organizationName.trim()) {
      return 'Organization name is required for COLLEGE role'
    }

    if (!form.acceptedTerms) {
      return 'You must accept the Terms & Conditions'
    }

    return null
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setLoading(true)

      const payload = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        organizationName: form.role === 'COLLEGE' ? form.organizationName : undefined
      })

      setSuccess('Registration successful. Please verify your email.')

      if (payload?.user && payload?.accessToken) {
        navigate(roleRedirectPath(payload.user.role), { replace: true })
      } else {
        navigate('/verify-email', { state: { email: form.email, fromRegister: true } })
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-slate-900">Create your FreshBit account</h1>
        <p className="mt-1 text-sm text-slate-600">Start managing placement workflows securely.</p>

        {error && <p className="mt-4 rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">{error}</p>}
        {success && <p className="mt-4 rounded-md bg-emerald-50 text-emerald-700 text-sm px-3 py-2">{success}</p>}

        <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirm password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={onChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-slate-700">Role</legend>
            <div className="mt-2 flex gap-6 text-sm">
              <label className="flex items-center gap-2 text-slate-700">
                <input type="radio" name="role" value="COMPANY" checked={form.role === 'COMPANY'} onChange={onChange} />
                Company
              </label>
              <label className="flex items-center gap-2 text-slate-700">
                <input type="radio" name="role" value="COLLEGE" checked={form.role === 'COLLEGE'} onChange={onChange} />
                College
              </label>
            </div>
          </fieldset>

          {form.role === 'COLLEGE' && (
            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-slate-700">Organization name</label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                value={form.organizationName}
                onChange={onChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-slate-600">
            <input type="checkbox" name="acceptedTerms" checked={form.acceptedTerms} onChange={onChange} className="mt-1" />
            I agree to the Terms & Conditions and Privacy Policy.
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
