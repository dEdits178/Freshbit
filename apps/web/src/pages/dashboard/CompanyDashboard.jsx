import { useMemo } from 'react';
import { Briefcase, CalendarClock, CheckCircle2, Users2 } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/helpers';

const CompanyDashboard = () => {
  const applications = useMemo(
    () => [
      { id: 'A-201', candidate: 'Riya Sen', college: 'IIIT Lucknow', stage: 'IN_INTERVIEW', updatedAt: '2026-02-12' },
      { id: 'A-202', candidate: 'Karthik R', college: 'NIT Durgapur', stage: 'SHORTLISTED', updatedAt: '2026-02-11' },
      { id: 'A-203', candidate: 'Aman Gupta', college: 'NSUT Delhi', stage: 'SELECTED', updatedAt: '2026-02-09' }
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Open Drives" value="12" icon={Briefcase} iconColor="blue" trend="3 closing this week" />
        <StatCard title="Total Applicants" value="3,480" icon={Users2} iconColor="purple" trend="+19.2%" />
        <StatCard title="Interviews Scheduled" value="142" icon={CalendarClock} iconColor="orange" trend="+28 today" />
        <StatCard title="Final Selections" value="67" icon={CheckCircle2} iconColor="green" trend="+8 this week" />
      </div>

      <Card padding="md">
        <h3 className="text-lg font-semibold text-gray-900">Pipeline Highlights</h3>
        <p className="mt-1 text-sm text-gray-600">Real-time view of top progressing candidates across all your drives.</p>
      </Card>

      <DataTable
        columns={[
          { key: 'id', header: 'Application ID' },
          { key: 'candidate', header: 'Candidate' },
          { key: 'college', header: 'College' },
          { key: 'stage', header: 'Current Stage', render: (value) => <StatusBadge status={value} /> },
          { key: 'updatedAt', header: 'Updated', render: (value) => formatDate(value) }
        ]}
        data={applications}
        searchPlaceholder="Search candidates, colleges, or application IDs"
      />
    </div>
  );
};

export default CompanyDashboard;
