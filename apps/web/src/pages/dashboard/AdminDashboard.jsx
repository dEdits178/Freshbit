import { useMemo, useState } from 'react';
import { Building2, FileSpreadsheet, TrendingUp, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import FileUpload from '../../components/common/FileUpload';
import { formatDate } from '../../utils/helpers';

const AdminDashboard = () => {
  const [file, setFile] = useState(null);

  const growthData = useMemo(
    () => [
      { month: 'Aug', applications: 240 },
      { month: 'Sep', applications: 410 },
      { month: 'Oct', applications: 520 },
      { month: 'Nov', applications: 610 },
      { month: 'Dec', applications: 770 },
      { month: 'Jan', applications: 940 }
    ],
    []
  );

  const drives = useMemo(
    () => [
      { id: 'D-101', company: 'StripeX Labs', college: 'NIT Raipur', status: 'ACTIVE', updatedAt: '2026-02-10' },
      { id: 'D-102', company: 'Notia Tech', college: 'IIT Bhubaneswar', status: 'COMPLETED', updatedAt: '2026-02-07' },
      { id: 'D-103', company: 'Linearbyte', college: 'DTU Delhi', status: 'DRAFT', updatedAt: '2026-02-05' }
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Applications" value="14,820" icon={FileSpreadsheet} iconColor="blue" trend="+12.4%" />
        <StatCard title="Partner Colleges" value="86" icon={Building2} iconColor="green" trend="+6 this month" />
        <StatCard title="Active Drives" value="41" icon={TrendingUp} iconColor="purple" trend="+18.9%" />
        <StatCard title="Students Engaged" value="9,420" icon={Users} iconColor="orange" trend="+840" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" padding="md">
          <h3 className="text-lg font-semibold text-gray-900">Application Growth Trend</h3>
          <p className="text-sm text-gray-500">Platform-wide engagement across recent cycles.</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ left: 0, right: 12, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="admin-growth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2D5F4C" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#2D5F4C" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Area type="monotone" dataKey="applications" stroke="#2D5F4C" fill="url(#admin-growth)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900">Bulk Drive Import</h3>
          <p className="text-sm text-gray-500 mb-4">Upload CSV/XLSX to create multiple drives in one step.</p>
          <FileUpload currentFile={file} onFileSelect={setFile} onRemove={() => setFile(null)} acceptedTypes={['.csv', '.xlsx']} />
        </Card>
      </div>

      <DataTable
        columns={[
          { key: 'id', header: 'Drive ID' },
          { key: 'company', header: 'Company' },
          { key: 'college', header: 'College' },
          { key: 'status', header: 'Status', render: (value) => <StatusBadge status={value} /> },
          { key: 'updatedAt', header: 'Last Updated', render: (value) => formatDate(value) }
        ]}
        data={drives}
        searchPlaceholder="Search drives by ID, company, college..."
      />
    </div>
  );
};

export default AdminDashboard;
