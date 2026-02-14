import { Box } from 'lucide-react';
import EmptyState from '../../components/common/EmptyState';

const ModulePlaceholder = ({ title }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <EmptyState
        icon={Box}
        title={`${title} module is ready for implementation`}
        description="This enterprise layout and foundation is complete. Connect this module to backend APIs and business workflows in the next sprint."
      />
    </div>
  );
};

export default ModulePlaceholder;
