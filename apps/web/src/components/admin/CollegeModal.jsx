import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { validateEmail, validateRequired } from '../../utils/validation';
import * as adminService from '../../services/adminService';

const initialValues = {
  name: '',
  email: '',
  password: '',
  organizationName: ''
};

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  let value = '';
  for (let i = 0; i < 12; i += 1) {
    value += chars[Math.floor(Math.random() * chars.length)];
  }
  return value;
};

const CollegeModal = ({ isOpen, onClose, mode = 'add', college = null, onSuccess }) => {
  const [formData, setFormData] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEdit = mode === 'edit';

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && college) {
      setFormData({
        name: college.name || '',
        email: college.email || '',
        password: '',
        organizationName: college.organizationName || ''
      });
      return;
    }
    setFormData(initialValues);
    setErrors({});
  }, [isOpen, isEdit, college]);

  const title = useMemo(() => (isEdit ? 'Edit College' : 'Add New College'), [isEdit]);

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validate = () => {
    const nextErrors = {};
    nextErrors.name = validateRequired(formData.name, 'College name');
    nextErrors.organizationName = validateRequired(formData.organizationName, 'Organization name');

    if (!formData.email?.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!isEdit) {
      if (!formData.password?.trim()) {
        nextErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        nextErrors.password = 'Password must be at least 6 characters';
      }
    }

    const hasErrors = Object.values(nextErrors).some(Boolean);
    setErrors(nextErrors);
    return !hasErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEdit) {
        await adminService.updateCollege(college.id, {
          name: formData.name.trim(),
          email: formData.email.trim(),
          organizationName: formData.organizationName.trim()
        });
        toast.success('College updated successfully');
      } else {
        await adminService.createCollege({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          organizationName: formData.organizationName.trim()
        });
        toast.success('College created successfully');
      }

      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save college');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">College Name</label>
          <input
            className="input-base"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="IIT Bombay"
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            className="input-base"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="placement@college.edu"
            disabled={isEdit}
          />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
        </div>

        {!isEdit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  className="input-base pr-10"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Create secure password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => handleChange('password', generatePassword())}
              >
                Generate
              </Button>
            </div>
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
          <input
            className="input-base"
            value={formData.organizationName}
            onChange={(e) => handleChange('organizationName', e.target.value)}
            placeholder="Indian Institute of Technology Bombay"
          />
          {errors.organizationName && <p className="text-xs text-red-600 mt-1">{errors.organizationName}</p>}
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {isEdit ? 'Update College' : 'Create College'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CollegeModal;
