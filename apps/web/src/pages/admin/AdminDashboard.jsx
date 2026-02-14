import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Briefcase,
  Building2,
  Clock3,
  Plus,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { SkeletonStatCard, SkeletonTable } from '../../components/common/SkeletonLoader';
import CollegeModal from '../../components/admin/CollegeModal';
import * as adminService from '../../services/adminService';
import { formatNumber, formatTimeAgo } from '../../utils/helpers';

const AnimatedValue = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const duration = 650;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayValue(Math.floor(target * progress));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [value]);

  return formatNumber(displayValue);
};

const activityIconMap = {
  drive_created: Briefcase,
  college_added: Building2,
  company_added: Building2,
  drive_updated: Activity
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [activeDrives, setActiveDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collegeModalOpen, setCollegeModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, drivesData] = await Promise.all([
        adminService.getStats(),
        adminService.getDrives({ page: 1, limit: 5, status: 'ACTIVE' })
      ]);

      setStats(statsData);
      setRecentActivity(statsData?.recentActivity || []);
      setActiveDrives(drivesData?.drives || []);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = useMemo(
    () => [
      { title: 'Total Drives', value: stats?.totalDrives, icon: Briefcase, iconColor: 'orange', trend: 'Live metric' },
      { title: 'Active Drives', value: stats?.activeDrives, icon: Activity, iconColor: 'blue', trend: 'Currently running' },
      { title: 'Total Colleges', value: stats?.totalColleges, icon: Building2, iconColor: 'green', trend: 'Institution partners' },
      {
        title: 'Total Applications',
        value: stats?.totalApplications,
        icon: Users,
        iconColor: 'purple',
        trend: 'Candidate pipeline'
      }
    ],
    [stats]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Platform overview and management</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <SkeletonStatCard key={item} />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: { opacity: 1, transition: { staggerChildren: 0.08 } }
          }}
        >
          {statCards.map((card) => (
            <motion.div key={card.title} variants={{ hidden: { y: 16, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
              <StatCard title={card.title} value={<AnimatedValue value={card.value} />} icon={card.icon} iconColor={card.iconColor} trend={card.trend} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card hover onClick={() => setCollegeModalOpen(true)}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Add New College</h3>
              <p className="text-sm text-gray-600 mt-1">Create college account and onboarding credentials.</p>
            </div>
          </div>
        </Card>

        <Card hover onClick={() => navigate('/admin/drives')}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View All Drives</h3>
              <p className="text-sm text-gray-600 mt-1">Access all active, completed and draft drives.</p>
            </div>
          </div>
        </Card>

        <Card hover onClick={() => navigate('/admin/analytics')}>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">View Analytics</h3>
              <p className="text-sm text-gray-600 mt-1">Analyze hiring trends, top colleges and outcomes.</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Button variant="ghost" size="sm" onClick={fetchDashboardData}>
              Refresh
            </Button>
          </div>

          {loading ? (
            <SkeletonTable rows={8} />
          ) : (
            <div className="space-y-4">
              {recentActivity.slice(0, 10).map((activity, index) => {
                const Icon = activityIconMap[activity.type] || Clock3;
                return (
                  <motion.div
                    key={activity.id || index}
                    className="relative pl-8 pb-4 border-l border-gray-200"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <span className="absolute left-[-7px] top-1 w-3 h-3 rounded-full bg-accent-tan" />
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 mt-0.5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.user} • {formatTimeAgo(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div className="pt-2">
                <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                  View All Activity
                </Button>
              </div>
            </div>
          )}
        </Card>

        <Card padding="md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Active Drives</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin/drives')}>
              View All
            </Button>
          </div>

          {loading ? (
            <SkeletonTable rows={5} />
          ) : (
            <div className="space-y-3">
              {activeDrives.map((drive) => (
                <div key={drive.id} className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                  <p className="font-medium text-sm text-gray-900 truncate">{drive.role}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{drive.companyName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge status={drive.status} />
                    <button
                      onClick={() => navigate(`/admin/drives/${drive.id}`)}
                      className="text-xs text-accent-tan font-semibold hover:underline"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <CollegeModal isOpen={collegeModalOpen} onClose={() => setCollegeModalOpen(false)} mode="add" onSuccess={fetchDashboardData} />
    </div>
  );
};

export default AdminDashboard;
