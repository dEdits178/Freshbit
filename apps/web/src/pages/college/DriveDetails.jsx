import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Building2, MapPin, Calendar, Users, CheckCircle,
    Upload, FileText, UserCheck, Award, ChevronRight
} from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import * as collegeService from '../../services/collegeService';
import { formatCurrency, formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';

/**
 * DriveDetails Component
 * View drive details with stage-based actions
 */
const DriveDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [drive, setDrive] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDriveDetails();
    }, [id]);

    const fetchDriveDetails = async () => {
        setLoading(true);
        try {
            const data = await collegeService.getDriveById(id);
            setDrive(data);
        } catch (error) {
            console.error('Failed to load drive details:', error);
            toast.error('Failed to load drive details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-64"></div>
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-32 bg-gray-200 rounded-lg"></div>
            </div>
        );
    }

    if (!drive) {
        return (
            <Card>
                <EmptyState
                    icon={FileText}
                    title="Drive not found"
                    description="The requested drive could not be found."
                />
            </Card>
        );
    }

    const stages = [
        { name: 'APPLICATIONS', label: 'Applications', icon: FileText },
        { name: 'TEST', label: 'Test', icon: FileText },
        { name: 'SHORTLIST', label: 'Shortlist', icon: UserCheck },
        { name: 'INTERVIEW', label: 'Interview', icon: Users },
        { name: 'FINAL', label: 'Final', icon: Award }
    ];

    const currentStageIndex = stages.findIndex(s => s.name === drive.stage);

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <button
                onClick={() => navigate('/college/invitations?tab=accepted')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Drives</span>
            </button>

            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {drive.role}
                    </h1>
                    <Badge variant={drive.status === 'ACTIVE' ? 'success' : 'default'}>
                        {drive.status}
                    </Badge>
                    <Badge variant="purple">
                        {drive.managedBy === 'COLLEGE' ? 'College Managed' : 'Admin Managed'}
                    </Badge>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Building2 className="w-5 h-5" />
                    <span className="font-medium">{drive.companyName}</span>
                </div>
            </div>

            {/* Drive Information */}
            <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Drive Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-600">CTC</label>
                        <p className="text-lg font-semibold text-green-600 mt-1">
                            {formatCurrency(drive.ctc)}
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">Location</label>
                        <p className="text-gray-900 mt-1 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            {drive.location}
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">Start Date</label>
                        <p className="text-gray-900 mt-1 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(drive.startDate)}
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-600">End Date</label>
                        <p className="text-gray-900 mt-1 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(drive.endDate)}
                        </p>
                    </div>
                </div>

                {drive.description && (
                    <div className="mt-6">
                        <label className="text-sm font-medium text-gray-600">Description</label>
                        <p className="text-gray-700 mt-2 leading-relaxed">
                            {drive.description}
                        </p>
                    </div>
                )}

                {drive.eligibility && (
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <label className="text-sm font-medium text-gray-900 mb-2 block">
                            Eligibility Criteria
                        </label>
                        <p className="text-gray-700 text-sm leading-relaxed">
                            {drive.eligibility}
                        </p>
                    </div>
                )}
            </Card>

            {/* Stage Progress */}
            <Card>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Drive Progress
                </h2>

                <div className="relative">
                    {/* Progress Line */}
                    <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200">
                        <div
                            className="h-full bg-primary-600 transition-all duration-500"
                            style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
                        />
                    </div>

                    {/* Stages */}
                    <div className="relative flex justify-between">
                        {stages.map((stage, index) => {
                            const isCompleted = index < currentStageIndex;
                            const isActive = index === currentStageIndex;
                            const Icon = stage.icon;

                            return (
                                <div key={stage.name} className="flex flex-col items-center">
                                    <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all
                    ${isCompleted
                                            ? 'bg-green-600 text-white'
                                            : isActive
                                                ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                                                : 'bg-gray-200 text-gray-400'
                                        }
                  `}>
                                        {isCompleted ? (
                                            <CheckCircle className="w-6 h-6" />
                                        ) : (
                                            <Icon className="w-6 h-6" />
                                        )}
                                    </div>
                                    <span className={`
                    text-sm font-medium
                    ${isActive ? 'text-primary-600' : 'text-gray-600'}
                  `}>
                                        {stage.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Current Action */}
            <Card>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {getActionTitle(drive)}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {getActionDescription(drive)}
                        </p>

                        {getActionButton(drive, navigate)}
                    </div>

                    <div className="ml-6">
                        {getActionIcon(drive)}
                    </div>
                </div>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Students Uploaded</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {drive.studentsUploaded || 0}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Applications</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {drive.applicationsCount || 0}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Award className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Current Stage</p>
                            <p className="text-lg font-bold text-gray-900">
                                {stages[currentStageIndex]?.label || 'N/A'}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Links */}
            {drive.studentsUploaded > 0 && (
                <Card>
                    <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            onClick={() => navigate(`/college/drives/${id}/students`)}
                            rightIcon={ChevronRight}
                            fullWidth
                        >
                            View Uploaded Students
                        </Button>
                        {drive.applicationsCount > 0 && (
                            <Button
                                variant="outline"
                                onClick={() => navigate(`/college/drives/${id}/applications`)}
                                rightIcon={ChevronRight}
                                fullWidth
                            >
                                View Applications
                            </Button>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
};

// Helper functions
const getActionTitle = (drive) => {
    if (drive.stage === 'APPLICATIONS' && !drive.studentsUploaded) {
        return 'Upload Students';
    }
    if (drive.stage === 'APPLICATIONS' && drive.studentsUploaded) {
        return 'Students Uploaded Successfully';
    }
    if (drive.stage === 'TEST' && drive.canUploadShortlist) {
        return 'Upload Shortlist';
    }
    if (drive.stage === 'SHORTLIST' && drive.canUploadInterviewList) {
        return 'Upload Interview List';
    }
    if (drive.stage === 'INTERVIEW' && drive.canFinalize) {
        return 'Finalize Selections';
    }
    if (drive.stage === 'FINAL') {
        return 'Drive Completed';
    }
    return 'Waiting for Next Stage';
};

const getActionDescription = (drive) => {
    if (drive.stage === 'APPLICATIONS' && !drive.studentsUploaded) {
        return 'Upload the list of students who are eligible to participate in this placement drive.';
    }
    if (drive.stage === 'APPLICATIONS' && drive.studentsUploaded) {
        return `${drive.studentsUploaded} students have been uploaded successfully. Students can now apply for this drive.`;
    }
    if (drive.stage === 'TEST' && drive.canUploadShortlist) {
        return 'Test stage is complete. Upload the list of shortlisted students for the next stage.';
    }
    if (drive.stage === 'SHORTLIST' && drive.canUploadInterviewList) {
        return 'Upload the list of students selected for interviews.';
    }
    if (drive.stage === 'INTERVIEW' && drive.canFinalize) {
        return 'Upload the final list of students who will receive offers.';
    }
    if (drive.stage === 'FINAL') {
        return `Drive completed successfully with ${drive.finalSelections || 0} students selected.`;
    }
    return 'Waiting for the company to complete the current stage.';
};

const getActionButton = (drive, navigate) => {
    if (drive.stage === 'APPLICATIONS' && !drive.studentsUploaded) {
        return (
            <Button
                variant="primary"
                size="lg"
                leftIcon={Upload}
                onClick={() => navigate(`/college/drives/${drive.id}/upload-students`)}
            >
                Upload Students
            </Button>
        );
    }
    if (drive.stage === 'APPLICATIONS' && drive.studentsUploaded) {
        return (
            <Button
                variant="outline"
                onClick={() => navigate(`/college/drives/${drive.id}/students`)}
                rightIcon={ChevronRight}
            >
                View Students
            </Button>
        );
    }
    if (drive.canUploadShortlist || drive.canUploadInterviewList || drive.canFinalize) {
        return (
            <Button
                variant="primary"
                size="lg"
                leftIcon={Upload}
            >
                Upload List
            </Button>
        );
    }
    if (drive.stage === 'FINAL') {
        return (
            <Button
                variant="outline"
                rightIcon={ChevronRight}
            >
                View Selections
            </Button>
        );
    }
    return null;
};

const getActionIcon = (drive) => {
    if (drive.stage === 'APPLICATIONS' && !drive.studentsUploaded) {
        return (
            <div className="p-4 bg-blue-100 rounded-full">
                <Upload className="w-8 h-8 text-blue-600" />
            </div>
        );
    }
    if (drive.stage === 'FINAL') {
        return (
            <div className="p-4 bg-green-100 rounded-full">
                <Award className="w-8 h-8 text-green-600" />
            </div>
        );
    }
    return (
        <div className="p-4 bg-gray-100 rounded-full">
            <FileText className="w-8 h-8 text-gray-600" />
        </div>
    );
};

export default DriveDetails;
