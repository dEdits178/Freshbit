import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Briefcase, GraduationCap, CheckCircle, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import InvitationCard from '../../components/college/InvitationCard';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonStatCard } from '../../components/common/SkeletonLoader';
import * as collegeService from '../../services/collegeService';
import { formatTimeAgo, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

/**
 * CollegeDashboard Component
 * Main landing page for college users showing stats, pending invitations, and active drives
 */
const CollegeDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [pendingInvitations, setPendingInvitations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const data = await collegeService.getStats();
            setStats(data);
            setPendingInvitations(data.recentInvitations || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptInvitation = async (invitationId) => {
        try {
            await collegeService.acceptInvitation(invitationId);
            toast.success('Invitation accepted successfully!');
            fetchDashboardData();
        } catch (error) {
            console.error('Failed to accept invitation:', error);
            toast.error(error.response?.data?.message || 'Failed to accept invitation');
        }
    };

    const handleRejectInvitation = async (invitationId) => {
        try {
            await collegeService.rejectInvitation(invitationId);
            toast.success('Invitation rejected');
            fetchDashboardData();
        } catch (error) {
            console.error('Failed to reject invitation:', error);
            toast.error(error.response?.data?.message || 'Failed to reject invitation');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                {/* Loading Skeletons */}
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-96"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <SkeletonStatCard key={i} />)}
                </div>

                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-48"></div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome, {user?.organizationName || user?.name}! 👋
                </h1>
                <p className="text-gray-600 mt-1">
                    Manage your placement drives and student data
                </p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                initial="hidden"
                animate="show"
                variants={{
                    hidden: { opacity: 0 },
                    show: {
                        opacity: 1,
                        transition: { staggerChildren: 0.1 }
                    }
                }}
            >
                <motion.div
                    variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                    onClick={() => navigate('/college/invitations')}
                    className="cursor-pointer"
                >
                    <StatCard
                        title="Pending Invitations"
                        value={stats.pendingInvitations}
                        icon={Mail}
                        iconColor="orange"
                        trend={stats.pendingInvitations > 5 ? "Action needed!" : stats.pendingInvitations > 0 ? "Review pending" : null}
                        trendUp={false}
                    />
                </motion.div>

                <motion.div
                    variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}
                    onClick={() => navigate('/college/invitations?tab=accepted')}
                    className="cursor-pointer"
                >
                    <StatCard
                        title="Accepted Drives"
                        value={stats.acceptedDrives}
                        icon={Briefcase}
                        iconColor="blue"
                    />
                </motion.div>

                <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
                    <StatCard
                        title="Students Uploaded"
                        value={stats.studentsUploaded.toLocaleString()}
                        icon={GraduationCap}
                        iconColor="purple"
                    />
                </motion.div>

                <motion.div variants={{ hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } }}>
                    <StatCard
                        title="Final Selections"
                        value={stats.finalSelections}
                        icon={CheckCircle}
                        iconColor="green"
                        trend={stats.finalSelections > 0 ? `${stats.finalSelections} students placed` : null}
                        trendUp={true}
                    />
                </motion.div>
            </motion.div>

            {/* Pending Invitations Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        Pending Invitations
                        {stats.pendingInvitations > 0 && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full">
                                {stats.pendingInvitations}
                            </span>
                        )}
                    </h2>
                    {stats.pendingInvitations > 5 && (
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/college/invitations')}
                            rightIcon={ArrowRight}
                        >
                            View All
                        </Button>
                    )}
                </div>

                {pendingInvitations.length === 0 ? (
                    <Card>
                        <EmptyState
                            icon={Mail}
                            title="No pending invitations"
                            description="You're all caught up! New invitations will appear here."
                        />
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {pendingInvitations.slice(0, 5).map(invitation => (
                            <InvitationCard
                                key={invitation.id}
                                invitation={invitation}
                                onAccept={handleAcceptInvitation}
                                onReject={handleRejectInvitation}
                                onViewDetails={(driveId) => navigate(`/college/drives/${driveId}`)}
                                compact
                            />
                        ))}

                        {pendingInvitations.length > 5 && (
                            <Button
                                variant="ghost"
                                fullWidth
                                onClick={() => navigate('/college/invitations')}
                                rightIcon={ArrowRight}
                            >
                                View All {stats.pendingInvitations} Invitations
                            </Button>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card
                        hover
                        padding="lg"
                        onClick={() => navigate('/college/invitations')}
                        className="cursor-pointer group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                                <Mail className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Review Invitations
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Accept or reject placement drive invitations
                                </p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                        </div>
                    </Card>

                    <Card
                        hover
                        padding="lg"
                        onClick={() => navigate('/college/invitations?tab=accepted')}
                        className="cursor-pointer group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                <Briefcase className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    Manage Drives
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Upload students and track drive progress
                                </p>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                        </div>
                    </Card>

                    <Card
                        hover
                        padding="lg"
                        className="cursor-pointer group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    View Analytics
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Track placement statistics and trends
                                </p>
                                <span className="text-xs text-gray-500 mt-1 inline-block">
                                    Coming soon
                                </span>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
                        </div>
                    </Card>
                </div>
            </motion.div>

            {/* Recent Activity Placeholder */}
            {stats.acceptedDrives > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        Recent Activity
                    </h2>
                    <Card>
                        <div className="text-center py-8">
                            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600">
                                Activity timeline coming soon
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Track all your placement drive activities in one place
                            </p>
                        </div>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default CollegeDashboard;
