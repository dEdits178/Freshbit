import { motion } from 'framer-motion';
import { Building2, Users, Eye, Pencil } from 'lucide-react';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';

const STAGE_ORDER = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL'];

const StageProgress = ({ stage }) => {
  const currentIndex = Math.max(STAGE_ORDER.indexOf(stage), 0);
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-700">{stage || 'APPLICATIONS'}</p>
      <div className="flex gap-1">
        {STAGE_ORDER.map((name, index) => (
          <span
            key={name}
            className={`h-1.5 w-6 rounded-full ${index <= currentIndex ? 'bg-accent-tan' : 'bg-gray-200'}`}
          />
        ))}
      </div>
    </div>
  );
};

const DriveCard = ({ drive, onClick, onEdit }) => {
  return (
    <Card
      hover
      onClick={onClick}
      className="group relative cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{drive.role}</p>
          <p className="text-sm text-gray-600 truncate">{drive.companyName}</p>
        </div>
        <StatusBadge status={drive.status} />
      </div>

      <div className="mt-3">
        <StageProgress stage={drive.stage} />
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm text-gray-700">
        <span className="inline-flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-500" />
          {drive.applicationsCount ?? 0} applications
        </span>
        <span className="inline-flex items-center gap-1">
          <Building2 className="w-4 h-4 text-gray-500" />
          {drive.invitedCollegesCount ?? 0} colleges
        </span>
      </div>

      <div className="absolute right-4 bottom-4 hidden gap-2 group-hover:flex">
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-gray-200 hover:bg-gray-50"
          whileHover={{ scale: 1.05 }}
        >
          <Eye className="w-3.5 h-3.5" />
          View
        </motion.button>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-gray-200 hover:bg-gray-50"
          whileHover={{ scale: 1.05 }}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </motion.button>
      </div>
    </Card>
  );
};

export default DriveCard;
