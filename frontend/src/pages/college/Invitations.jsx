import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import InvitationCard from '../../components/college/InvitationCard';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import * as collegeService from '../../services/collegeService';
import toast from 'react-hot-toast';

/**
 * Invitations Component
 * Manage drive invitations with tabbed interface
 */
const Invitations = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'pending';

    const [activeTab, setActiveTab] = useState(initialTab);
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [selectedInvitation, setSelectedInvitation] = useState(null);
    const [confirmationType, setConfirmationType] = useState('accept');
    const [rejectionReason, setRejectionReason] = useState('');
    const [eligibilityConfirmed, setEligibilityConfirmed] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const tabs = [
        { id: 'pending', label: 'Pending', status: 'PENDING' },
        { id: 'accepted', label: 'Accepted', status: 'ACCEPTED' },
        { id: 'rejected', label: 'Rejected', status: 'REJECTED' }
    ];

    useEffect(() => {
        fetchInvitations();
    }, [activeTab]);

    const fetchInvitations = async () => {
        setLoading(true);
        try {
            const currentTab = tabs.find(t => t.id === activeTab);
            const data = await collegeService.getInvitations(currentTab.status);
            setInvitations(data.invitations || []);
        } catch (error) {
            console.error('Failed to load invitations:', error);
            toast.error('Failed to load invitations');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setSearchParams({ tab: tabId });
        setSearch('');
    };

    const openAcceptDialog = (invitation) => {
        setSelectedInvitation(invitation);
        setConfirmationType('accept');
        setEligibilityConfirmed(false);
        setConfirmDialogOpen(true);
    };

    const openRejectDialog = (invitation) => {
        setSelectedInvitation(invitation);
        setConfirmationType('reject');
        setRejectionReason('');
        setConfirmDialogOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedInvitation) return;

        setActionLoading(true);
        try {
            if (confirmationType === 'accept') {
                await collegeService.acceptInvitation(selectedInvitation.id);
                toast.success('Invitation accepted successfully!');
            } else {
                await collegeService.rejectInvitation(selectedInvitation.id, rejectionReason);
                toast.success('Invitation rejected');
            }

            setConfirmDialogOpen(false);
            setSelectedInvitation(null);
            fetchInvitations();
        } catch (error) {
            console.error('Failed to process invitation:', error);
            toast.error(error.response?.data?.message || 'Failed to process invitation');
        } finally {
            setActionLoading(false);
        }
    };

    const filteredInvitations = invitations.filter(inv => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return (
            inv.companyName.toLowerCase().includes(searchLower) ||
            inv.role.toLowerCase().includes(searchLower)
        );
    });

    const getTabCount = (tabId) => {
        const tab = tabs.find(t => t.id === tabId);
        return invitations.length;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Drive Invitations
                </h1>
                <p className="text-gray-600 mt-1">
                    Manage placement drive invitations from companies
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-8">
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                  relative pb-4 px-1 font-medium text-sm transition-colors
                  ${isActive
                                        ? 'text-primary-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }
                `}
                            >
                                <span className="flex items-center gap-2">
                                    {tab.label}
                                    {!loading && (
                                        <span className={`
                      px-2 py-0.5 rounded-full text-xs font-semibold
                      ${isActive
                                                ? 'bg-primary-100 text-primary-700'
                                                : 'bg-gray-100 text-gray-600'
                                            }
                    `}>
                                            {getTabCount(tab.id)}
                                        </span>
                                    )}
                                </span>

                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Search */}
            {invitations.length > 0 && (
                <div className="max-w-md">
                    <Input
                        type="text"
                        placeholder="Search by company or role..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        leftIcon={Search}
                    />
                </div>
            )}

            {/* Content */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 gap-6"
                    >
                        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                    </motion.div>
                ) : filteredInvitations.length === 0 ? (
                    <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card>
                            <EmptyState
                                icon={getEmptyIcon(activeTab)}
                                title={getEmptyTitle(activeTab)}
                                description={getEmptyDescription(activeTab)}
                            />
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 gap-6"
                    >
                        {filteredInvitations.map((invitation, index) => (
                            <motion.div
                                key={invitation.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <InvitationCard
                                    invitation={invitation}
                                    onAccept={openAcceptDialog}
                                    onReject={openRejectDialog}
                                    onViewDetails={(driveId) => navigate(`/college/drives/${driveId}`)}
                                />
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Confirmation Dialog */}
            <Modal
                isOpen={confirmDialogOpen}
                onClose={() => !actionLoading && setConfirmDialogOpen(false)}
                title={confirmationType === 'accept' ? 'Accept Invitation?' : 'Reject Invitation?'}
            >
                {selectedInvitation && (
                    <div className="space-y-4">
                        {confirmationType === 'accept' ? (
                            <>
                                <p className="text-gray-700">
                                    You're about to accept the placement drive invitation for:
                                </p>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                                    <div>
                                        <span className="text-sm text-gray-600">Company:</span>
                                        <p className="font-semibold text-gray-900">{selectedInvitation.companyName}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">Role:</span>
                                        <p className="font-semibold text-gray-900">{selectedInvitation.role}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm text-gray-600">CTC:</span>
                                        <p className="font-semibold text-green-600">
                                            {selectedInvitation.ctc ? `₹${(selectedInvitation.ctc / 100000).toFixed(2)} LPA` : 'N/A'}
                                        </p>
                                    </div>
                                    {selectedInvitation.eligibility && (
                                        <div>
                                            <span className="text-sm text-gray-600">Eligibility:</span>
                                            <p className="text-sm text-gray-700">{selectedInvitation.eligibility}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-yellow-800">
                                        <p className="font-medium mb-1">Important</p>
                                        <p>Please ensure your students meet the eligibility criteria before accepting.</p>
                                    </div>
                                </div>

                                <label className="flex items-start gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={eligibilityConfirmed}
                                        onChange={(e) => setEligibilityConfirmed(e.target.checked)}
                                        className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="text-sm text-gray-700">
                                        I confirm that our students meet the eligibility criteria for this drive
                                    </span>
                                </label>

                                <div className="flex items-center gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirmDialogOpen(false)}
                                        fullWidth
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleConfirmAction}
                                        fullWidth
                                        disabled={!eligibilityConfirmed || actionLoading}
                                        loading={actionLoading}
                                    >
                                        Accept Invitation
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-gray-700">
                                    Are you sure you want to reject this invitation? This action cannot be undone.
                                </p>

                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <p className="font-semibold text-gray-900">{selectedInvitation.companyName}</p>
                                    <p className="text-sm text-gray-600">{selectedInvitation.role}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason for rejection (optional)
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="e.g., Does not match our placement criteria"
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirmDialogOpen(false)}
                                        fullWidth
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={handleConfirmAction}
                                        fullWidth
                                        loading={actionLoading}
                                    >
                                        Reject Invitation
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

// Helper functions for empty states
const getEmptyIcon = (tab) => {
    switch (tab) {
        case 'pending': return Mail;
        case 'accepted': return CheckCircle;
        case 'rejected': return XCircle;
        default: return Mail;
    }
};

const getEmptyTitle = (tab) => {
    switch (tab) {
        case 'pending': return 'No pending invitations';
        case 'accepted': return 'No accepted drives yet';
        case 'rejected': return 'No rejected invitations';
        default: return 'No invitations';
    }
};

const getEmptyDescription = (tab) => {
    switch (tab) {
        case 'pending': return "You're all caught up! New invitations will appear here.";
        case 'accepted': return 'Accept invitations to start managing placement drives.';
        case 'rejected': return 'Rejected invitations will appear here.';
        default: return '';
    }
};

export default Invitations;
