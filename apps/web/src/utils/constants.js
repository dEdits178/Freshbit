export const ROLES = {
  ADMIN: 'ADMIN',
  COMPANY: 'COMPANY',
  COLLEGE: 'COLLEGE'
};

export const DRIVE_STAGES = {
  APPLICATIONS: 'APPLICATIONS',
  TEST: 'TEST',
  SHORTLIST: 'SHORTLIST',
  INTERVIEW: 'INTERVIEW',
  FINAL: 'FINAL'
};

export const APPLICATION_STATUS = {
  APPLIED: 'APPLIED',
  IN_TEST: 'IN_TEST',
  SHORTLISTED: 'SHORTLISTED',
  IN_INTERVIEW: 'IN_INTERVIEW',
  SELECTED: 'SELECTED',
  REJECTED: 'REJECTED'
};

export const DRIVE_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED'
};

export const INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
};

export const STATUS_COLORS = {
  APPLIED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_TEST: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SHORTLISTED: 'bg-purple-100 text-purple-800 border-purple-200',
  IN_INTERVIEW: 'bg-orange-100 text-orange-800 border-orange-200',
  SELECTED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  PENDING: 'bg-gray-100 text-gray-800 border-gray-200',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-200',
  ACTIVE: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  DRAFT: 'bg-yellow-100 text-yellow-800 border-yellow-200'
};

export const ICON_BG_COLORS = {
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  red: 'bg-red-100 text-red-600',
  gray: 'bg-gray-100 text-gray-600'
};

export const COMMAND_ITEMS = [
  { label: 'Public Home', path: '/', icon: 'Home' },
  { label: 'Features', path: '/features', icon: 'Sparkles' },
  { label: 'Contact', path: '/contact', icon: 'Mail' },
  { label: 'Admin Dashboard', path: '/admin', icon: 'LayoutDashboard' },
  { label: 'Company Dashboard', path: '/company', icon: 'Building2' },
  { label: 'College Dashboard', path: '/college', icon: 'GraduationCap' },
  { label: 'Settings', path: '/settings', icon: 'Settings' }
];
