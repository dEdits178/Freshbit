import api from './api';

// Get company dashboard stats
export const getStats = async () => {
  const { data } = await api.get('/api/drives/company', { params: { page: 1, limit: 50 } });
  const drives = data?.data || [];
  const activeDrives = drives.filter((d) => d.status === 'PUBLISHED').length;
  const myDrives = drives.length;
  const recentDrives = drives.slice(0, 5).map((d) => ({
    id: d.id,
    companyName: d.company?.name || '',
    role: d.roleTitle || d.role,
    stage: d.currentStage || 'APPLICATIONS',
    status: d.status === 'PUBLISHED' ? 'ACTIVE' : d.status,
    applicationsCount: d._count?.applications || 0,
    invitedCollegesCount: d.driveColleges?.length || 0,
    createdAt: d.createdAt
  }));
  return {
    myDrives,
    activeDrives,
    totalInvitations: drives.reduce((acc, d) => acc + (d.driveColleges?.length || 0), 0),
    totalApplications: drives.reduce((acc, d) => acc + (d._count?.applications || 0), 0),
    selectedStudents: drives.reduce((acc, d) => acc + (d._count?.applications || 0), 0), // Approximate
    recentDrives
  };
};

// Get all drives for the company
export const getDrives = async (params = {}) => {
  const { data } = await api.get('/api/drives/company', { params });
  return data.data;
};

// Get my drives (alias for getDrives)
export const getMyDrives = async (params = {}) => {
  const { data } = await api.get('/api/drives/company', { params });
  return data.data;
};

// Get drive by ID
export const getDriveById = async (driveId) => {
  const { data } = await api.get(`/api/drives/company/${driveId}`);
  return data.data;
};

// Create a new drive
export const createDrive = async (driveData) => {
  const { data } = await api.post('/api/drives/company', driveData);
  return data.data;
};

// Update a drive
export const updateDrive = async (driveId, driveData) => {
  const { data } = await api.put(`/api/drives/company/${driveId}`, driveData);
  return data.data;
};

// Delete a drive
export const deleteDrive = async (driveId) => {
  const { data } = await api.delete(`/api/drives/company/${driveId}`);
  return data;
};

// Publish a drive
export const publishDrive = async (driveId) => {
  const { data } = await api.patch(`/api/drives/company/${driveId}/publish`);
  return data.data;
};

// Get all colleges (approved ones for browsing/inviting)
export const getColleges = async (search = '', page = 1, limit = 100) => {
  const { data } = await api.get('/api/company/colleges', { params: { search, page, limit } });
  return data.data;
};

// Get invited colleges for a drive
export const getInvitedColleges = async (driveId) => {
  const { data } = await api.get(`/api/company/drives/${driveId}/colleges`);
  return data.data || [];
};

// Get college-specific details within a drive
export const getDriveCollegeDetails = async (driveId, collegeId) => {
  const { data } = await api.get(`/api/company/drives/${driveId}/colleges/${collegeId}`);
  return data.data;
};

// Get stage progress for a college in a drive
export const getCollegeStageProgress = async (driveId, collegeId) => {
  const { data } = await api.get(`/api/company/drives/${driveId}/colleges/${collegeId}/stages`);
  return data.data;
};

// Get upload logs for a college in a drive
export const getCollegeUploads = async (driveId, collegeId) => {
  const { data } = await api.get(`/api/company/drives/${driveId}/colleges/${collegeId}/uploads`);
  return data.data;
};

// Invite colleges to a drive
export const inviteColleges = async (driveId, collegeIds, managedBy = 'COLLEGE') => {
  const { data } = await api.post(`/api/company/drives/${driveId}/invite`, {
    collegeIds,
    managedBy
  });
  return data;
};

// Update college invitation status in a drive
export const updateCollegeStatus = async (driveId, collegeId, status, managedBy) => {
  const { data } = await api.patch(`/api/company/drives/${driveId}/colleges/${collegeId}/status`, {
    status,
    managedBy
  });
  return data;
};

// Get applications for a drive
export const getApplications = async (driveId, params = {}) => {
  const { data } = await api.get(`/api/company/drives/${driveId}/applications`, { params });
  return data.data;
};

// Get application stats for a drive
export const getApplicationStats = async (driveId) => {
  const { data } = await api.get(`/api/applications/stats/${driveId}`);
  return data.data;
};

// Get selections for a drive
export const getSelections = async (driveId, collegeId = '') => {
  const { data } = await api.get(`/api/company/drives/${driveId}/selections`, {
    params: { collegeId }
  });
  return data.data;
};

// Activate next stage
export const activateNextStage = async (driveId) => {
  const { data } = await api.post(`/api/company/drives/${driveId}/activate-next-stage`);
  return data;
};

// Shortlist students
export const shortlistStudents = async (driveId, collegeId, studentEmails) => {
  const { data } = await api.post(`/api/selection/${driveId}/shortlist`, {
    collegeId,
    studentEmails
  });
  return data;
};

// Move to interview
export const moveToInterview = async (driveId, collegeId, studentEmails) => {
  const { data } = await api.post(`/api/selection/${driveId}/interview`, {
    collegeId,
    studentEmails
  });
  return data;
};

// Final selection
export const finalizeSelection = async (driveId, collegeId, studentEmails) => {
  const { data } = await api.post(`/api/selection/${driveId}/final`, {
    collegeId,
    studentEmails
  });
  return data;
};

// Reject students
export const rejectStudents = async (driveId, collegeId, studentEmails, currentStage) => {
  const { data } = await api.post(`/api/selection/${driveId}/reject`, {
    collegeId,
    studentEmails,
    currentStage
  });
  return data;
};

// Close a drive
export const closeDrive = async (driveId, collegeId) => {
  const { data } = await api.post(`/api/stages/drive/${driveId}/close`, {
    collegeId
  });
  return data;
};
