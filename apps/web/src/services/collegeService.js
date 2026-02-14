import api from './api';

/**
 * College Service
 * Handles all API calls for college-related operations
 */

/**
 * Get college dashboard statistics
 * @returns {Promise<Object>} Dashboard stats including pending invitations, accepted drives, etc.
 */
export const getStats = async () => {
    const { data } = await api.get('/api/college/stats');
    return data.data;
};

/**
 * Get invitations by status
 * @param {string} status - Filter by status (PENDING, ACCEPTED, REJECTED) or empty for all
 * @returns {Promise<Object>} Invitations list with total count
 */
export const getInvitations = async (status = '') => {
    const { data } = await api.get('/api/college/invitations', {
        params: status ? { status } : {}
    });
    return data.data;
};

/**
 * Accept a drive invitation
 * @param {string} invitationId - Invitation ID to accept
 * @returns {Promise<Object>} Success response
 */
export const acceptInvitation = async (invitationId) => {
    const { data } = await api.post(`/api/college/invitations/${invitationId}/accept`);
    return data;
};

/**
 * Reject a drive invitation
 * @param {string} invitationId - Invitation ID to reject
 * @param {string} reason - Optional rejection reason
 * @returns {Promise<Object>} Success response
 */
export const rejectInvitation = async (invitationId, reason = '') => {
    const { data } = await api.post(`/api/college/invitations/${invitationId}/reject`,
        reason ? { reason } : {}
    );
    return data;
};

/**
 * Get drive details by ID
 * @param {string} driveId - Drive ID
 * @returns {Promise<Object>} Drive details with stages and permissions
 */
export const getDriveById = async (driveId) => {
    const { data } = await api.get(`/api/college/drives/${driveId}`);
    return data.data;
};

/**
 * Upload student file for preview and validation
 * @param {string} driveId - Drive ID
 * @param {File} file - CSV or XLSX file
 * @returns {Promise<Object>} Preview data with validation results
 */
export const uploadStudentFile = async (driveId, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post(
        `/api/college/drives/${driveId}/upload-students`,
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }
    );
    return data.data;
};

/**
 * Confirm and insert validated students
 * @param {string} driveId - Drive ID
 * @param {Array} students - Array of validated student objects
 * @returns {Promise<Object>} Insertion results with counts
 */
export const confirmStudents = async (driveId, students) => {
    const { data } = await api.post(
        `/api/college/drives/${driveId}/confirm-students`,
        { students }
    );
    return data;
};

/**
 * Get students for a drive with pagination and filters
 * @param {string} driveId - Drive ID
 * @param {Object} params - Query parameters (page, limit, search, branch, etc.)
 * @returns {Promise<Object>} Students list with pagination info
 */
export const getStudents = async (driveId, params = {}) => {
    const { data } = await api.get(`/api/college/drives/${driveId}/students`, { params });
    return data.data;
};

/**
 * Delete a student from a drive
 * @param {string} driveId - Drive ID
 * @param {string} studentId - Student ID to delete
 * @returns {Promise<Object>} Success response
 */
export const deleteStudent = async (driveId, studentId) => {
    const { data } = await api.delete(`/api/college/drives/${driveId}/students/${studentId}`);
    return data;
};

/**
 * Get applications for a drive
 * @param {string} driveId - Drive ID
 * @param {Object} params - Query parameters (page, limit, status, etc.)
 * @returns {Promise<Object>} Applications list with stats
 */
export const getApplications = async (driveId, params = {}) => {
    const { data } = await api.get(`/api/college/drives/${driveId}/applications`, { params });
    return data.data;
};

/**
 * Download student upload template CSV
 */
export const downloadTemplate = async () => {
    const { data } = await api.get('/api/college/template/students', {
        responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

/**
 * Export students to CSV
 * @param {string} driveId - Drive ID
 * @param {Object} filters - Current filters applied
 */
export const exportStudents = async (driveId, filters = {}) => {
    const { data } = await api.get(`/api/college/drives/${driveId}/students/export`, {
        params: filters,
        responseType: 'blob'
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `students_${driveId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
