import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import Button from '../common/Button';

const defaultLocalFilters = {
  status: '',
  stage: '',
  company: '',
  dateFrom: '',
  dateTo: ''
};

const FilterPanel = ({ isOpen, onClose, filters = {}, onApply, onClear, companies = [] }) => {
  const [localFilters, setLocalFilters] = useState({ ...defaultLocalFilters, ...filters });

  useEffect(() => {
    setLocalFilters({ ...defaultLocalFilters, ...filters });
  }, [filters]);

  const handleChange = (key, value) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply?.(localFilters);
    onClose?.();
  };

  const handleClear = () => {
    const cleared = { ...defaultLocalFilters };
    setLocalFilters(cleared);
    onClear?.();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white border-l border-gray-200 shadow-xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.22 }}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto h-[calc(100%-140px)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  className="input-base"
                  value={localFilters.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                <select
                  className="input-base"
                  value={localFilters.stage}
                  onChange={(e) => handleChange('stage', e.target.value)}
                >
                  <option value="">All</option>
                  <option value="APPLICATIONS">Applications</option>
                  <option value="TEST">Test</option>
                  <option value="SHORTLIST">Shortlist</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="FINAL">Final</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <select
                  className="input-base"
                  value={localFilters.company}
                  onChange={(e) => handleChange('company', e.target.value)}
                >
                  <option value="">All Companies</option>
                  {companies.map((company) => (
                    <option key={company.id ?? company.name} value={company.name}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                  <input
                    className="input-base"
                    type="date"
                    value={localFilters.dateFrom}
                    onChange={(e) => handleChange('dateFrom', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                  <input
                    className="input-base"
                    type="date"
                    value={localFilters.dateTo}
                    onChange={(e) => handleChange('dateTo', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 flex items-center gap-3">
              <Button className="flex-1" variant="ghost" onClick={handleClear}>
                Clear All
              </Button>
              <Button className="flex-1" onClick={handleApply}>
                Apply Filters
              </Button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default FilterPanel;
