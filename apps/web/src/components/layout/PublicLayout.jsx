import { Link, NavLink, Outlet } from 'react-router-dom';
import { Command } from 'lucide-react';
import Logo from '../common/Logo';
import Button from '../common/Button';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/">
            <Logo size="md" />
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {[
              { to: '/', label: 'Home' },
              { to: '/features', label: 'Features' },
              { to: '/contact', label: 'Contact' }
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
              className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 sm:flex"
            >
              <Command className="h-3.5 w-3.5" /> Cmd/Ctrl + K
            </button>
            <Link to="/login">
              <Button size="sm">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} FreshBit. Enterprise placement operations platform.</p>
          <p>Built for colleges, companies, and administrators.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
