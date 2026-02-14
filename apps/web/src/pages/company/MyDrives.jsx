import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Grid as GridIcon, List as ListIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import DriveTable from '../../components/admin/DriveTable';
import DriveCard from '../../components/company/DriveCard';
import * as companyService from '../../services/companyService';

const MyDrives = () => {
  const navigate = useNavigate();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', stage: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem('company_view_mode') || 'grid'
  );

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const response = await companyService.getMyDrives({
        page,
        limit,
        search: debouncedSearch,
        status: activeTab === 'ALL' ? filters.status : activeTab,
        stage: filters.stage
      });
      const rows = response?.drives || response || [];
      const sorted = [...rows].sort((a, b) => {
        const aValue = a?.[sortBy];
        const bValue = b?.[sortBy];
        const compare = String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, {
          numeric: true,
          sensitivity: 'base'
        });
        return sortOrder === 'asc' ? compare : -compare;
      });
      setDrives(sorted);
      setTotal(response?.total || rows.length || 0);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load drives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrives();
  }, [page, limit, debouncedSearch, filters, sortBy, sortOrder, activeTab]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortOrder('asc');
  };

  const clearFilters = () => {
    setFilters({ status: '', stage: '' });
    setPage(1);
  };

  const tabCounts = useMemo(() => {
    const active = drives.filter((d) => d.status === 'PUBLISHED' || d.status === 'ACTIVE').length;
    const completed = drives.filter((d) => d.status === 'CLOSED' || d.status === 'COMPLETED').length;
    return { active, completed };
  }, [drives]);

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Drives</h1>
          <p className="text-gray-600">All drives created by your company</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {
            const nextMode = viewMode === 'grid' ? 'list' : 'grid';
            setViewMode(nextMode);
            localStorage.setItem('company_view_mode', nextMode);
          }}>
            {viewMode === 'grid' ? <ListIcon className="w-4 h-4 mr-1" /> : <GridIcon className="w-4 h-4 mr-1" />}
            {viewMode === 'grid' ? 'List View' : 'Grid View'}
          </Button>
          <Button onClick={() => navigate('/company/drives/create')}>Create Drive</Button>
        </div>
      </div>

      <Card padding="md">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input-base pl-9 pr-9"
              placeholder="Search by role, description..."
            />
            {search && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<SlidersHorizontal className="w-4 h-4" />} onClick={() => setFilterOpen((v) => !v)}>
              Filters
            </Button>
            <Button variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>

        {filterOpen && (
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              className="input-base"
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">All Status</option>
              <option value="PUBLISHED">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="CLOSED">Completed</option>
            </select>
            <select
              className="input-base"
              value={filters.stage}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, stage: e.target.value }));
                setPage(1);
              }}
            >
              <option value="">All Stages</option>
              {['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="text-sm text-gray-600 sm:col-span-2">Showing {startItem}-{endItem} of {total}</div>
          </div>
        )}
      </Card>

      {viewMode === 'list' ? (
        <DriveTable
          drives={drives.map((d) => ({
            id: d.id,
            role: d.roleTitle || d.role,
            companyName: d.company?.name || '',
            stage: d.currentStage,
            status: d.status === 'PUBLISHED' ? 'ACTIVE' : d.status,
            totalApplications: d._count?.applications || 0,
            createdAt: d.createdAt
          }))}
          loading={loading}
          onSort={handleSort}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onRowClick={(row) => navigate(`/company/drives/${row.id}`)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drives.map((d) => (
            <DriveCard
              key={d.id}
              drive={{
                id: d.id,
                companyName: d.company?.name || '',
                role: d.roleTitle || d.role,
                stage: d.currentStage,
                status: d.status === 'PUBLISHED' ? 'ACTIVE' : d.status,
                applicationsCount: d._count?.applications || 0,
                invitedCollegesCount: d.driveColleges?.length || 0
              }}
              onClick={() => navigate(`/company/drives/${d.id}`)}
              onEdit={() => navigate(`/company/drives/${d.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDrives;
