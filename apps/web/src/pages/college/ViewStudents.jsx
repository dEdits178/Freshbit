import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Search, Filter, Download, Upload, Trash2,
    ChevronLeft, ChevronRight, Users, AlertCircle
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import * as collegeService from '../../services/collegeService';
import toast from 'react-hot-toast';

/**
 * ViewStudents Component
 * List and manage uploaded students for a drive
 */
const ViewStudents = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        branch: '',
        cgpaMin: '',
        cgpaMax: '',
        status: ''
    });
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');

    const limit = 20;

    useEffect(() => {
        fetchStudents();
    }, [page, search, filters, sortBy, sortOrder]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const data = await collegeService.getStudents(id, {
                page,
                limit,
                search,
                ...filters,
                sortBy,
                sortOrder
            });
            setStudents(data.students || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            console.error('Failed to load students:', error);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPage(1);
    };

    const handleClearFilters = () => {
        setFilters({
            branch: '',
            cgpaMin: '',
            cgpaMax: '',
            status: ''
        });
        setSearch('');
        setPage(1);
    };

    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const openDeleteDialog = (student) => {
        setSelectedStudent(student);
        setDeleteDialogOpen(true);
    };

    const handleDeleteStudent = async () => {
        if (!selectedStudent) return;

        setDeleting(true);
        try {
            await collegeService.deleteStudent(id, selectedStudent.id);
            toast.success('Student removed successfully');
            setDeleteDialogOpen(false);
            setSelectedStudent(null);
            fetchStudents();
        } catch (error) {
            console.error('Failed to delete student:', error);
            toast.error(error.response?.data?.message || 'Failed to remove student');
        } finally {
            setDeleting(false);
        }
    };

    const handleExport = async () => {
        try {
            await collegeService.exportStudents(id, { search, ...filters });
            toast.success('Students exported successfully');
        } catch (error) {
            console.error('Failed to export students:', error);
            toast.error('Failed to export students');
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            'NOT_APPLIED': 'default',
            'APPLIED': 'info',
            'IN_TEST': 'warning',
            'SHORTLISTED': 'purple',
            'IN_INTERVIEW': 'orange',
            'SELECTED': 'success',
            'REJECTED': 'danger'
        };

        const labels = {
            'NOT_APPLIED': 'Not Applied',
            'APPLIED': 'Applied',
            'IN_TEST': 'In Test',
            'SHORTLISTED': 'Shortlisted',
            'IN_INTERVIEW': 'In Interview',
            'SELECTED': 'Selected',
            'REJECTED': 'Rejected'
        };

        return (
            <Badge variant={variants[status] || 'default'}>
                {labels[status] || status}
            </Badge>
        );
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <button
                onClick={() => navigate(`/college/drives/${id}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Drive</span>
            </button>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Uploaded Students
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {total} student{total !== 1 ? 's' : ''} uploaded
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        leftIcon={Download}
                        onClick={handleExport}
                    >
                        Export
                    </Button>
                    <Button
                        variant="primary"
                        leftIcon={Upload}
                        onClick={() => navigate(`/college/drives/${id}/upload-students`)}
                    >
                        Upload More
                    </Button>
                </div>
            </div>

            {/* Search & Filters */}
            <Card>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="md:col-span-2">
                            <Input
                                type="text"
                                placeholder="Search by name, email, or roll number..."
                                value={search}
                                onChange={handleSearchChange}
                                leftIcon={Search}
                            />
                        </div>

                        <div>
                            <select
                                value={filters.branch}
                                onChange={(e) => handleFilterChange('branch', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">All Branches</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Information Technology">Information Technology</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Mechanical">Mechanical</option>
                                <option value="Civil">Civil</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                                <option value="">All Statuses</option>
                                <option value="NOT_APPLIED">Not Applied</option>
                                <option value="APPLIED">Applied</option>
                                <option value="IN_TEST">In Test</option>
                                <option value="SHORTLISTED">Shortlisted</option>
                                <option value="IN_INTERVIEW">In Interview</option>
                                <option value="SELECTED">Selected</option>
                                <option value="REJECTED">Rejected</option>
                            </select>
                        </div>
                    </div>

                    {(search || filters.branch || filters.status) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearFilters}
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>
            </Card>

            {/* Students Table */}
            {loading ? (
                <Card>
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </Card>
            ) : students.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={Users}
                        title="No students found"
                        description={search || filters.branch || filters.status
                            ? "Try adjusting your filters"
                            : "Upload students to get started"
                        }
                    />
                </Card>
            ) : (
                <Card padding="none">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Name
                                            {sortBy === 'name' && (
                                                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Phone
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('rollNo')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Roll No
                                            {sortBy === 'rollNo' && (
                                                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('branch')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Branch
                                            {sortBy === 'branch' && (
                                                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('cgpa')}
                                    >
                                        <div className="flex items-center gap-2">
                                            CGPA
                                            {sortBy === 'cgpa' && (
                                                <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                            )}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Year
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {students.map((student, index) => (
                                    <motion.tr
                                        key={student.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{student.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">{student.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">{student.phone}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">{student.rollNo}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">{student.branch}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">{student.cgpa}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">{student.graduationYear}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(student.applicationStatus || 'NOT_APPLIED')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDeleteDialog(student)}
                                                disabled={student.hasApplied}
                                                leftIcon={Trash2}
                                            >
                                                Remove
                                            </Button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} students
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    leftIcon={ChevronLeft}
                                >
                                    Previous
                                </Button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (page <= 3) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = page - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`
                          px-3 py-1 rounded text-sm font-medium transition-colors
                          ${page === pageNum
                                                        ? 'bg-primary-600 text-white'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                    }
                        `}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    rightIcon={ChevronRight}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* Delete Confirmation Dialog */}
            <Modal
                isOpen={deleteDialogOpen}
                onClose={() => !deleting && setDeleteDialogOpen(false)}
                title="Remove Student?"
            >
                {selectedStudent && (
                    <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-medium mb-1">Warning</p>
                                <p>This will remove the student from this placement drive. This action cannot be undone.</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <p className="font-semibold text-gray-900">{selectedStudent.name}</p>
                            <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                            <p className="text-sm text-gray-600">{selectedStudent.rollNo}</p>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialogOpen(false)}
                                fullWidth
                                disabled={deleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="danger"
                                onClick={handleDeleteStudent}
                                fullWidth
                                loading={deleting}
                            >
                                Remove Student
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ViewStudents;
