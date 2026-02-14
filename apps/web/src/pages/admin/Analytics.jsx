import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import Button from '../../components/common/Button';
import { SkeletonStatCard, SkeletonTable } from '../../components/common/SkeletonLoader';
import * as adminService from '../../services/adminService';
import { downloadCsv, formatNumber } from '../../utils/helpers';
import { Briefcase, Activity, Building2, Users } from 'lucide-react';

const STATUS_COLORS = ['#B08968', '#2D5F4C', '#4F46E5', '#EF4444'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [statsData, analyticsData] = await Promise.all([adminService.getStats(), adminService.getAnalytics()]);
      setStats(statsData);
      setAnalytics(analyticsData);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const statCards = useMemo(
    () => [
      { title: 'Total Drives', value: formatNumber(stats?.totalDrives), icon: Briefcase, iconColor: 'orange', trend: '+8% vs last month' },
      { title: 'Active Drives', value: formatNumber(stats?.activeDrives), icon: Activity, iconColor: 'blue', trend: '+2 this week' },
      { title: 'Total Colleges', value: formatNumber(stats?.totalColleges), icon: Building2, iconColor: 'green', trend: '+12 this quarter' },
      {
        title: 'Total Applications',
        value: formatNumber(stats?.totalApplications),
        icon: Users,
        iconColor: 'purple',
        trend: '+14.3% growth'
      }
    ],
    [stats]
  );

  const totalDrivesFromPie = useMemo(
    () => (analytics?.drivesByStatus || []).reduce((acc, item) => acc + Number(item.value || 0), 0),
    [analytics]
  );

  const exportReports = () => {
    const rows = [
      ...(analytics?.topColleges || []).map((item) => ({
        Type: 'Top College',
        Name: item.name,
        Applications: item.applications,
        Selections: item.selections
      })),
      ...(analytics?.topCompanies || []).map((item) => ({
        Type: 'Top Company',
        Name: item.name,
        Drives: item.drives,
        Selections: item.selections
      }))
    ];

    if (!rows.length) {
      toast.error('No analytics data available to export');
      return;
    }

    downloadCsv(rows, `analytics-report-${Date.now()}.csv`);
    toast.success('Analytics report exported');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Data insights across drives, colleges, and companies</p>
        </div>
        <Button icon={<Download className="w-4 h-4" />} onClick={exportReports}>
          Export Reports
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((item) => (
            <SkeletonStatCard key={item} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <StatCard key={card.title} {...card} />
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.applicationsOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="applications" stroke="#B08968" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Drives by Status</h3>
          <div className="h-80 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.drivesByStatus || []} cx="50%" cy="50%" innerRadius={70} outerRadius={110} dataKey="value" label>
                  {(analytics?.drivesByStatus || []).map((entry, index) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">{formatNumber(totalDrivesFromPie)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Colleges</h3>
          {loading ? (
            <SkeletonTable rows={8} />
          ) : (
            <div className="space-y-2">
              {(analytics?.topColleges || []).slice(0, 10).map((college, index) => {
                const selectionRate = college.applications ? ((college.selections / college.applications) * 100).toFixed(1) : '0.0';
                return (
                  <div key={college.name} className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-gray-100 last:border-b-0">
                    <span className="col-span-1 text-gray-500">#{index + 1}</span>
                    <span className="col-span-4 font-medium text-gray-900 truncate">{college.name}</span>
                    <span className="col-span-2 text-gray-700">{formatNumber(college.applications)}</span>
                    <span className="col-span-2 text-gray-700">{formatNumber(college.selections)}</span>
                    <span className="col-span-3 text-gray-700">{selectionRate}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Companies</h3>
          {loading ? (
            <SkeletonTable rows={8} />
          ) : (
            <div className="space-y-2">
              {(analytics?.topCompanies || []).slice(0, 10).map((company, index) => (
                <div key={company.name} className="grid grid-cols-12 gap-2 items-center text-sm py-2 border-b border-gray-100 last:border-b-0">
                  <span className="col-span-1 text-gray-500">#{index + 1}</span>
                  <span className="col-span-5 font-medium text-gray-900 truncate">{company.name}</span>
                  <span className="col-span-2 text-gray-700">{formatNumber(company.drives)}</span>
                  <span className="col-span-2 text-gray-700">{formatNumber(company.selections)}</span>
                  <span className="col-span-2 text-gray-700">{formatNumber(company.applications || 0)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
