import { useMemo } from 'react';
import { BookUser, CalendarCheck, GraduationCap, MailCheck } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/helpers';

const CollegeDashboard = () => {
  const students = useMemo(
    () => [
      { id: 'S-901', name: 'Nandini Rao', branch: 'CSE', status: 'SELECTED', drive: 'StripeX Labs', updatedAt: '2026-02-12' },
      { id: 'S-902', name: 'Tushar Jain', branch: 'ECE', status: 'IN_INTERVIEW', drive: 'Linearbyte', updatedAt: '2026-02-11' },
      { id: 'S-903', name: 'Fatima Noor', branch: 'IT', status: 'SHORTLISTED', drive: 'Notia Tech', updatedAt: '2026-02-10' }
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Eligible Students" value="1,240" icon={GraduationCap} iconColor="blue" trend="+34 recently" />
        <StatCard title="Active Invitations" value="26" icon={MailCheck} iconColor="purple" trend="5 pending action" />
        <StatCard title="Interviews Today" value="31" icon={CalendarCheck} iconColor="orange" trend="smooth schedule" />
        <StatCard title="Profiles Verified" value="902" icon={BookUser} iconColor="green" trend="72.7% complete" />
      </div>

      <DataTable
        columns={[
          { key: 'id', header: 'Student ID' },
          { key: 'name', header: 'Name' },
          { key: 'branch', header: 'Branch' },
          { key: 'drive', header: 'Drive' },
          { key: 'status', header: 'Status', render: (value) => <StatusBadge status={value} /> },
          { key: 'updatedAt', header: 'Updated', render: (value) => formatDate(value) }
        ]}
        data={students}
        searchPlaceholder="Search students, branches, or drives"
      />
    </div>
  );
};

export default CollegeDashboard;
