import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Activity, Users, CheckCircle, Plus, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { SkeletonCard, SkeletonStatCard } from '../../components/common/SkeletonLoader';
import * as companyService from '../../services/companyService';
import { formatDate } from '../../utils/helpers';

const STAGE_ORDER = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL'];

const StageProgress = ({ stage }) => {
  const currentIndex = Math.max(STAGE_ORDER.indexOf(stage), 0);
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-700">{stage || 'APPLICATIONS'}</p>
      <div className="flex gap-1">
        {STAGE_ORDER.map((name, index) => (
          <span key={name} className={`h-1.5 w-6 rounded-full ${index <= currentIndex ? 'bg-accent-tan' : 'bg-gray-200'}`} />
        ))}
      </div>
    </div>
  );
};

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentDrives, setRecentDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await companyService.getStats();
      setStats(data);
      setRecentDrives(data.recentDrives || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600">Here&apos;s an overview of your hiring activities</p>
        <p className="text-xs text-gray-500 mt-1">{formatDate(new Date().toISOString())}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="My Drives" value={stats?.myDrives ?? 0} icon={Briefcase} iconColor="blue" trend={`${stats?.activeDrives ?? 0} active`} />
        <StatCard title="Active Drives" value={stats?.activeDrives ?? 0} icon={Activity} iconColor="green" trend="In progress" />
        <StatCard title="Total Applications" value={stats?.totalApplications ?? 0} icon={Users} iconColor="purple" trend="Last 30 days" />
        <StatCard title="Students Selected" value={stats?.selectedStudents ?? 0} icon={CheckCircle} iconColor="green" trendUp />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card hover onClick={() => navigate('/company/drives/create')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">Create New Drive</p>
              <p className="text-sm text-gray-600">Start a new placement drive</p>
            </div>
            <motion.div className="p-3 rounded-xl bg-blue-100 text-blue-700" whileHover={{ scale: 1.05 }}>
              <Plus className="w-6 h-6" />
            </motion.div>
          </div>
          <Button className="mt-4">Get Started</Button>
        </Card>

        <Card hover onClick={() => navigate('/company/colleges')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">Browse Colleges</p>
              <p className="text-sm text-gray-600">Find colleges to invite</p>
            </div>
            <motion.div className="p-3 rounded-xl bg-indigo-100 text-indigo-700" whileHover={{ scale: 1.05 }}>
              <Building2 className="w-6 h-6" />
            </motion.div>
          </div>
          <Button className="mt-4" variant="outline">Explore</Button>
        </Card>

        <Card hover onClick={() => navigate('/company/applications')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold text-gray-900">View Applications</p>
              <p className="text-sm text-gray-600">Review student applications</p>
            </div>
            <motion.div className="p-3 rounded-xl bg-purple-100 text-purple-700" whileHover={{ scale: 1.05 }}>
              <Users className="w-6 h-6" />
            </motion.div>
          </div>
          <Button className="mt-4" variant="ghost">Open</Button>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Drives</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/company/drives')}>View All Drives</Button>
        </div>

        {recentDrives.length === 0 ? (
          <p className="text-sm text-gray-600">No recent drives found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentDrives.map((drive) => (
              <Card key={drive.id} hover onClick={() => navigate(`/company/drives/${drive.id}`)}>
                <p className="font-semibold text-gray-900">{drive.role}</p>
                <p className="text-sm text-gray-600">{drive.companyName}</p>
                <div className="mt-3">
                  <StageProgress stage={drive.stage} />
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge status={drive.status} />
                  <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-800 border border-gray-200">
                    {drive.applicationsCount ?? 0} applications
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button size="sm" variant="ghost">View</Button>
                  <Button size="sm" variant="outline">Edit</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default CompanyDashboard;
