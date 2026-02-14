// College Service - Mock data implementation for testing
// TODO: Replace with actual database queries using Prisma

class CollegeService {
  /**
   * Get dashboard statistics
   */
  async getStats(collegeId) {
    // Mock data for now - replace with real queries later
    return {
      pendingInvitations: 3,
      acceptedDrives: 5,
      studentsUploaded: 245,
      finalSelections: 12,
      recentInvitations: [
        {
          id: '1',
          companyName: 'Tech Corp',
          role: 'Software Engineer',
          ctc: 2000000,
          location: 'Bangalore',
          status: 'PENDING',
          invitedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          driveId: 'drive1'
        },
        {
          id: '2',
          companyName: 'Innovation Labs',
          role: 'Full Stack Developer',
          ctc: 1800000,
          location: 'Hyderabad',
          status: 'PENDING',
          invitedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
          driveId: 'drive2'
        },
        {
          id: '3',
          companyName: 'Data Systems Inc',
          role: 'Data Analyst',
          ctc: 1500000,
          location: 'Pune',
          status: 'PENDING',
          invitedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          driveId: 'drive3'
        }
      ]
    }
  }

  /**
   * Get college profile
   */
  async getProfile(collegeId) {
    // Mock data
    return {
      id: collegeId,
      name: 'Sample College',
      organizationName: 'Sample College of Engineering',
      email: 'college@freshbit.com',
      phone: '1234567890',
      address: 'Sample Address'
    }
  }

  /**
   * Update college profile
   */
  async updateProfile(collegeId, data) {
    // Mock update
    return {
      id: collegeId,
      ...data
    }
  }

  /**
   * Get invitations by status
   */
  async getInvitations(collegeId, status) {
    const mockInvitations = [
      {
        id: '1',
        companyName: 'Tech Corp',
        role: 'Software Engineer',
        ctc: 2000000,
        location: 'Bangalore',
        description: 'We are looking for talented software engineers to join our team. You will work on cutting-edge technologies and solve challenging problems.',
        eligibility: 'B.Tech/B.E. in Computer Science, IT, or related field. CGPA >= 7.0. No active backlogs.',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-05-01'),
        status: 'PENDING',
        managedBy: 'COLLEGE',
        invitedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        driveId: 'drive1'
      },
      {
        id: '2',
        companyName: 'Innovation Labs',
        role: 'Full Stack Developer',
        ctc: 1800000,
        location: 'Hyderabad',
        description: 'Join our dynamic team to build innovative web applications using modern technologies.',
        eligibility: 'B.Tech/B.E. in any branch. CGPA >= 6.5. Strong programming skills required.',
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-04-30'),
        status: 'PENDING',
        managedBy: 'ADMIN',
        invitedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        driveId: 'drive2'
      },
      {
        id: '3',
        companyName: 'Data Systems Inc',
        role: 'Data Analyst',
        ctc: 1500000,
        location: 'Pune',
        description: 'Analyze large datasets and provide actionable insights to drive business decisions.',
        eligibility: 'B.Tech/B.E./MCA. CGPA >= 7.5. Knowledge of SQL and Python required.',
        startDate: new Date('2024-04-01'),
        endDate: new Date('2024-05-15'),
        status: 'PENDING',
        managedBy: 'COLLEGE',
        invitedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        driveId: 'drive3'
      },
      {
        id: '4',
        companyName: 'Cloud Solutions',
        role: 'DevOps Engineer',
        ctc: 2200000,
        location: 'Bangalore',
        description: 'Manage cloud infrastructure and automate deployment pipelines.',
        eligibility: 'B.Tech/B.E. in Computer Science. CGPA >= 7.0. AWS/Azure knowledge preferred.',
        startDate: new Date('2024-02-15'),
        endDate: new Date('2024-04-15'),
        status: 'ACCEPTED',
        managedBy: 'ADMIN',
        invitedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        acceptedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        driveId: 'drive4'
      },
      {
        id: '5',
        companyName: 'Mobile First',
        role: 'Android Developer',
        ctc: 1600000,
        location: 'Chennai',
        description: 'Build amazing mobile applications for millions of users.',
        eligibility: 'B.Tech/B.E. CGPA >= 6.0. Experience with Kotlin/Java required.',
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-03-20'),
        status: 'REJECTED',
        managedBy: 'COLLEGE',
        invitedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        rejectedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
        rejectionReason: 'Does not match our placement criteria',
        driveId: 'drive5'
      }
    ]

    if (status) {
      return {
        invitations: mockInvitations.filter(inv => inv.status === status),
        total: mockInvitations.filter(inv => inv.status === status).length
      }
    }

    return {
      invitations: mockInvitations,
      total: mockInvitations.length
    }
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(collegeId, invitationId) {
    // Mock acceptance
    return {
      success: true,
      message: 'Invitation accepted successfully'
    }
  }

  /**
   * Reject invitation
   */
  async rejectInvitation(collegeId, invitationId, reason) {
    // Mock rejection
    return {
      success: true,
      message: 'Invitation rejected successfully'
    }
  }

  /**
   * Get assigned drives
   */
  async getAssignedDrives(collegeId) {
    // Mock drives
    return []
  }

  /**
   * Get drive details
   */
  async getDriveDetails(collegeId, driveId) {
    // Mock drive details
    return {
      id: driveId,
      companyName: 'Cloud Solutions',
      role: 'DevOps Engineer',
      ctc: 2200000,
      location: 'Bangalore',
      description: 'Manage cloud infrastructure and automate deployment pipelines for our enterprise clients.',
      eligibility: 'B.Tech/B.E. in Computer Science. CGPA >= 7.0. AWS/Azure knowledge preferred.',
      startDate: new Date('2024-02-15'),
      endDate: new Date('2024-04-15'),
      currentStage: 'APPLICATIONS',
      status: 'ACTIVE',
      managedBy: 'ADMIN',
      studentsUploaded: 0,
      applicationsCount: 0
    }
  }

  /**
   * Upload students file
   */
  async uploadStudents(collegeId, driveId, file) {
    // Mock file processing - return preview data
    const mockStudents = [
      {
        name: 'Rahul Kumar',
        email: 'rahul@example.com',
        phone: '9876543210',
        rollNo: '2021CS101',
        branch: 'Computer Science',
        cgpa: 8.5,
        graduationYear: 2025,
        isValid: true,
        errors: []
      },
      {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '9876543211',
        rollNo: '2021CS102',
        branch: 'Computer Science',
        cgpa: 9.2,
        graduationYear: 2025,
        isValid: true,
        errors: []
      },
      {
        name: 'Invalid Student',
        email: 'invalid-email',
        phone: '12345',
        rollNo: '2021CS103',
        branch: 'CS',
        cgpa: 12.5,
        graduationYear: 2025,
        isValid: false,
        errors: ['Invalid email format', 'CGPA must be between 0-10', 'Phone must be 10 digits']
      }
    ]

    return {
      students: mockStudents,
      total: mockStudents.length,
      valid: mockStudents.filter(s => s.isValid).length,
      invalid: mockStudents.filter(s => !s.isValid).length
    }
  }

  /**
   * Confirm students
   */
  async confirmStudents(collegeId, driveId, students) {
    // Mock confirmation
    return {
      success: true,
      inserted: students.length,
      message: `${students.length} students uploaded successfully`
    }
  }

  /**
   * Get students list
   */
  async getStudents(collegeId, driveId, params) {
    const { page = 1, limit = 20, search = '', branch = '', status = '' } = params

    // Mock students data
    const mockStudents = Array.from({ length: 50 }, (_, i) => ({
      id: `student${i + 1}`,
      name: `Student ${i + 1}`,
      email: `student${i + 1}@example.com`,
      phone: `987654${String(i).padStart(4, '0')}`,
      rollNo: `2021CS${String(i + 1).padStart(3, '0')}`,
      branch: ['Computer Science', 'Information Technology', 'Electronics'][i % 3],
      cgpa: (7 + Math.random() * 3).toFixed(2),
      graduationYear: 2025,
      applicationStatus: ['NOT_APPLIED', 'APPLIED', 'IN_TEST', 'SHORTLISTED'][i % 4],
      hasApplied: i % 4 !== 0
    }))

    const start = (page - 1) * limit
    const end = start + parseInt(limit)

    return {
      students: mockStudents.slice(start, end),
      total: mockStudents.length,
      totalPages: Math.ceil(mockStudents.length / limit),
      currentPage: parseInt(page)
    }
  }

  /**
   * Delete student
   */
  async deleteStudent(collegeId, driveId, studentId) {
    // Mock deletion
    return {
      success: true,
      message: 'Student deleted successfully'
    }
  }

  /**
   * Export students
   */
  async exportStudents(collegeId, driveId, params) {
    // Mock CSV export
    const csv = `name,email,phone,rollNo,branch,cgpa,graduationYear,status
Student 1,student1@example.com,9876540000,2021CS001,Computer Science,8.5,2025,APPLIED
Student 2,student2@example.com,9876540001,2021CS002,Information Technology,7.8,2025,NOT_APPLIED
Student 3,student3@example.com,9876540002,2021CS003,Electronics,9.2,2025,SHORTLISTED`

    return csv
  }
}

module.exports = new CollegeService()
