import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Check, Building2, Users, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import * as companyService from '../../services/companyService';

const InviteCollegesModal = ({ isOpen, onClose, driveId, onSuccess }) => {
  const [colleges, setColleges] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [managedBy, setManagedBy] = useState('COLLEGE');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invitedCollegeIds, setInvitedCollegeIds] = useState([]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (isOpen) {
      fetchColleges();
      fetchInvitedColleges();
    }
  }, [isOpen, debouncedSearch]);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const data = await companyService.getColleges(debouncedSearch);
      setColleges(data || []);
    } catch (error) {
      toast.error('Failed to load colleges');
      setColleges([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitedColleges = async () => {
    if (!driveId) return;
    try {
      const invited = await companyService.getInvitedColleges(driveId);
      setInvitedCollegeIds(invited.map((c) => c.id));
    } catch (error) {
      setInvitedCollegeIds([]);
    }
  };

  const handleToggle = (collegeId) => {
    if (invitedCollegeIds.includes(collegeId)) return;
    setSelectedIds((prev) =>
      prev.includes(collegeId)
        ? prev.filter((id) => id !== collegeId)
        : [...prev, collegeId]
    );
  };

  const handleSelectAll = () => {
    const availableIds = colleges
      .map((c) => c.id)
      .filter((id) => !invitedCollegeIds.includes(id));
    setSelectedIds(availableIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one college');
      return;
    }

    setSubmitting(true);
    try {
      await companyService.inviteColleges(driveId, selectedIds, managedBy);
      toast.success(`${selectedIds.length} college(s) invited successfully`);
      onSuccess?.();
      onClose();
      setSelectedIds([]);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to invite colleges');
    } finally {
      setSubmitting(false);
    }
  };

  const availableColleges = colleges.filter(
    (c) => !invitedCollegeIds.includes(c.id)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg">
      <div className="flex flex-col h-full max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Invite Colleges</h2>
            <p className="text-sm text-gray-600">
              Select colleges to invite to this drive
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-base pl-9 pr-9"
              placeholder="Search colleges by name..."
            />
            {search && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setSearch('')}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Managed By Selection */}
        <div className="p-4 border-b bg-gray-50">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Who will manage applications?
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="managedBy"
                value="COLLEGE"
                checked={managedBy === 'COLLEGE'}
                onChange={(e) => setManagedBy(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">College Managed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="managedBy"
                value="ADMIN"
                checked={managedBy === 'ADMIN'}
                onChange={(e) => setManagedBy(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Admin Managed</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {managedBy === 'COLLEGE'
              ? 'Colleges will manage shortlisting and progression of candidates'
              : 'You will manage all stages centrally'}
          </p>
        </div>

        {/* College List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : colleges.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No colleges found</p>
            </div>
          ) : (
            <>
              {/* Selection controls */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-600">
                  {availableColleges.length} available college
                  {availableColleges.length !== 1 ? 's' : ''}
                </p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDeselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* College cards */}
              <div className="space-y-2">
                <AnimatePresence>
                  {colleges.map((college) => {
                    const isInvited = invitedCollegeIds.includes(college.id);
                    const isSelected = selectedIds.includes(college.id);

                    return (
                      <motion.div
                        key={college.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          isInvited
                            ? 'bg-gray-50 border-gray-200 opacity-60'
                            : isSelected
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => handleToggle(college.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded border flex items-center justify-center ${
                              isInvited
                                ? 'bg-gray-300 border-gray-400'
                                : isSelected
                                ? 'bg-blue-600 border-blue-600'
                                : 'border-gray-300'
                            }`}
                          >
                            {isInvited ? (
                              <X className="w-3 h-3 text-gray-500" />
                            ) : isSelected ? (
                              <Check className="w-3 h-3 text-white" />
                            ) : null}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate">
                                {college.name}
                              </p>
                              {isInvited && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                  Already invited
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {college.city || college.location || 'N/A'}
                              </span>
                              {college.totalStudents && (
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {college.totalStudents} students
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedIds.length > 0 ? (
                <>
                  <span className="font-medium text-gray-900">
                    {selectedIds.length}
                  </span>{' '}
                  college{selectedIds.length !== 1 ? 's' : ''} selected
                </>
              ) : (
                'No colleges selected'
              )}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                loading={submitting}
                disabled={selectedIds.length === 0}
              >
                Invite {selectedIds.length > 0 && `(${selectedIds.length})`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default InviteCollegesModal;
