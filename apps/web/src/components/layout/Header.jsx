import { useMemo, useState } from 'react';
import { Bell, Command, Search, UserCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';

const Header = ({ title = 'Dashboard', subtitle = 'Track your platform at a glance' }) => {
  const { user } = useAuth();
  const [openNotifications, setOpenNotifications] = useState(false);

  const notifications = useMemo(
    () => [
      { id: 1, title: 'New drive invitation accepted', time: '2 min ago' },
      { id: 2, title: 'Interview stage updated for 12 candidates', time: '1 hour ago' },
      { id: 3, title: 'Profile sync completed successfully', time: 'Today' }
    ],
    []
  );

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/85 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex border border-gray-200"
            icon={<Command className="w-4 h-4" />}
            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
          >
            Cmd/Ctrl + K
          </Button>

          <button
            className="relative p-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            onClick={() => setOpenNotifications((prev) => !prev)}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-status-orange" />
          </button>

          <div className="hidden md:flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <UserCircle2 className="w-5 h-5 text-gray-500" />
            <div className="text-left leading-tight">
              <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {openNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-6 top-20 w-[360px] rounded-xl border border-gray-200 bg-white shadow-xl p-3"
          >
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div key={notification.id} className="rounded-lg px-3 py-2 hover:bg-gray-50">
                  <p className="text-sm font-medium text-gray-800">{notification.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{notification.time}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
