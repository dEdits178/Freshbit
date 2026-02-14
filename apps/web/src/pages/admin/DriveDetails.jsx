import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  MapPin,
  Play,
  Shield,
  XCircle
} from 'lucide-react';
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { SkeletonTable } from '../../components/common/SkeletonLoader';
import * as adminService from '../../services/adminService';
import { formatCurrency, formatDate, formatNumber } from '../../utils/helpers';

const STAGE_ORDER = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL'];
const STATUS_COLORS = ['#B08968', '#4F46E5', '#10B981', '#EF4444', '#F59E0B', '#6B7280'];

const DriveDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDrive = async () => {
    setLoading(true);
    try {
      const response = await adminService.getDriveById(id);
      setDrive(response);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load drive details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDrive();
  }, [id]);

  const statusChartData = useMemo(() => {
    const byStatus = drive?.applicationStats?.byStatus || {};
    return Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  }, [drive]);

  const handleActivateNextStage = async () => {
    if (!drive?.id) return;
    setActionLoading(true);
    try {
      await adminService.activateNextStage(drive.id);
      toast.success('Moved to next stage successfully');
      fetchDrive();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to activate next stage');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseDrive = async () => {
    if (!drive?.id) return;
    setActionLoading(true);
    try {
      await adminService.closeDrive(drive.id);
      toast.success('Drive closed successfully');
      fetchDrive();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to close drive');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonTable rows={10} />
      </div>
    );
  }

  if (!drive) {
    return (
      <Card>
        <p className="text-gray-700">Drive not found.</p>
        <Button className="mt-3" variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/admin/drives')}>
          Back to Drives
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500 mb-1">
            <Link to="/admin" className="hover:underline">
              Admin
            </Link>{' '}
            &gt;{' '}
            <Link to="/admin/drives" className="hover:underline">
              All Drives
            </Link>{' '}
            &gt; <span className="text-gray-700">{drive.role}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{drive.role}</h1>
          <p className="text-gray-600">{drive.companyName}</p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={drive.status} />
            <StatusBadge status={drive.stage} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => toast('Edit flow can be connected to drive edit API')}>Edit</Button>
          <Button variant="danger" onClick={handleCloseDrive} loading={actionLoading}>
            Close Drive
          </Button>
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Drive Information</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <p>
            <span className="text-gray-500">Role:</span> <span className="font-medium text-gray-900">{drive.role}</span>
          </p>
          <p>
            <span className="text-gray-500">CTC:</span> <span className="font-medium text-gray-900">{formatCurrency(drive.ctc)}</span>
          </p>
          <p>
            <span className="text-gray-500 inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Location:
            </span>{' '}
            <span className="font-medium text-gray-900">{drive.location || '-'}</span>
          </p>
          <p>
            <span className="text-gray-500 inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Timeline:
            </span>{' '}
            <span className="font-medium text-gray-900">
              {formatDate(drive.startDate)} - {formatDate(drive.endDate)}
            </span>
          </p>
          <p className="md:col-span-2">
            <span className="text-gray-500">Eligibility:</span> <span className="font-medium text-gray-900">{drive.eligibility || '-'}</span>
          </p>
          <p className="md:col-span-2">
            <span className="text-gray-500">Description:</span> <span className="font-medium text-gray-900">{drive.description || '-'}</span>
          </p>
          <p className="md:col-span-2">
            <span className="text-gray-500">Managed By:</span>{' '}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 border border-gray-200">
              <Shield className="w-3.5 h-3.5" />
              {drive.managedBy}
            </span>
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Stage Progress</h3>
          {drive.managedBy === 'ADMIN' && (
            <Button icon={<Play className="w-4 h-4" />} onClick={handleActivateNextStage} loading={actionLoading}>
              Activate Next Stage
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {STAGE_ORDER.map((stage) => {
            const stageState = drive.stages?.find((item) => item.name === stage);
            const isCompleted = stageState?.isCompleted;
            const isActive = stageState?.isActive;

            return (
              <div
                key={stage}
                className={`rounded-lg border p-3 ${
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : isActive
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-700">{stage}</p>
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : isActive ? (
                    <Play className="w-4 h-4 text-blue-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Invited Colleges</h3>
            <Button variant="outline" icon={<Building2 className="w-4 h-4" />} onClick={() => toast('Invite flow can be connected to API')}>
              Invite More Colleges
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">College Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Invitation Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Students</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase border-b border-gray-200">Applications</th>
                </tr>
              </thead>
              <tbody>
                {(drive.invitedColleges || []).map((college) => (
                  <tr key={college.id} className="hover:bg-gray-50 border-b border-gray-100">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{college.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <StatusBadge status={college.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatNumber(college.studentsUploaded)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatNumber(college.applicationsCount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Statistics</h3>
          <div className="mb-3 rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Total Applications</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(drive.applicationStats?.total)}</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" outerRadius={80} innerRadius={40}>
                  {statusChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Override Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" icon={<Play className="w-4 h-4" />} onClick={handleActivateNextStage} loading={actionLoading}>
            Activate Next Stage
          </Button>
          <Button variant="outline" icon={<AlertTriangle className="w-4 h-4" />} onClick={() => toast('Bulk rejection flow can be connected')}>
            Reject Applications
          </Button>
          <Button variant="danger" icon={<XCircle className="w-4 h-4" />} onClick={handleCloseDrive} loading={actionLoading}>
            Close Drive Early
          </Button>
          <Button variant="ghost" icon={<Shield className="w-4 h-4" />} onClick={() => toast('Force stage change requires explicit API')}>
            Force Stage Change
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DriveDetails;
