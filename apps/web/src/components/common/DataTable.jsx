import { useMemo, useState } from 'react';
import { ArrowDownAZ, ArrowUpZA, Search } from 'lucide-react';
import EmptyState from './EmptyState';
import { SkeletonTable } from './SkeletonLoader';
import { cn } from '../../utils/helpers';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  searchable = true,
  searchPlaceholder = 'Search records...',
  rowKey = 'id',
  emptyState
}) => {
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const processedData = useMemo(() => {
    let rows = [...data];

    if (search.trim()) {
      const query = search.toLowerCase();
      rows = rows.filter((row) =>
        columns.some((column) => {
          const value = row[column.key];
          return String(value ?? '')
            .toLowerCase()
            .includes(query);
        })
      );
    }

    if (sortConfig.key) {
      rows.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === bValue) return 0;

        const comparison = String(aValue ?? '').localeCompare(String(bValue ?? ''), undefined, {
          numeric: true,
          sensitivity: 'base'
        });

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return rows;
  }, [data, search, sortConfig, columns]);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={searchPlaceholder}
              className="input-base pl-9"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-6">
          <SkeletonTable rows={6} />
        </div>
      ) : processedData.length === 0 ? (
        <EmptyState
          title={emptyState?.title || 'No records found'}
          description={emptyState?.description || 'Try adjusting your filters or create a new record.'}
          icon={emptyState?.icon}
          action={emptyState?.action}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => {
                  const isActiveSort = sortConfig.key === column.key;
                  const sortable = column.sortable !== false;
                  return (
                    <th key={column.key} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {sortable ? (
                        <button
                          onClick={() => handleSort(column.key)}
                          className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
                        >
                          {column.header}
                          {isActiveSort ? (
                            sortConfig.direction === 'asc' ? (
                              <ArrowDownAZ className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpZA className="w-3.5 h-3.5" />
                            )
                          ) : null}
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {processedData.map((row, idx) => (
                <tr key={row[rowKey] ?? idx} className="hover:bg-gray-50 transition-colors">
                  {columns.map((column) => (
                    <td key={column.key} className={cn('px-5 py-4 text-sm text-gray-700', column.cellClassName)}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataTable;
