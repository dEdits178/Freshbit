import { useEffect, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { SkeletonTable } from '../../components/common/SkeletonLoader';
import CollegeModal from '../../components/admin/CollegeModal';
import * as adminService from '../../services/adminService';
import { formatDate, formatNumber } from '../../utils/helpers';

const ManageColleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const response = await adminService.getColleges({ page, limit, search: debouncedSearch });
      const sorted = [...(response?.colleges || [])].sort((a, b) => {
        const aValue = a?.[sortBy];
        const bValue = b?.[sortBy];
        const compare = String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, {
          numeric: true,
          sensitivity: 'base'
        });
        return sortOrder === 'asc' ? compare : -compare;
      });
      setColleges(sorted);
      setTotal(response?.total || 0);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load colleges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, [page, debouncedSearch, sortBy, sortOrder]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(column);
    setSortOrder('asc');
  };

  const handleDelete = async () => {
    if (!selectedCollege?.id) return;

    setDeleting(true);
    try {
      await adminService.deleteCollege(selectedCollege.id);
      toast.success('College deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedCollege(null);
      fetchColleges();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete college');
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Colleges</h1>
          <p className="text-gray-600">Add, edit, and manage college profiles</p>
        </div>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setModalMode('add');
            setSelectedCollege(null);
            setModalOpen(true);
          }}
        >
          Add College
        </Button>
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
            placeholder="Search colleges by name or email..."
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
                {[
                  ['name', 'College Name'],
                  ['email', 'Email'],
                  ['organizationName', 'Organization Name'],
                  ['totalDrives', 'Total Drives'],
                  ['activeDrives', 'Active Drives'],
                  ['totalStudents', 'Students'],
                  ['isActive', 'Status'],
                  ['createdAt', 'Created Date']
                ].map(([key, label]) => (
                  <th
                    key={key}
                    className="px-4 py-3 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-600 cursor-pointer"
                    onClick={() => handleSort(key)}
                  >
                    {label}
                  </th>
                ))}
                <th className="px-4 py-3 border-b border-gray-200 text-left text-xs font-semibold uppercase text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {colleges.map((college) => (
                <tr key={college.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900">{college.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{college.email}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{college.organizationName}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatNumber(college.totalDrives)}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatNumber(college.activeDrives)}</td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatNumber(college.totalStudents)}</td>
                  <td className="px-4 py-4 text-sm">
                    <StatusBadge status={college.isActive ? 'ACTIVE' : 'INACTIVE'} />
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-700">{formatDate(college.createdAt)}</td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setModalMode('edit');
                          setSelectedCollege(college);
                          setModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Trash2 className="w-4 h-4 text-red-600" />}
                        onClick={() => {
                          setSelectedCollege(college);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Card padding="md">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
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

      <CollegeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        college={selectedCollege}
        onSuccess={fetchColleges}
      />

      <Modal isOpen={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} title="Delete College?" size="lg">
        <div className="space-y-4">
          <p className="text-gray-700">
            This will permanently delete <span className="font-semibold">{selectedCollege?.name}</span> and all associated data. This action cannot
            be undone.
          </p>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Impact: {selectedCollege?.totalStudents || 0} students, {selectedCollege?.totalDrives || 0} drives
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageColleges;
