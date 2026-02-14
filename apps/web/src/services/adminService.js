import api from './api';

export const getStats = async () => {
  const { data } = await api.get('/api/admin/stats');
  return data.data;
};

export const getDrives = async (params = {}) => {
  const { data } = await api.get('/api/admin/drives', { params });
  return data.data;
};

export const getDriveById = async (id) => {
  const { data } = await api.get(`/api/admin/drives/${id}`);
  return data.data;
};

export const getColleges = async (params = {}) => {
  const { data } = await api.get('/api/admin/colleges', { params });
  return data.data;
};

export const createCollege = async (collegeData) => {
  const { data } = await api.post('/api/admin/colleges', collegeData);
  return data.data;
};

export const updateCollege = async (id, collegeData) => {
  const { data } = await api.put(`/api/admin/colleges/${id}`, collegeData);
  return data.data;
};

export const deleteCollege = async (id) => {
  const { data } = await api.delete(`/api/admin/colleges/${id}`);
  return data;
};

export const getCompanies = async (params = {}) => {
  const { data } = await api.get('/api/admin/companies', { params });
  return data.data;
};

export const getAnalytics = async () => {
  const { data } = await api.get('/api/admin/analytics/overview');
  return data.data;
};

export const activateNextStage = async (driveId) => {
  const { data } = await api.post(`/api/admin/drives/${driveId}/activate-next-stage`);
  return data;
};

export const closeDrive = async (driveId) => {
  const { data } = await api.post(`/api/admin/drives/${driveId}/close`);
  return data;
};
