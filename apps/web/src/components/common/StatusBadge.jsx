import { STATUS_COLORS } from '../../utils/constants';
import { cn } from '../../utils/helpers';

const StatusBadge = ({ status, className = '' }) => (
  <span
    className={cn(
      'badge',
      STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200',
      className
    )}
  >
    {status}
  </span>
);

export default StatusBadge;
