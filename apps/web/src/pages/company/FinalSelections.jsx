import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, CheckCircle, GraduationCap, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { SkeletonTable } from '../../components/common/SkeletonLoader';
import * as companyService from '../../services/companyService';
import { formatDate } from '../../utils/helpers';

const FinalSelections = () => {
  const { id: driveId } = useParams();
  
  const [selections, setSelections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drive, setDrive] = useState(null);
  const [collegeFilter, setCollegeFilter] = useState('');
  const [colleges, setColleges] = useState([]);
  const [stats, setStats] = useState({
    totalSelected: 0,
    byCollege: {}
  });

  useEffect(() => {
    fetchDrive();
  }, [driveId]);

  useEffect(() => {
    fetchSelections();
  }, [driveId, collegeFilter]);

  const fetchDrive = async () => {
    try {
      const data = await companyService.getDriveById(driveId);
      setDrive(data);
      
      // Get unique colleges from drive
      const uniqueColleges = [];
      const seen = new Set();
      (data.driveColleges || []).forEach(dc => {
        if (dc.college && !seen.has(dc.college.id)) {
          seen.add(dc.college.id);
          uniqueColleges.push(dc.college);
        }
      });
      setColleges(uniqueColleges);
    } catch (error) {
      toast.error('Failed to load drive details');
    }
  };

  const fetchSelections = async () => {
    setLoading(true);
    try {
      const response = await companyService.getSelections(driveId, collegeFilter || undefined);
      
      // Handle both array and object response
      const selectionsData = response?.selections || response || [];
      setSelections(selectionsData);
      
      // Calculate stats
      const byCollege = {};
      let totalSelected = 0;
      
      selectionsData.forEach(s => {
        const collegeName = s.collegeName || s.college?.name || 'Unknown';
        byCollege[collegeName] = (byCollege[collegeName] || 0) + 1;
        totalSelected++;
      });
      
      setStats({ totalSelected, byCollege });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load selections');
      setSelections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Name', 'Email', 'College', 'Branch', 'CGPA', 'Selected Date'];
    const rows = selections.map(s => [
      s.studentName || s.name || '',
      s.studentEmail || s.email || '',
      s.collegeName || s.college?.name || '',
      s.branch || '',
      s.cgpa || '',
      s.selectedAt ? formatDate(s.selectedAt) : ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selections-${drive?.roleTitle || 'drive'}-${Date.now()}.csv`;
    a.click();
  };

  const collegeStats = Object.entries(stats.byCollege).map(([name, count]) => ({
    name,
    count
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link to="/company" className="hover:underline">Company</Link>
        {' > '}
        <Link to="/company/drives" className="hover:underline">My Drives</Link>
        {' > '}
        <Link to={`/company/drives/${driveId}`} className="hover:underline">{drive?.roleTitle || 'Drive'}</Link>
        {' > '}
        <span className="text-gray-700">Final Selections</span>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Final Selections</h1>
          <p className="text-gray-600">Students who received offers - {drive?.roleTitle || drive?.role || 'Loading...'}</p>
        </div>
        <Button variant="outline" icon={<Download className="w-4 h-4" />} onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Total Selected Card */}
        <Card padding="md">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{stats.totalSelected}</p>
              <p className="text-sm text-gray-600">Total Selected</p>
            </div>
          </div>
        </Card>

        {/* By College Stats */}
        <Card padding="md" className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">By College</h3>
          </div>
          {collegeStats.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {collegeStats.map((stat, index) => (
                <motion.div
                  key={stat.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-700">{stat.name}</span>
                  <span className="text-sm font-bold text-gray-900">{stat.count}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No selections yet</p>
          )}
        </Card>
      </div>

      {/* College Filter */}
      <Card padding="md">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by College:</label>
          <select
            className="input-base max-w-xs"
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
          >
            <option value="">All Colleges</option>
            {colleges.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Selected Students Table */}
      <Card padding="none">
        {loading ? (
          <SkeletonTable rows={5} />
        ) : selections.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No selections yet</p>
            <p className="text-sm text-gray-500 mt-1">Final selections will appear here after the final stage</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Student</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Email</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">College</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Branch</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">CGPA</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Selected Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selections.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <p className="font-medium text-gray-900">
                            {student.studentName || student.name || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="w-4 h-4" />
                          {student.studentEmail || student.email || '-'}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700">
                        {student.collegeName || student.college?.name || '-'}
                      </td>
                      <td className="p-4 text-sm text-gray-700">{student.branch || '-'}</td>
                      <td className="p-4 text-sm text-gray-700">{student.cgpa || '-'}</td>
                      <td className="p-4 text-sm text-gray-600">
                        {student.selectedAt ? formatDate(student.selectedAt) : '-'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Note */}
            <div className="p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing {selections.length} selected student{selections.length !== 1 ? 's' : ''}
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default FinalSelections;
