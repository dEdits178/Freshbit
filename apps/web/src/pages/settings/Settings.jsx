import { useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { validatePassword, validatePasswordMatch } from '../../utils/validation'

const Settings = () => {
  const { user, updateProfile, changePassword } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    organizationName: user?.organizationName || ''
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const roleBadgeClass = useMemo(() => {
    if (user?.role === 'ADMIN') return 'bg-purple-100 text-purple-700'
    if (user?.role === 'COMPANY') return 'bg-blue-100 text-blue-700'
    return 'bg-emerald-100 text-emerald-700'
  }, [user?.role])

  const submitProfile = async (e) => {
    e.preventDefault()
    setProfileError('')
    setProfileMessage('')

    try {
      setProfileLoading(true)
      await updateProfile(profileForm)
      setProfileMessage('Profile updated successfully.')
    } catch (err) {
      setProfileError(err?.response?.data?.message || 'Unable to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const submitPassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordMessage('')

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      setPasswordError('All password fields are required')
      return
    }

    const passwordCheck = validatePassword(passwordForm.newPassword)
    if (!passwordCheck.valid) {
      setPasswordError(passwordCheck.message)
      return
    }

    if (!validatePasswordMatch(passwordForm.newPassword, passwordForm.confirmNewPassword)) {
      setPasswordError('New password and confirm password must match')
      return
    }

    try {
      setPasswordLoading(true)
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordMessage('Password changed successfully. Please login again.')
    } catch (err) {
      setPasswordError(err?.response?.data?.message || 'Unable to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        </div>

        <div className="px-6 pt-4">
          <div className="flex gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab('profile')}
              className={`rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'profile' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`rounded-md px-3 py-2 text-sm font-medium ${activeTab === 'security' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              Security
            </button>
          </div>
        </div>

        <div className="px-6 py-6">
          {activeTab === 'profile' ? (
            <form onSubmit={submitProfile} className="space-y-4">
              {profileError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{profileError}</p>}
              {profileMessage && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{profileMessage}</p>}

              <div>
                <label className="block text-sm font-medium text-slate-700">Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-500"
                />
              </div>

              {user?.role === 'COLLEGE' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Organization name</label>
                  <input
                    type="text"
                    value={profileForm.organizationName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, organizationName: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-slate-700">Role</p>
                <span className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleBadgeClass}`}>
                  {user?.role}
                </span>
              </div>

              <button
                type="submit"
                disabled={profileLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {profileLoading ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitPassword} className="space-y-4">
              {passwordError && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{passwordError}</p>}
              {passwordMessage && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{passwordMessage}</p>}

              <div>
                <label className="block text-sm font-medium text-slate-700">Current password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">New password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm new password</label>
                <input
                  type="password"
                  value={passwordForm.confirmNewPassword}
                  onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmNewPassword: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {passwordLoading ? 'Changing...' : 'Change password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
