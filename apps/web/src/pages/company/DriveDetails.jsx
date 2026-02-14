import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Layout, Building2, Users, CheckCircle, Edit, Trash2, 
  Download, Plus, ChevronRight, Clock, MapPin, Currency
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import StageProgressStepper from '../../components/company/StageProgressStepper';
import InviteCollegesModal from '../../components/company/InviteCollegesModal';
import { SkeletonCard, SkeletonTable } from '../../components/common/SkeletonLoader';
import * as companyService from '../../services/companyService';
import { formatCurrency, formatDate } from '../../utils/helpers';

const STAGE_ORDER = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL'];

const tabs = [
  { id: 'overview', label: 'Overview', icon: Layout },
  { id: 'colleges', label: 'Colleges', icon: Building2 },
  { id: 'applications', label: 'Applications', icon: Users },
  { id: 'selections', label: 'Selections', icon: CheckCircle }
];

const DriveDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  const fetchDrive = async () => {
    setLoading(true);
    try {
      const response = await companyService.getDriveById(id);
      setDrive(response);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load drive details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrive();
  }, [id]);

  const handlePublish = async () => {
    if (!drive?.id) return;
    setActionLoading(true);
    try {
      await companyService.publishDrive(drive.id);
      toast.success('Drive published successfully');
      fetchDrive();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to publish drive');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!drive?.id) return;
    if (!window.confirm('Are you sure you want to delete this drive?')) return;
    
    setActionLoading(true);
    try {
      await companyService.deleteDrive(drive.id);
      toast.success('Drive deleted successfully');
      navigate('/company/drives');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete drive');
    } finally {
      setActionLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    fetchDrive();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonTable rows={5} />
      </div>
    );
  }

  if (!drive) {
    return (
      <Card>
        <p className="text-gray-700">Drive not found.</p>
        <Button className="mt-3" variant="ghost" onClick={() => navigate('/company/drives')}>
          Back to My Drives
        </Button>
      </Card>
    );
  }

  // Process drive data
  const invitedColleges = (drive.driveColleges || []).map((dc) => ({
    id: dc.college?.id,
    name: dc.college?.name,
    city: dc.college?.city,
    state: dc.college?.state,
    status: dc.invitationStatus,
    managedBy: dc.managedBy || 'COLLEGE',
    invitedAt: dc.createdAt
  }));

  // Calculate stats
  const applicationStats = {
    total: drive._count?.applications || 0,
    invitedColleges: invitedColleges.length,
    shortlisted: 0, // Will be calculated from applications
    selected: 0
  };

  const stages = (drive.stages || []).map((s) => ({
    name: s.name,
    isCompleted: s.status === 'COMPLETED',
    isActive: s.status === 'ACTIVE'
  }));

  // Render Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Drive Information Card */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Drive Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="font-medium text-gray-900">{drive.roleTitle || drive.role || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">CTC</p>
            <p className="font-medium text-gray-900 flex items-center gap-2">
              <Currency className="w-4 h-4 text-gray-500" />
              {formatCurrency(drive.salary || drive.ctc)}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Description</p>
            <p className="font-medium text-gray-900">{drive.description || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              {drive.location || drive.company?.domain || '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Eligibility</p>
            <p className="font-medium text-gray-900">{drive.eligibility || 'Not specified'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Start Date</p>
            <p className="font-medium text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              {drive.startDate ? formatDate(drive.startDate) : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">End Date</p>
            <p className="font-medium text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              {drive.endDate ? formatDate(drive.endDate) : '-'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium text-gray-900">{drive.createdAt ? formatDate(drive.createdAt) : '-'}</p>
          </div>
        </div>
      </Card>

      {/* Stage Progress */}
      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Progress</h3>
        <StageProgressStepper 
          currentStage={drive.currentStage} 
          stages={stages}
        />
        {drive.status === 'DRAFT' && (
          <div className="mt-4 pt-4 border-t">
            <Button onClick={handlePublish} loading={actionLoading}>
              Publish Drive
            </Button>
          </div>
        )}
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md" hover onClick={() => setActiveTab('colleges')}>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{applicationStats.invitedColleges}</p>
            <p className="text-sm text-gray-600">Invited Colleges</p>
          </div>
        </Card>
        <Card padding="md" hover onClick={() => setActiveTab('applications')}>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{applicationStats.total}</p>
            <p className="text-sm text-gray-600">Applications</p>
          </div>
        </Card>
        <Card padding="md" hover onClick={() => setActiveTab('applications')}>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900">{applicationStats.shortlisted}</p>
            <p className="text-sm text-gray-600">Shortlisted</p>
          </div>
        </Card>
        <Card padding="md" hover onClick={() => setActiveTab('selections')}>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{applicationStats.selected}</p>
            <p className="text-sm text-gray-600">Selected</p>
          </div>
        </Card>
      </div>
    </div>
  );

  // Render Colleges Tab
  const renderColleges = () => (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Invited Colleges</h3>
        <Button 
          onClick={() => setInviteModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Invite More
        </Button>
      </div>

      {invitedColleges.length === 0 ? (
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No colleges invited yet</p>
          <Button 
            className="mt-3" 
            onClick={() => setInviteModalOpen(true)}
          >
            Invite Colleges
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {invitedColleges.map((college) => (
            <div key={college.id} className="p-4 rounded-lg border border-gray-200 bg-white">
              <p className="font-semibold text-gray-900">{college.name}</p>
              <p className="text-sm text-gray-600">{college.city}, {college.state}</p>
              <div className="mt-3 flex items-center gap-2">
                <StatusBadge status={college.status} />
                <StatusBadge status={college.managedBy} />
              </div>
              {college.invitedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Invited: {formatDate(college.invitedAt)}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  // Render Applications Tab
  const renderApplications = () => (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Applications</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => navigate(`/company/drives/${id}/applications`)}
          >
            View All Applications
          </Button>
          <Button 
            variant="outline"
            icon={<Download className="w-4 h-4" />}
          >
            Export
          </Button>
        </div>
      </div>
      <p className="text-gray-600">
        View and manage all applications for this drive.
      </p>
      <Button 
        className="mt-4"
        onClick={() => navigate(`/company/drives/${id}/applications`)}
      >
        Go to Applications
      </Button>
    </Card>
  );

  // Render Selections Tab
  const renderSelections = () => (
    <Card padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Final Selections</h3>
        <Button 
          variant="outline"
          icon={<Download className="w-4 h-4" />}
        >
          Export
        </Button>
      </div>
      <p className="text-gray-600">
        View students who have been selected in this drive.
      </p>
      <Button 
        className="mt-4"
        onClick={() => navigate(`/company/drives/${id}/selections`)}
      >
        Go to Selections
      </Button>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-sm text-gray-500 mb-1 flex items-center gap-1">
            <Link to="/company" className="hover:underline">Company</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/company/drives" className="hover:underline">My Drives</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-700">{drive.roleTitle || drive.role}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{drive.roleTitle || drive.role}</h1>
          <p className="text-gray-600">{drive.company?.name}</p>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={drive.status === 'PUBLISHED' ? 'ACTIVE' : drive.status} />
            <StatusBadge status={drive.currentStage} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" icon={<Edit className="w-4 h-4" />}>
            Edit
          </Button>
          <Button variant="outline" icon={<Download className="w-4 h-4" />}>
            Export
          </Button>
          {drive.status !== 'CLOSED' && (
            <Button 
              variant="outline" 
              icon={<Trash2 className="w-4 h-4" />}
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'colleges' && renderColleges()}
        {activeTab === 'applications' && renderApplications()}
        {activeTab === 'selections' && renderSelections()}
      </motion.div>

      {/* Invite Colleges Modal */}
      <InviteCollegesModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        driveId={id}
        onSuccess={handleInviteSuccess}
      />
    </div>
  );
};

export default DriveDetails;
