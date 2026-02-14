import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  getDriveCollegeDetails, 
  getCollegeStageProgress, 
  getCollegeUploads,
  getDriveById 
} from '../../services/companyService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';

const STAGES = ['APPLICATIONS', 'TEST', 'SHORTLIST', 'INTERVIEW', 'FINAL'];

const StageProgressStepper = ({ stages, currentStage }) => {
  const currentIndex = STAGES.indexOf(currentStage);
  
  return (
    <div className="flex items-center justify-between w-full">
      {STAGES.map((stage, index) => {
        const stageData = stages.find(s => s.name === stage);
        const isCompleted = index < currentIndex;
        const isCurrent = stage === currentStage;
        const isPending = index > currentIndex;
        
        return (
          <div key={stage} className="flex flex-col items-center flex-1">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300"
              style={{
                backgroundColor: isCompleted ? '#10B981' : isCurrent ? '#3B82F6' : '#E5E7EB',
                borderColor: isCompleted ? '#10B981' : isCurrent ? '#3B82F6' : '#D1D5DB',
                color: isCompleted || isCurrent ? '#FFFFFF' : '#6B7280'
              }}>
              {isCompleted ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="text-sm font-semibold">{index + 1}</span>
              )}
            </div>
            <span className={`mt-2 text-xs font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-500'}`}>
              {stage}
            </span>
            {stageData?.completedAt && (
              <span className="text-xs text-green-600 mt-1">
                {new Date(stageData.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const CollegeDriveDetails = () => {
  const { driveId, collegeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [collegeData, setCollegeData] = useState(null);
  const [driveInfo, setDriveInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch college details and drive info in parallel
        const [details, drive] = await Promise.all([
          getDriveCollegeDetails(driveId, collegeId),
          getDriveById(driveId)
        ]);
        
        setCollegeData(details);
        setDriveInfo(drive);
        setError(null);
      } catch (err) {
        console.error('Error fetching college details:', err);
        setError(err.message || 'Failed to load college details');
        toast.error(err.message || 'Failed to load college details');
      } finally {
        setLoading(false);
      }
    };

    if (driveId && collegeId) {
      fetchData();
    }
  }, [driveId, collegeId]);

  const getStatusBadge = (status) => {
    const statusMap = {
      'PENDING': 'warning',
      'ACCEPTED': 'success',
      'REJECTED': 'error'
    };
    return <StatusBadge status={statusMap[status] || 'default'} text={status} />;
  };

  const getStageStatusBadge = (status) => {
    const statusMap = {
      'PENDING': 'default',
      'ACTIVE': 'info',
      'COMPLETED': 'success'
    };
    return <StatusBadge status={statusMap[status] || 'default'} text={status} />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <SkeletonLoader variant="rectangular" height="200px" className="mb-4" />
        <SkeletonLoader variant="rectangular" height="400px" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          title="Error Loading Data"
          message={error}
          action={{
            label: 'Go Back',
            onClick: () => navigate(`/company/drives/${driveId}`)
          }}
        />
      </div>
    );
  }

  if (!collegeData) {
    return (
      <div className="p-6">
        <EmptyState
          title="College Not Found"
          message="The requested college data could not be found in this drive."
          action={{
            label: 'Go Back',
            onClick: () => navigate(`/company/drives/${driveId}`)
          }}
        />
      </div>
    );
  }

  const { college, stats, stages, students, uploads, currentStage, isLocked, invitationStatus, managedBy } = collegeData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            to={`/company/drives/${driveId}`}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Drive
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{college.name}</h1>
          <p className="text-gray-600">{college.city}, {college.state}</p>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(invitationStatus)}
          {managedBy && (
            <span className="text-sm text-gray-500">
              Managed by: <span className="font-medium">{managedBy}</span>
            </span>
          )}
        </div>
      </div>

      {/* Drive Info */}
      {driveInfo && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{driveInfo.roleTitle}</h2>
              <p className="text-gray-600">Package: ₹{driveInfo.salary?.toLocaleString()}</p>
            </div>
            <StatusBadge 
              status={driveInfo.status === 'PUBLISHED' ? 'success' : 'default'} 
              text={driveInfo.status} 
            />
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-600">{stats?.totalApplications || 0}</div>
          <div className="text-sm text-gray-500">Total Applications</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-yellow-600">{stats?.applicationsCount || 0}</div>
          <div className="text-sm text-gray-500">In Applications</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-purple-600">{stats?.shortlistCount || 0}</div>
          <div className="text-sm text-gray-500">Shortlisted</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-indigo-600">{stats?.interviewCount || 0}</div>
          <div className="text-sm text-gray-500">Interview</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">{stats?.selectedCount || 0}</div>
          <div className="text-sm text-gray-500">Selected</div>
        </Card>
      </div>

      {/* Stage Progress Stepper */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Progress</h3>
        <StageProgressStepper stages={stages || []} currentStage={currentStage} />
        {isLocked && (
          <div className="mt-4 p-3 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-gray-600">This college's drive is locked</span>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'students', 'uploads'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage Details</h3>
          <div className="space-y-4">
            {stages?.map((stage) => (
              <div key={stage.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold">{stage.order}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{stage.name}</h4>
                    <p className="text-sm text-gray-500">
                      Started: {stage.startedAt ? new Date(stage.startedAt).toLocaleString() : 'Not started'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {stage.completedAt && (
                    <p className="text-sm text-gray-500">
                      Completed: {new Date(stage.completedAt).toLocaleString()}
                    </p>
                  )}
                  {stage.completedBy && (
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      By: {stage.completedBy}
                    </span>
                  )}
                  {getStageStatusBadge(stage.status)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'students' && (
        <div className="space-y-6">
          {/* Shortlisted Students */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shortlisted Students ({students?.shortlisted?.length || 0})</h3>
            {students?.shortlisted?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CGPA</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.shortlisted.map((student, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.course || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.cgpa || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No Shortlisted Students" message="No students have been shortlisted yet." />
            )}
          </Card>

          {/* Interview Students */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Students ({students?.inInterview?.length || 0})</h3>
            {students?.inInterview?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.inInterview.map((student, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.course || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No Interview Students" message="No students have been moved to interview yet." />
            )}
          </Card>

          {/* Final Selected Students */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Selected Students ({students?.selected?.length || 0})</h3>
            {students?.selected?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Selected At</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.selected.map((student, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.phone || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.selectedAt ? new Date(student.selectedAt).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No Selected Students" message="No students have been selected yet." />
            )}
          </Card>
        </div>
      )}

      {activeTab === 'uploads' && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Logs</h3>
          {uploads?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invalid</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {uploads.map((upload, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <StatusBadge status="info" text={upload.stage} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{upload.fileName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{upload.totalRecords}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{upload.validRecords}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">{upload.invalidRecords}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{upload.uploadedBy}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(upload.uploadedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No Uploads" message="No files have been uploaded for this college yet." />
          )}
        </Card>
      )}
    </div>
  );
};

export default CollegeDriveDetails;
