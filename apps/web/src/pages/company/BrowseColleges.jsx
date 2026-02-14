import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Building2, Users, MapPin, X, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import * as companyService from '../../services/companyService';

const BrowseColleges = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    fetchColleges();
  }, [debouncedSearch]);

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const data = await companyService.getColleges(debouncedSearch);
      // Handle both old format (array) and new format (with pagination)
      if (Array.isArray(data)) {
        setColleges(data);
      } else if (data?.colleges) {
        setColleges(data.colleges);
      } else {
        setColleges([]);
      }
    } catch (error) {
      console.error('Error fetching colleges:', error);
      toast.error('Failed to load colleges');
      setColleges([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Colleges</h1>
        <p className="text-gray-600">Find colleges to invite to your placement drives</p>
      </div>

      {/* Search */}
      <Card padding="md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-base pl-9 pr-9"
            placeholder="Search colleges by name or location..."
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
      </Card>

      {/* College Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : colleges.length === 0 ? (
        <Card padding="md">
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No colleges found</p>
            {search && (
              <Button 
                variant="ghost" 
                className="mt-2"
                onClick={() => setSearch('')}
              >
                Clear Search
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {colleges.map((college, index) => (
            <motion.div
              key={college.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover padding="md">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{college.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {college.city || college.location || 'Location not specified'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {college.totalStudents && (
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {college.totalStudents} students
                      </span>
                    )}
                  </div>

                  {college.email && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {college.email}
                    </p>
                  )}

                  {college.organizationName && college.organizationName !== college.name && (
                    <p className="text-xs text-gray-500">
                      {college.organizationName}
                    </p>
                  )}

                  <div className="pt-2 border-t">
                    <Link to="/company/drives/create">
                      <Button variant="outline" size="sm" fullWidth>
                        Invite to Drive
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card padding="md">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">How to invite colleges</h3>
            <p className="text-sm text-gray-600 mt-1">
              Browse colleges and then invite them when creating a new drive. 
              Colleges will receive an invitation and can choose to participate in your placement drive.
            </p>
            <Link to="/company/drives/create">
              <Button className="mt-3" size="sm">
                Create New Drive
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BrowseColleges;
