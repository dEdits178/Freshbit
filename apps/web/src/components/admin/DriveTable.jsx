import { useMemo } from 'react';
import { ArrowDownAZ, ArrowUpZA, ChevronDown, Eye } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { SkeletonTable } from '../common/SkeletonLoader';
import { formatDate, formatNumber } from '../../utils/helpers';

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

const DriveTable = ({
  drives = [],
  loading = false,
  onSort,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  onRowClick,
  selectable = false,
  selectedIds = [],
  onSelect
}) => {
  const allSelected = useMemo(
    () => selectable && drives.length > 0 && selectedIds.length === drives.length,
    [selectable, drives, selectedIds]
  );

  const toggleSelectAll = () => {
    if (!onSelect) return;
    onSelect(allSelected ? [] : drives.map((drive) => drive.id));
  };

  const toggleSelectOne = (id) => {
    if (!onSelect) return;
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter((item) => item !== id));
      return;
    }
    onSelect([...selectedIds, id]);
  };

  const renderSortIcon = (column) => {
    if (sortBy !== column) return <ChevronDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortOrder === 'asc' ? <ArrowDownAZ className="w-3.5 h-3.5" /> : <ArrowUpZA className="w-3.5 h-3.5" />;
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <SkeletonTable rows={7} />
      </div>
    );
  }

  if (!drives.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white">
        <EmptyState title="No drives found" description="Try changing filters or search keywords." />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            {selectable && (
              <th className="px-4 py-3 border-b border-gray-200">
                <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="rounded border-gray-300" />
              </th>
            )}
            {[
              ['role', 'Drive Name'],
              ['companyName', 'Company'],
              ['stage', 'Stage'],
              ['status', 'Status'],
              ['totalApplications', 'Applications'],
              ['createdAt', 'Created Date']
            ].map(([key, label]) => (
              <th key={key} className="px-4 py-3 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <button onClick={() => onSort?.(key)} className="inline-flex items-center gap-1.5 cursor-pointer hover:text-gray-900">
                  {label}
                  {renderSortIcon(key)}
                </button>
              </th>
            ))}
            <th className="px-4 py-3 border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody>
          {drives.map((drive) => (
            <tr
              key={drive.id}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              onClick={() => onRowClick?.(drive)}
            >
              {selectable && (
                <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(drive.id)}
                    onChange={() => toggleSelectOne(drive.id)}
                    className="rounded border-gray-300"
                  />
                </td>
              )}
              <td className="px-4 py-4">
                <p className="font-semibold text-gray-900 max-w-xs truncate">{drive.role}</p>
              </td>
              <td className="px-4 py-4 text-sm text-gray-700">{drive.companyName}</td>
              <td className="px-4 py-4">
                <StageProgress stage={drive.stage} />
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={drive.status} />
              </td>
              <td className="px-4 py-4 text-sm text-gray-700">{formatNumber(drive.totalApplications)}</td>
              <td className="px-4 py-4 text-sm text-gray-700">{formatDate(drive.createdAt)}</td>
              <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" variant="ghost" onClick={() => onRowClick?.(drive)} icon={<Eye className="w-4 h-4" />}>
                  View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DriveTable;
