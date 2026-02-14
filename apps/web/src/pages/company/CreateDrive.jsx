import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import * as companyService from '../../services/companyService';
import { formatDate } from '../../utils/helpers';

const CreateDrive = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [roleTitle, setRoleTitle] = useState('');
  const [salary, setSalary] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [colleges, setColleges] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [search, setSearch] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const data = await companyService.getColleges(search);
        // Handle both old format (array) and new format (with pagination)
        if (Array.isArray(data)) {
          setColleges(data);
        } else if (data?.colleges) {
          setColleges(data.colleges);
        } else {
          setColleges([]);
        }
      } catch {
        setColleges([]);
      }
    };
    fetchColleges();
  }, [search]);

  const validateStep1 = () => {
    const newErrors = {};
    if (!roleTitle.trim()) newErrors.roleTitle = 'Role is required';
    if (!salary || Number(salary) < 100000) newErrors.salary = 'CTC must be at least 100,000';
    if (!description.trim() || description.trim().length < 50) newErrors.description = 'Description must be at least 50 characters';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!eligibility.trim()) newErrors.eligibility = 'Eligibility is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (!endDate) newErrors.endDate = 'End date is required';
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const submit = async () => {
    setLoading(true);
    try {
      const payload = {
        roleTitle: roleTitle.trim(),
        salary: parseInt(salary, 10),
        description: description.trim(),
        location: location.trim(),
        eligibility: eligibility.trim(),
        startDate,
        endDate,
        collegeIds: selectedColleges
      };
      const drive = await companyService.createDrive(payload);
      toast.success('Drive created successfully');
      navigate(`/company/drives/${drive.id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create drive');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Drive</h1>
          <p className="text-gray-600">Multi-step creation with validation</p>
        </div>
      </div>

      <Card padding="md">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`px-3 py-1 rounded-full text-sm ${step === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              Step {s}
            </div>
          ))}
        </div>
      </Card>

      {step === 1 && (
        <Card padding="md">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Role Title</label>
              <input className="input-base mt-1" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} placeholder="e.g., Software Engineer" onBlur={validateStep1} />
              {errors.roleTitle && <p className="text-xs text-red-600 mt-1">{errors.roleTitle}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">CTC</label>
              <input className="input-base mt-1" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g., 1200000" onBlur={validateStep1} />
              {errors.salary && <p className="text-xs text-red-600 mt-1">{errors.salary}</p>}
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea className="input-base mt-1 h-28" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Full job description..." onBlur={validateStep1} />
              {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input className="input-base mt-1" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Bangalore, Remote" onBlur={validateStep1} />
              {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Eligibility Criteria</label>
              <textarea className="input-base mt-1 h-20" value={eligibility} onChange={(e) => setEligibility(e.target.value)} placeholder="B.Tech CS/IT, CGPA > 7.0, No backlogs" onBlur={validateStep1} />
              {errors.eligibility && <p className="text-xs text-red-600 mt-1">{errors.eligibility}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <input className="input-base mt-1" type="date" value={startDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setStartDate(e.target.value)} onBlur={validateStep1} />
              {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input className="input-base mt-1" type="date" value={endDate} min={startDate || new Date().toISOString().split('T')[0]} onChange={(e) => setEndDate(e.target.value)} onBlur={validateStep1} />
              {errors.endDate && <p className="text-xs text-red-600 mt-1">{errors.endDate}</p>}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => navigate('/company/drives')}>Cancel</Button>
            <Button onClick={() => { if (validateStep1()) next(); }} disabled={!roleTitle.trim() || !salary.trim() || !description.trim() || !location.trim() || !eligibility.trim() || !startDate || !endDate}>Next</Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Invite Colleges</h3>
            <input className="input-base w-64" placeholder="Search colleges..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {colleges.map((c) => {
              const selected = selectedColleges.includes(c.id);
              return (
                <button
                  key={c.id}
                  className={`p-3 rounded-lg border ${selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white'} text-left`}
                  onClick={() => {
                    setSelectedColleges((prev) => (selected ? prev.filter((id) => id !== c.id) : [...prev, c.id]));
                  }}
                >
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-600">{c.city}, {c.state}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={back}>Back</Button>
            <Button onClick={next} disabled={selectedColleges.length === 0}>Next</Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <Card padding="md">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Review & Create</h3>
          <div className="space-y-2 text-sm">
            <p><span className="text-gray-600">Role:</span> <span className="text-gray-900 font-medium">{roleTitle}</span></p>
            <p><span className="text-gray-600">CTC:</span> <span className="text-gray-900 font-medium">{salary}</span></p>
            <p><span className="text-gray-600">Description:</span> <span className="text-gray-900 font-medium">{description}</span></p>
            <p><span className="text-gray-600">Colleges:</span> <span className="text-gray-900 font-medium">{selectedColleges.length}</span></p>
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button variant="ghost" onClick={back}>Back</Button>
            <Button onClick={submit} loading={loading}>Create Drive</Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CreateDrive;
