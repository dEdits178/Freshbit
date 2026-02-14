import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Download, ChevronLeft, ChevronRight, 
  Users, CheckCircle, Clock, XCircle, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { SkeletonTable } from '../../components/common/SkeletonLoader';
import * as companyService from '../../services/companyService';
import { formatDate } from '../../utils/helpers';

const STAGE_ORDER = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL'];

const statusConfig = {
  APPLIED: { color: 'bg-blue-100 text-blue-700', icon: Users },
  IN_TEST: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  SHORTLISTED: { color: 'bg-purple-100 text-purple-700', icon: CheckCircle },
  IN_INTERVIEW: { color: 'bg-orange-100 text-orange-700', icon: UserCheck },
  SELECTED: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
  REJECTED: { color: 'bg-red-100 text-red-700', icon: XCircle }
};

const ViewApplications = () => {
  const { id: driveId } = useParams();
  const navigate = useNavigate();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drive, setDrive] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({
    collegeId: '',
    status: '',
    stage: ''
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [colleges, setColleges] = useState([]);
  
  // Stats for the top cards
  const [stats, setStats] = useState({
    total: 0,
    inTest: 0,
    shortlisted: 0,
    inInterview: 0,
    selected: 0
  });

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    fetchDrive();
  }, [driveId]);

  useEffect(() => {
    fetchApplications();
  }, [driveId, page, debouncedSearch, filters]);

  const fetchDrive = async () => {
    try {
      const data = await companyService.getDriveById(driveId);
      setDrive(data);
      
      // Get unique colleges from drive
      const uniqueColleges = [];
      const seen = new Set();
      (data.driveColleges || []).forEach(dc => {
        if (dc.college && !seen.has(dc.college.id)) {
          seen.add(dc.college.id);
          uniqueColleges.push(dc.college);
        }
      });
      setColleges(uniqueColleges);
    } catch (error) {
      toast.error('Failed to load drive details');
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await companyService.getApplications(driveId, {
        page,
        limit,
        search: debouncedSearch,
        collegeId: filters.collegeId || undefined,
        status: filters.status || undefined,
        stage: filters.stage || undefined
      });
      
      const apps = response?.applications || response || [];
      setApplications(apps);
      setTotal(response?.total || apps.length || 0);
      
      // Calculate stats
      const newStats = {
        total: apps.length,
        inTest: apps.filter(a => a.status === 'IN_TEST').length,
        shortlisted: apps.filter(a => a.status === 'SHORTLISTED' || a.stage === 'SHORTLIST').length,
        inInterview: apps.filter(a => a.status === 'IN_INTERVIEW' || a.stage === 'INTERVIEW').length,
        selected: apps.filter(a => a.status === 'SELECTED' || a.stage === 'FINAL').length
      };
      setStats(newStats);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({ collegeId: '', status: '', stage: '' });
    setSearch('');
    setPage(1);
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Name', 'Email', 'College', 'Branch', 'CGPA', 'Status', 'Stage', 'Applied Date'];
    const rows = applications.map(app => [
      app.studentName || app.name || '',
      app.studentEmail || app.email || '',
      app.collegeName || app.college?.name || '',
      app.branch || '',
      app.cgpa || '',
      app.status || '',
      app.stage || '',
      app.appliedAt ? formatDate(app.appliedAt) : ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${drive?.roleTitle || 'drive'}-${Date.now()}.csv`;
    a.click();
  };

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  const totalPages = Math.ceil(total / limit);

  const statCards = [
    { label: 'Total', value: stats.total, icon: Users, color: 'blue' },
    { label: 'In Test', value: stats.inTest, icon: Clock, color: 'yellow' },
    { label: 'Shortlisted', value: stats.shortlisted, icon: CheckCircle, color: 'purple' },
    { label: 'Interview', value: stats.inInterview, icon: UserCheck, color: 'orange' },
    { label: 'Selected', value: stats.selected, icon: CheckCircle, color: 'green' }
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link to="/company" className="hover:underline">Company</Link>
        {' > '}
        <Link to="/company/drives" className="hover:underline">My Drives</Link>
        {' > '}
        <Link to={`/company/drives/${driveId}`} className="hover:underline">{drive?.roleTitle || 'Drive'}</Link>
        {' > '}
        <span className="text-gray-700">Applications</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600">{drive?.roleTitle || drive?.role || 'Loading...'}</p>
        </div>
        <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card 
              padding="sm" 
              hover 
              className="cursor-pointer"
              onClick={() => {
                if (stat.label === 'Total') clearFilters();
                else setFilters(prev => ({ ...prev, status: stat.label === 'Selected' ? 'SELECTED' : stat.label === 'Shortlisted' ? 'SHORTLISTED' : stat.label === 'Interview' ? 'IN_INTERVIEW' : stat.label === 'In Test' ? 'IN_TEST' : '' }));
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-600">{stat.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input-base pl-9 pr-9"
              placeholder="Search by name or email..."
            />
            {search && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearch('')}
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              className="input-base"
              value={filters.collegeId}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, collegeId: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">All Colleges</option>
              {colleges.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            
            <select
              className="input-base"
              value={filters.status}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, status: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="APPLIED">Applied</option>
              <option value="IN_TEST">In Test</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="IN_INTERVIEW">In Interview</option>
              <option value="SELECTED">Selected</option>
              <option value="REJECTED">Rejected</option>
            </select>
            
            <select
              className="input-base"
              value={filters.stage}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, stage: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">All Stages</option>
              {STAGE_ORDER.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            
            <Button variant="ghost" onClick={clearFilters}>Clear</Button>
          </div>
        </div>
      </Card>

      {/* Applications Table */}
      <Card padding="none">
        {loading ? (
          <SkeletonTable rows={10} />
        ) : applications.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No applications found</p>
            <Button variant="ghost" className="mt-2" onClick={clearFilters}>Clear Filters</Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Student</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">College</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Branch</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">CGPA</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Stage</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Applied</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, index) => {
                    const statusStyle = statusConfig[app.status] || statusConfig.APPLIED;
                    return (
                      <motion.tr
                        key={app.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-gray-900">{app.studentName || app.name || '-'}</p>
                            <p className="text-sm text-gray-500">{app.studentEmail || app.email || '-'}</p>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-700">{app.collegeName || app.college?.name || '-'}</td>
                        <td className="p-4 text-sm text-gray-700">{app.branch || '-'}</td>
                        <td className="p-4 text-sm text-gray-700">{app.cgpa || '-'}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyle.color}`}>
                            {app.status || 'APPLIED'}
                          </span>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={app.stage || 'APPLICATIONS'} />
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {app.appliedAt ? formatDate(app.appliedAt) : '-'}
                        </td>
                        <td className="p-4">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/company/drives/${driveId}/applications/${app.id}`)}
                          >
                            View
                          </Button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <p className="text-sm text-gray-600">
                  Showing {startItem}-{endItem} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default ViewApplications;
