import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Search, SlidersHorizontal, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import FilterPanel from '../../components/admin/FilterPanel';
import DriveTable from '../../components/admin/DriveTable';
import * as adminService from '../../services/adminService';
import { downloadCsv } from '../../utils/helpers';

const AllDrives = () => {
  const navigate = useNavigate();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', stage: '', company: '', dateFrom: '', dateTo: '' });
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filterOpen, setFilterOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchCompanies = async () => {
    try {
      const response = await adminService.getCompanies({ page: 1, limit: 200 });
      setCompanies(response?.companies || []);
    } catch {
      // silently fail for optional filter list
    }
  };

  const fetchDrives = async () => {
    setLoading(true);
    try {
      const response = await adminService.getDrives({
        page,
        limit,
        search: debouncedSearch,
        status: activeTab === 'ALL' ? filters.status : activeTab,
        stage: filters.stage,
        company: filters.company
      });

      let rows = response?.drives || [];
      if (filters.dateFrom) {
        rows = rows.filter((item) => new Date(item.createdAt) >= new Date(filters.dateFrom));
      }
      if (filters.dateTo) {
        rows = rows.filter((item) => new Date(item.createdAt) <= new Date(filters.dateTo));
      }

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
      setTotal(response?.total || 0);
      setTotalPages(response?.totalPages || 1);
      setSelectedIds([]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load drives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

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
    setFilters({ status: '', stage: '', company: '', dateFrom: '', dateTo: '' });
    setPage(1);
  };

  const exportRows = (ids = selectedIds) => {
    const exportData = drives
      .filter((drive) => (ids.length ? ids.includes(drive.id) : true))
      .map((drive) => ({
        Drive: drive.role,
        Company: drive.companyName,
        Stage: drive.stage,
        Status: drive.status,
        Applications: drive.totalApplications,
        CreatedAt: drive.createdAt
      }));

    if (!exportData.length) {
      toast.error('No rows available to export');
      return;
    }

    downloadCsv(exportData, `drives-${Date.now()}.csv`);
    toast.success('CSV exported successfully');
  };

  const tabCounts = useMemo(() => {
    const active = drives.filter((d) => d.status === 'ACTIVE').length;
    const completed = drives.filter((d) => d.status === 'COMPLETED').length;
    return { active, completed };
  }, [drives]);

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Drives</h1>
          <p className="text-gray-600">Manage all campus recruitment drives</p>
        </div>
        <span className="inline-flex px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">{total} drives</span>
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
              placeholder="Search by drive name, company..."
            />
            {search && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" onClick={() => setSearch('')}>
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" icon={<SlidersHorizontal className="w-4 h-4" />} onClick={() => setFilterOpen(true)}>
              Filters
            </Button>
            <Button variant="secondary" icon={<Download className="w-4 h-4" />} onClick={() => exportRows([])}>
              Export CSV
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {[
            { key: 'ALL', label: 'All Drives' },
            { key: 'ACTIVE', label: `Active (${tabCounts.active})` },
            { key: 'COMPLETED', label: `Completed (${tabCounts.completed})` }
          ].map((tab) => (
            <button
              key={tab.key}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                activeTab === tab.key
                  ? 'bg-accent-tan text-white border-accent-tan'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      <DriveTable
        drives={drives}
        loading={loading}
        onSort={handleSort}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onRowClick={(drive) => navigate(`/admin/drives/${drive.id}`)}
        selectable
        selectedIds={selectedIds}
        onSelect={setSelectedIds}
      />

      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white rounded-xl px-4 py-3 shadow-xl flex items-center gap-3">
          <span className="text-sm">{selectedIds.length} drives selected</span>
          <Button size="sm" variant="secondary" onClick={() => exportRows()}>
            Export
          </Button>
          <Button size="sm" variant="danger" onClick={() => toast('Bulk delete requires drive delete endpoint')}>
            Delete
          </Button>
          <Button size="sm" variant="danger" onClick={() => setSelectedIds([])}>
            Cancel Selection
          </Button>
        </div>
      )}

      <Card padding="md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-600">
            Showing {startItem}-{endItem} of {total}
          </p>
          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="input-base w-24"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-gray-700 px-2">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <FilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        companies={companies}
        onApply={(value) => {
          setFilters(value);
          setPage(1);
        }}
        onClear={clearFilters}
      />
    </div>
  );
};

export default AllDrives;
