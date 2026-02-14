import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { Search, Home, Sparkles, Mail, LayoutDashboard, Settings, Building2, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';

const iconMap = {
  home: Home,
  sparkles: Sparkles,
  mail: Mail,
  dashboard: LayoutDashboard,
  settings: Settings,
  building: Building2,
  college: GraduationCap
};

const CommandPalette = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('open-command-palette', onOpen);
    return () => window.removeEventListener('open-command-palette', onOpen);
  }, []);

  const items = useMemo(() => {
    const base = [
      { label: 'Home', path: '/', icon: 'home' },
      { label: 'Features', path: '/features', icon: 'sparkles' },
      { label: 'Contact', path: '/contact', icon: 'mail' },
      { label: 'Login', path: '/login', icon: 'dashboard' }
    ];

    if (user?.role === 'ADMIN') {
      base.push({ label: 'Admin Dashboard', path: '/admin', icon: 'dashboard' });
    }
    if (user?.role === 'COMPANY') {
      base.push({ label: 'Company Dashboard', path: '/company', icon: 'building' });
    }
    if (user?.role === 'COLLEGE') {
      base.push({ label: 'College Dashboard', path: '/college', icon: 'college' });
    }

    if (user) {
      base.push({ label: 'Settings', path: '/settings', icon: 'settings' });
    }

    return base;
  }, [user]);

  const onSelect = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[70] bg-black/35 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[14vh] left-1/2 -translate-x-1/2 z-[80] w-[95%] max-w-2xl"
          >
            <Command className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center gap-2 border-b border-gray-200 px-4">
                <Search className="h-4 w-4 text-gray-400" />
                <Command.Input
                  autoFocus
                  placeholder="Search pages, dashboards, and settings..."
                  className="h-12 w-full bg-transparent text-sm outline-none"
                />
              </div>
              <Command.List className="max-h-[360px] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-8 text-center text-sm text-gray-500">
                  No results found.
                </Command.Empty>
                <Command.Group heading="Quick Navigation" className="text-xs text-gray-500">
                  {items.map((item) => {
                    const Icon = iconMap[item.icon] || Home;
                    return (
                      <Command.Item
                        key={item.path}
                        value={`${item.label} ${item.path}`}
                        onSelect={() => onSelect(item.path)}
                        className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-gray-700 aria-selected:bg-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </div>
                        <span className="text-xs text-gray-400">{item.path}</span>
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
