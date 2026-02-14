import { Outlet, useLocation } from 'react-router-dom';
import { useMemo, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { cn } from '../../utils/helpers';

const titleMap = {
  '/admin': { title: 'Admin Dashboard', subtitle: 'Platform-wide placement intelligence and controls' },
  '/admin/drives': { title: 'All Drives', subtitle: 'Review all placement drives across the platform' },
  '/admin/colleges': { title: 'Colleges', subtitle: 'Manage onboarding and compliance for institutions' },
  '/admin/companies': { title: 'Companies', subtitle: 'Track all partner companies and their drives' },
  '/admin/analytics': { title: 'Analytics', subtitle: 'Deep insights into placement performance' },
  '/admin/settings': { title: 'Settings', subtitle: 'Configure system policies and preferences' },
  '/company': { title: 'Company Dashboard', subtitle: 'Manage campus pipeline and hiring funnel' },
  '/company/drives': { title: 'My Drives', subtitle: 'Oversee all active and upcoming drives' },
  '/company/colleges': { title: 'Colleges', subtitle: 'Campus relationship and invitation management' },
  '/company/applications': { title: 'Applications', subtitle: 'Track student applications and outcomes' },
  '/company/schedule': { title: 'Schedule', subtitle: 'Interview and event calendar overview' },
  '/company/settings': { title: 'Settings', subtitle: 'Update organization and account preferences' },
  '/college': { title: 'College Dashboard', subtitle: 'Coordinate student readiness and placements' },
  '/college/invitations': { title: 'Invitations', subtitle: 'Respond to incoming drive invitations' },
  '/college/drives': { title: 'Drives', subtitle: 'Track all open drives for your students' },
  '/college/students': { title: 'Students', subtitle: 'Monitor eligibility, uploads, and progress' },
  '/college/schedule': { title: 'Schedule', subtitle: 'Manage assessments and interview windows' },
  '/college/settings': { title: 'Settings', subtitle: 'Configure institute profile and defaults' },
  '/settings': { title: 'Global Settings', subtitle: 'Personal profile and security controls' }
};

const AppShell = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const headerMeta = useMemo(() => {
    return titleMap[location.pathname] || {
      title: 'FreshBit Workspace',
      subtitle: 'Enterprise placement operations for modern campuses'
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
      <div className={cn('transition-all duration-300', collapsed ? 'ml-20' : 'ml-60')}>
        <Header title={headerMeta.title} subtitle={headerMeta.subtitle} />
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
