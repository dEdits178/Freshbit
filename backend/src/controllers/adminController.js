const prisma = require('../../prisma/client');
const bcrypt = require('bcryptjs');

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
exports.getStats = async (req, res, next) => {
    try {
        // Get counts
        const [
            totalDrives,
            activeDrives,
            completedDrives,
            totalColleges,
            totalCompanies,
            totalApplications,
            selectedStudents
        ] = await Promise.all([
            prisma.drive.count(),
            prisma.drive.count({ where: { status: 'PUBLISHED' } }),
            prisma.drive.count({ where: { status: 'CLOSED' } }),
            prisma.college.count(),
            prisma.company.count(),
            prisma.application.count(),
            prisma.application.count({ where: { status: 'SELECTED' } })
        ]);

        // Get recent activity from audit logs
        const recentAuditLogs = await prisma.auditLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                actor: {
                    include: {
                        company: true,
                        college: true
                    }
                }
            }
        });

        const recentActivity = recentAuditLogs.map(log => ({
            id: log.id,
            type: log.action,
            description: log.action.replace(/_/g, ' '),
            user: log.actor.company?.name || log.actor.college?.name || log.actor.email,
            timestamp: log.createdAt
        }));

        res.json({
            success: true,
            data: {
                totalDrives,
                activeDrives,
                completedDrives,
                totalColleges,
                totalCompanies,
                totalApplications,
                selectedStudents,
                recentActivity
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/drives
 * Get all drives with pagination and filters
 */
exports.getDrives = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            stage = '',
            company = ''
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        // Build where clause
        const where = {};

        if (search) {
            where.OR = [
                { roleTitle: { contains: search, mode: 'insensitive' } },
                { company: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }

        if (status) {
            const statusMap = { ACTIVE: 'PUBLISHED', COMPLETED: 'CLOSED', DRAFT: 'DRAFT' }
            const mappedStatus = statusMap[status] || status
            where.status = mappedStatus
        }

        if (stage) {
            where.currentStage = stage;
        }

        if (company) {
            where.company = { name: { contains: company, mode: 'insensitive' } };
        }

        // Get drives with related data
        const [drives, total] = await Promise.all([
            prisma.drive.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    company: true,
                    driveColleges: true,
                    applications: true,
                    _count: {
                        select: {
                            applications: true,
                            driveColleges: true
                        }
                    }
                }
            }),
            prisma.drive.count({ where })
        ]);

        // Format drives for response
        const formattedDrives = drives.map(drive => {
            const shortlistedCount = drive.applications.filter(
                app => app.status === 'SHORTLISTED' || app.status === 'IN_INTERVIEW'
            ).length;

            const selectedCount = drive.applications.filter(
                app => app.status === 'SELECTED'
            ).length;

            // Determine managedBy from driveColleges
            const managedBy = drive.driveColleges.some(dc => dc.managedBy === 'ADMIN')
                ? 'ADMIN'
                : 'COLLEGE';

            return {
                id: drive.id,
                companyName: drive.company.name,
                role: drive.roleTitle,
                stage: drive.currentStage,
                status: drive.status === 'PUBLISHED' ? 'ACTIVE' : drive.status === 'CLOSED' ? 'COMPLETED' : 'DRAFT',
                totalApplications: drive._count.applications,
                shortlistedCount,
                selectedCount,
                managedBy,
                startDate: drive.createdAt,
                endDate: drive.updatedAt,
                createdAt: drive.createdAt,
                invitedColleges: drive._count.driveColleges
            };
        });

        res.json({
            success: true,
            data: {
                drives: formattedDrives,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/drives/:id
 * Get single drive details
 */
exports.getDriveById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const drive = await prisma.drive.findUnique({
            where: { id },
            include: {
                company: true,
                driveColleges: {
                    include: {
                        college: {
                            include: {
                                driveStudents: {
                                    where: { driveId: id }
                                }
                            }
                        }
                    }
                },
                applications: true,
                stages: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!drive) {
            return res.status(404).json({
                success: false,
                message: 'Drive not found'
            });
        }

        // Format invited colleges
        const invitedColleges = drive.driveColleges.map(dc => ({
            id: dc.college.id,
            name: dc.college.name,
            status: dc.invitationStatus,
            studentsUploaded: dc.college.driveStudents.length,
            applicationsCount: drive.applications.filter(
                app => app.collegeId === dc.college.id
            ).length
        }));

        // Format stages
        const formattedStages = drive.stages.map(stage => ({
            name: stage.name,
            isActive: stage.status === 'ACTIVE',
            isCompleted: stage.status === 'COMPLETED'
        }));

        // Calculate application stats
        const applicationStats = {
            total: drive.applications.length,
            byStatus: {
                APPLIED: drive.applications.filter(a => a.status === 'APPLIED').length,
                IN_TEST: drive.applications.filter(a => a.status === 'IN_TEST').length,
                SHORTLISTED: drive.applications.filter(a => a.status === 'SHORTLISTED').length,
                IN_INTERVIEW: drive.applications.filter(a => a.status === 'IN_INTERVIEW').length,
                SELECTED: drive.applications.filter(a => a.status === 'SELECTED').length,
                REJECTED: drive.applications.filter(a => a.status === 'REJECTED').length
            }
        };

        // Determine managedBy
        const managedBy = drive.driveColleges.some(dc => dc.managedBy === 'ADMIN')
            ? 'ADMIN'
            : 'COLLEGE';

        res.json({
            success: true,
            data: {
                id: drive.id,
                companyName: drive.company.name,
                role: drive.roleTitle,
                description: drive.description,
                ctc: drive.salary,
                location: drive.company.domain || 'Not specified',
                eligibility: 'B.Tech CS/IT, CGPA > 7.0', // This should come from drive data
                stage: drive.currentStage,
                status: drive.status === 'PUBLISHED' ? 'ACTIVE' : drive.status === 'CLOSED' ? 'COMPLETED' : 'DRAFT',
                managedBy,
                startDate: drive.createdAt,
                endDate: drive.updatedAt,
                invitedColleges,
                stages: formattedStages,
                applicationStats
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/colleges
 * Get all colleges with pagination
 */
exports.getColleges = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = ''
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [colleges, total] = await Promise.all([
            prisma.college.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: true,
                    driveColleges: {
                        include: {
                            drive: true
                        }
                    },
                    students: true
                }
            }),
            prisma.college.count({ where })
        ]);

        const formattedColleges = colleges.map(college => ({
            id: college.id,
            name: college.name,
            email: college.user.email,
            organizationName: `${college.name}, ${college.city}, ${college.state}`,
            totalDrives: college.driveColleges.length,
            activeDrives: college.driveColleges.filter(
                dc => dc.drive.status === 'PUBLISHED'
            ).length,
            totalStudents: college.students.length,
            isActive: college.user.status === 'APPROVED',
            createdAt: college.createdAt
        }));

        res.json({
            success: true,
            data: {
                colleges: formattedColleges,
                total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/admin/colleges
 * Create new college
 */
exports.createCollege = async (req, res, next) => {
    try {
        const { name, email, password, organizationName } = req.body;

        // Validate required fields
        if (!name || !email || !password || !organizationName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'College with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Parse organization name to extract city and state (simplified)
        const parts = organizationName.split(',').map(p => p.trim());
        const city = parts[1] || 'Unknown';
        const state = parts[2] || 'Unknown';

        // Create user and college
        const college = await prisma.college.create({
            data: {
                name,
                city,
                state,
                tier: 'Tier-1', // Default tier
                approved: true,
                user: {
                    create: {
                        email,
                        password: hashedPassword,
                        role: 'COLLEGE',
                        status: 'APPROVED',
                        verified: true
                    }
                }
            },
            include: {
                user: true
            }
        });

        res.status(201).json({
            success: true,
            data: {
                id: college.id,
                name: college.name,
                email: college.user.email,
                organizationName,
                isActive: true
            },
            message: 'College created successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/admin/colleges/:id
 * Update college
 */
exports.updateCollege = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, email, organizationName } = req.body;

        const college = await prisma.college.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!college) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }

        // Parse organization name
        const parts = organizationName.split(',').map(p => p.trim());
        const city = parts[1] || college.city;
        const state = parts[2] || college.state;

        // Update college and user
        const updated = await prisma.college.update({
            where: { id },
            data: {
                name,
                city,
                state,
                user: {
                    update: {
                        email
                    }
                }
            },
            include: {
                user: true
            }
        });

        res.json({
            success: true,
            data: {
                id: updated.id,
                name: updated.name,
                email: updated.user.email,
                organizationName
            },
            message: 'College updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/admin/colleges/:id
 * Delete college
 */
exports.deleteCollege = async (req, res, next) => {
    try {
        const { id } = req.params;

        const college = await prisma.college.findUnique({
            where: { id },
            include: { user: true }
        });

        if (!college) {
            return res.status(404).json({
                success: false,
                message: 'College not found'
            });
        }

        // Delete user (will cascade delete college)
        await prisma.user.delete({
            where: { id: college.userId }
        });

        res.json({
            success: true,
            message: 'College deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/companies
 * Get all companies
 */
exports.getCompanies = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = ''
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [companies, total] = await Promise.all([
            prisma.company.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: true,
                    drives: true
                }
            }),
            prisma.company.count({ where })
        ]);

        const formattedCompanies = companies.map(company => ({
            id: company.id,
            name: company.name,
            email: company.user.email,
            totalDrives: company.drives.length,
            activeDrives: company.drives.filter(d => d.status === 'PUBLISHED').length,
            isActive: company.user.status === 'APPROVED',
            createdAt: company.createdAt
        }));

        res.json({
            success: true,
            data: {
                companies: formattedCompanies,
                total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/admin/analytics/overview
 * Get analytics data
 */
exports.getAnalytics = async (req, res, next) => {
    try {
        // Get applications over time (last 12 months)
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

        const applications = await prisma.application.findMany({
            where: {
                appliedAt: {
                    gte: twelveMonthsAgo
                }
            },
            select: {
                appliedAt: true
            }
        });

        // Group by month
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const applicationsOverTime = monthNames.map((month, index) => {
            const count = applications.filter(app => {
                const appMonth = new Date(app.appliedAt).getMonth();
                return appMonth === index;
            }).length;
            return { month, applications: count };
        });

        // Drives by status
        const [publishedDrives, closedDrives, draftDrives] = await Promise.all([
            prisma.drive.count({ where: { status: 'PUBLISHED' } }),
            prisma.drive.count({ where: { status: 'CLOSED' } }),
            prisma.drive.count({ where: { status: 'DRAFT' } })
        ]);

        const drivesByStatus = [
            { name: 'Active', value: publishedDrives },
            { name: 'Completed', value: closedDrives },
            { name: 'Draft', value: draftDrives }
        ];

        // Top colleges by applications
        const colleges = await prisma.college.findMany({
            include: {
                applications: true,
                _count: {
                    select: {
                        applications: true
                    }
                }
            }
        });

        const topColleges = colleges
            .map(college => ({
                name: college.name,
                applications: college._count.applications,
                selections: college.applications.filter(a => a.status === 'SELECTED').length
            }))
            .sort((a, b) => b.applications - a.applications)
            .slice(0, 10);

        // Top companies by drives
        const companies = await prisma.company.findMany({
            include: {
                drives: {
                    include: {
                        applications: true
                    }
                }
            }
        });

        const topCompanies = companies
            .map(company => {
                const allApplications = company.drives.flatMap(d => d.applications);
                return {
                    name: company.name,
                    drives: company.drives.length,
                    applications: allApplications.length,
                    selections: allApplications.filter(a => a.status === 'SELECTED').length
                };
            })
            .sort((a, b) => b.drives - a.drives)
            .slice(0, 10);

        res.json({
            success: true,
            data: {
                applicationsOverTime,
                drivesByStatus,
                topColleges,
                topCompanies
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/admin/drives/:id/activate-next-stage
 * Activate next stage for a drive
 */
exports.activateNextStage = async (req, res, next) => {
    try {
        const { id } = req.params;

        const drive = await prisma.drive.findUnique({
            where: { id },
            include: {
                stages: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        if (!drive) {
            return res.status(404).json({
                success: false,
                message: 'Drive not found'
            });
        }

        // Find current active stage
        const currentStage = drive.stages.find(s => s.status === 'ACTIVE');
        if (!currentStage) {
            return res.status(400).json({
                success: false,
                message: 'No active stage found'
            });
        }

        // Find next stage
        const nextStage = drive.stages.find(s => s.order === currentStage.order + 1);
        if (!nextStage) {
            return res.status(400).json({
                success: false,
                message: 'No next stage available'
            });
        }

        // Update stages
        await prisma.$transaction([
            prisma.stage.update({
                where: { id: currentStage.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date()
                }
            }),
            prisma.stage.update({
                where: { id: nextStage.id },
                data: {
                    status: 'ACTIVE',
                    startedAt: new Date()
                }
            }),
            prisma.drive.update({
                where: { id },
                data: {
                    currentStage: nextStage.name
                }
            })
        ]);

        res.json({
            success: true,
            message: 'Stage activated successfully'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/admin/drives/:id/close
 * Close a drive
 */
exports.closeDrive = async (req, res, next) => {
    try {
        const { id } = req.params;

        const drive = await prisma.drive.findUnique({
            where: { id }
        });

        if (!drive) {
            return res.status(404).json({
                success: false,
                message: 'Drive not found'
            });
        }

        await prisma.drive.update({
            where: { id },
            data: {
                status: 'CLOSED',
                isLocked: true,
                lockedAt: new Date()
            }
        });

        res.json({
            success: true,
            message: 'Drive closed successfully'
        });
    } catch (error) {
        next(error);
    }
};
