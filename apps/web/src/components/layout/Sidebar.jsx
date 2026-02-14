import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  Calendar,
  Settings,
  Mail,
  GraduationCap,
  ChevronLeft,
  LogOut,
  BarChart
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../common/Logo';
import { cn } from '../../utils/helpers';
import { ROLES } from '../../utils/constants';

const Sidebar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = {
    [ROLES.ADMIN]: [
      { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/admin/drives', icon: Briefcase, label: 'All Drives' },
      { path: '/admin/colleges', icon: Building2, label: 'Colleges' },
      { path: '/admin/companies', icon: Building2, label: 'Companies' },
      { path: '/admin/analytics', icon: BarChart, label: 'Analytics' },
      { path: '/admin/settings', icon: Settings, label: 'Settings' }
    ],
    [ROLES.COMPANY]: [
      { path: '/company', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/company/drives', icon: Briefcase, label: 'My Drives' },
      { path: '/company/colleges', icon: Building2, label: 'Colleges' },
      { path: '/company/applications', icon: Users, label: 'Applications' },
      { path: '/company/schedule', icon: Calendar, label: 'Schedule' },
      { path: '/company/settings', icon: Settings, label: 'Settings' }
    ],
    [ROLES.COLLEGE]: [
      { path: '/college', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/college/invitations', icon: Mail, label: 'Invitations' },
      { path: '/college/drives', icon: Briefcase, label: 'Drives' },
      { path: '/college/students', icon: GraduationCap, label: 'Students' },
      { path: '/college/schedule', icon: Calendar, label: 'Schedule' },
      { path: '/college/settings', icon: Settings, label: 'Settings' }
    ]
  };

  const items = menuItems[user?.role] || [];

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'fixed left-0 top-0 h-screen bg-primary-600 text-white transition-all duration-300 z-40 flex flex-col',
        collapsed ? 'w-20' : 'w-60'
      )}
    >
      <div className="p-6 border-b border-primary-500">
        <Logo variant="light" showText={!collapsed} size={collapsed ? 'sm' : 'md'} />
      </div>

      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
        {items.map((menuItem, index) => {
          const isActive = location.pathname === menuItem.path;
          const Icon = menuItem.icon;

          return (
            <motion.div
              key={menuItem.path}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
            >
              <Link
                to={menuItem.path}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative',
                  isActive ? 'bg-primary-700 text-white shadow-lg' : 'text-gray-300 hover:bg-primary-500 hover:text-white'
                )}
                title={collapsed ? menuItem.label : ''}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute inset-0 rounded-lg border border-primary-400/40"
                    transition={{ duration: 0.2 }}
                  />
                )}
                <Icon className="w-5 h-5 flex-shrink-0 relative z-10" />
                {!collapsed && <span className="font-medium relative z-10">{menuItem.label}</span>}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-4 border-t border-primary-500">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className={cn(
            'flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-primary-500 transition-colors cursor-pointer',
            collapsed && 'justify-center'
          )}
        >
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-300 truncate">{user?.email}</p>
            </div>
          )}
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={logout}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-gray-300 hover:bg-red-500/20 hover:text-red-200 w-full',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Sign Out' : ''}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Sign Out</span>}
        </motion.button>
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        className="absolute -right-3 top-6 w-6 h-6 bg-white border-2 border-primary-600 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft className={cn('w-4 h-4 text-primary-600 transition-transform duration-300', collapsed && 'rotate-180')} />
      </motion.button>
    </motion.aside>
  );
};

export default Sidebar;
