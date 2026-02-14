import { useEffect, useMemo, useState } from 'react';
import { Building2, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { SkeletonTable } from '../../components/common/SkeletonLoader';
import * as adminService from '../../services/adminService';
import { formatDate, formatNumber } from '../../utils/helpers';

const ManageCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await adminService.getCompanies({ page, limit, search: debouncedSearch });
      setCompanies(response?.companies || []);
      setTotal(response?.total || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [page, debouncedSearch]);

  const totalPages = useMemo(() => Math.max(Math.ceil(total / limit), 1), [total, limit]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Companies</h1>
        <p className="text-gray-600">Review and monitor company accounts on the platform</p>
      </div>

      <Card padding="md">
        <div className="relative max-w-xl">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className="input-base pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search companies by name or email..."
          />
        </div>
      </Card>

      <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={8} />
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Company Name', 'Email', 'Total Drives', 'Active Drives', 'Status', 'Created Date', 'Verification'].map((header) => (
                  <th key={header} className="px-4 py-3 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-600">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900">{company.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{company.email}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatNumber(company.totalDrives)}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatNumber(company.activeDrives)}</td>
                  <td className="px-4 py-4 text-sm">
                    <StatusBadge status={company.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatDate(company.createdAt)}</td>
                  <td className="px-4 py-4 text-sm">
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<ShieldCheck className="w-4 h-4" />}
                      onClick={() => toast.success(`${company.name} verified`)}
                    >
                      Verify
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Card padding="md">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 inline-flex items-center gap-1">
            <Building2 className="w-4 h-4" />
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
              Previous
            </Button>
            <span className="text-sm text-gray-700">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ManageCompanies;
