import { Link } from 'react-router-dom'

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-3 text-slate-600">The page you are looking for does not exist.</p>

        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
