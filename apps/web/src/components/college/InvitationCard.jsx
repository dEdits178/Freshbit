import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { formatCurrency, formatDate, formatTimeAgo } from '../../utils/helpers';

/**
 * InvitationCard Component
 * Displays drive invitation details with status and actions
 * 
 * @param {Object} invitation - Invitation data
 * @param {Function} onAccept - Accept invitation handler
 * @param {Function} onReject - Reject invitation handler
 * @param {Function} onViewDetails - View details handler
 * @param {boolean} compact - Show compact version
 */
const InvitationCard = ({
    invitation,
    onAccept,
    onReject,
    onViewDetails,
    compact = false
}) => {
    const [expanded, setExpanded] = useState(false);

    // Compact version for dashboard
    if (compact) {
        return (
            <Card hover padding="md" className="relative">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                                {invitation.companyName}
                            </h3>
                            <Badge variant={getStatusVariant(invitation.status)}>
                                {invitation.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{invitation.role}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="font-semibold text-green-600">
                                {formatCurrency(invitation.ctc)}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {invitation.location}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(invitation.invitedAt)}
                            </span>
                        </div>
                    </div>

                    {invitation.status === 'PENDING' && (
                        <div className="flex items-center gap-2 ml-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onReject(invitation.id)}
                            >
                                Reject
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={() => onAccept(invitation.id)}
                            >
                                Accept
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        );
    }

    // Full detailed version
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card hover padding="lg" className="relative">
                {/* Status Badge (Top Right) */}
                <div className="absolute top-4 right-4">
                    <Badge variant={getStatusVariant(invitation.status)} size="lg">
                        {invitation.status}
                    </Badge>
                </div>

                {/* Header */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Company</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">
                        {invitation.companyName}
                    </h3>
                    <p className="text-lg text-gray-700 font-medium">{invitation.role}</p>
                </div>

                {/* CTC & Location */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-semibold text-lg">
                        {formatCurrency(invitation.ctc)}
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-5 h-5" />
                        <span className="font-medium">{invitation.location}</span>
                    </div>
                </div>

                {/* Description */}
                {invitation.description && (
                    <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-2">About the Role</h4>
                        <p className={`text-gray-600 ${!expanded && 'line-clamp-3'}`}>
                            {invitation.description}
                        </p>
                        {invitation.description.length > 150 && (
                            <button
                                onClick={() => setExpanded(!expanded)}
                                className="text-primary-600 hover:text-primary-700 text-sm mt-2 flex items-center gap-1 font-medium"
                            >
                                {expanded ? (
                                    <>
                                        Show less <ChevronUp className="w-4 h-4" />
                                    </>
                                ) : (
                                    <>
                                        Read more <ChevronDown className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}

                {/* Eligibility */}
                {invitation.eligibility && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                            Eligibility Criteria
                        </h4>
                        <p className="text-gray-700 text-sm leading-relaxed">
                            {invitation.eligibility}
                        </p>
                    </div>
                )}

                {/* Dates */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                            <span className="text-gray-500">Start Date:</span>
                            <span className="ml-2 font-medium text-gray-900">
                                {formatDate(invitation.startDate)}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                            <span className="text-gray-500">End Date:</span>
                            <span className="ml-2 font-medium text-gray-900">
                                {formatDate(invitation.endDate)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Managed By Badge */}
                <div className="mb-4">
                    <Badge variant="purple" size="md">
                        {invitation.managedBy === 'COLLEGE' ? '🎓 College Managed' : '👨‍💼 Admin Managed'}
                    </Badge>
                </div>

                {/* Invited Date */}
                <p className="text-sm text-gray-500 mb-6 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Invited {formatTimeAgo(invitation.invitedAt)}
                </p>

                {/* Rejection Reason (if rejected) */}
                {invitation.status === 'REJECTED' && invitation.rejectionReason && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
                        <h4 className="font-semibold text-red-900 mb-2">Rejection Reason</h4>
                        <p className="text-red-700 text-sm">{invitation.rejectionReason}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                    {invitation.status === 'PENDING' && (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => onReject(invitation.id)}
                                fullWidth
                            >
                                Reject
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => onAccept(invitation.id)}
                                fullWidth
                            >
                                Accept Invitation
                            </Button>
                        </>
                    )}

                    {invitation.status === 'ACCEPTED' && (
                        <>
                            <Button
                                variant="outline"
                                onClick={() => onViewDetails(invitation.driveId)}
                                fullWidth
                            >
                                View Drive Details
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => window.location.href = `/college/drives/${invitation.driveId}/upload-students`}
                                fullWidth
                            >
                                Upload Students
                            </Button>
                        </>
                    )}

                    {invitation.status === 'REJECTED' && (
                        <Button
                            variant="outline"
                            onClick={() => onViewDetails(invitation.driveId)}
                            fullWidth
                        >
                            View Details
                        </Button>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};

/**
 * Get badge variant based on status
 */
const getStatusVariant = (status) => {
    switch (status) {
        case 'PENDING':
            return 'warning';
        case 'ACCEPTED':
            return 'success';
        case 'REJECTED':
            return 'danger';
        default:
            return 'default';
    }
};

export default InvitationCard;
