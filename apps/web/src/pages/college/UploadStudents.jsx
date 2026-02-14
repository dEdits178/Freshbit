import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, Download, CheckCircle, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import FileUpload from '../../components/common/FileUpload';
import StudentPreviewTable from '../../components/college/StudentPreviewTable';
import * as collegeService from '../../services/collegeService';
import toast from 'react-hot-toast';

/**
 * UploadStudents Component
 * Two-step student upload workflow: Upload → Preview → Confirm
 */
const UploadStudents = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [step, setStep] = useState(1); // 1: upload, 2: preview
    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
    };

    const handleUploadPreview = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        setUploading(true);
        try {
            const data = await collegeService.uploadStudentFile(id, file);
            setPreviewData(data);
            setStep(2);

            if (data.invalidRows > 0) {
                toast.warning(`${data.invalidRows} rows have validation errors`);
            } else {
                toast.success('All rows are valid!');
            }
        } catch (error) {
            console.error('Failed to upload file:', error);
            toast.error(error.response?.data?.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const handleConfirmInsert = async () => {
        if (!previewData) return;

        const validStudents = previewData.preview.filter(s => s.isValid);

        if (validStudents.length === 0) {
            toast.error('No valid students to insert');
            return;
        }

        setConfirming(true);
        try {
            const result = await collegeService.confirmStudents(id, validStudents);
            toast.success(result.message || `${validStudents.length} students uploaded successfully!`);
            navigate(`/college/drives/${id}/students`);
        } catch (error) {
            console.error('Failed to confirm students:', error);
            toast.error(error.response?.data?.message || 'Failed to insert students');
        } finally {
            setConfirming(false);
        }
    };

    const handleReUpload = () => {
        setStep(1);
        setFile(null);
        setPreviewData(null);
    };

    const handleDownloadTemplate = async () => {
        try {
            await collegeService.downloadTemplate();
            toast.success('Template downloaded');
        } catch (error) {
            console.error('Failed to download template:', error);
            toast.error('Failed to download template');
        }
    };

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <button
                onClick={() => navigate(`/college/drives/${id}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Drive</span>
            </button>

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">
                    Upload Students
                </h1>
                <p className="text-gray-600 mt-1">
                    Upload student list to participate in this placement drive
                </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
                    <div className={`
            w-8 h-8 rounded-full flex items-center justify-center font-semibold
            ${step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}
          `}>
                        1
                    </div>
                    <span className="font-medium">Upload File</span>
                </div>

                <div className={`flex-1 h-0.5 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`} />

                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
                    <div className={`
            w-8 h-8 rounded-full flex items-center justify-center font-semibold
            ${step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}
          `}>
                        2
                    </div>
                    <span className="font-medium">Preview & Confirm</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-6"
                    >
                        {/* Instructions */}
                        <Card>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                                How to Upload Students
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Download the CSV template</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Use our template to ensure correct formatting
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Fill in student information</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Add all required fields for each student
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Upload the completed file</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            We'll validate the data and show you a preview
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                                        4
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">Review and confirm</p>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Check the preview and confirm to insert students
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <Button
                                    variant="outline"
                                    leftIcon={Download}
                                    onClick={handleDownloadTemplate}
                                >
                                    Download CSV Template
                                </Button>
                            </div>
                        </Card>

                        {/* Required Columns */}
                        <Card>
                            <h3 className="font-semibold text-gray-900 mb-3">
                                Required Columns
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { name: 'name', desc: 'Full name of the student' },
                                    { name: 'email', desc: 'Valid email address (unique)' },
                                    { name: 'phone', desc: '10-digit phone number' },
                                    { name: 'rollNo', desc: 'Roll number (unique)' },
                                    { name: 'branch', desc: 'Branch/Department' },
                                    { name: 'cgpa', desc: 'CGPA (0-10 range)' },
                                    { name: 'graduationYear', desc: 'Year of graduation' }
                                ].map(col => (
                                    <div key={col.name} className="flex items-start gap-2 text-sm">
                                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <span className="font-medium text-gray-900">{col.name}</span>
                                            <span className="text-gray-600"> - {col.desc}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* File Upload */}
                        <Card>
                            <h3 className="font-semibold text-gray-900 mb-4">
                                Upload Student File
                            </h3>

                            <FileUpload
                                accept=".csv,.xlsx"
                                maxSize={10 * 1024 * 1024} // 10MB
                                onFileSelect={handleFileSelect}
                                selectedFile={file}
                            />

                            <div className="mt-6 flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => navigate(`/college/drives/${id}`)}
                                    fullWidth
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleUploadPreview}
                                    disabled={!file || uploading}
                                    loading={uploading}
                                    leftIcon={Upload}
                                    fullWidth
                                >
                                    Preview Students
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                ) : (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Preview */}
                        <Card>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Student Data Preview
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={RefreshCw}
                                    onClick={handleReUpload}
                                >
                                    Upload Different File
                                </Button>
                            </div>

                            {previewData && (
                                <StudentPreviewTable
                                    students={previewData.preview}
                                    maxRows={100}
                                />
                            )}
                        </Card>

                        {/* Error Details */}
                        {previewData && previewData.invalidRows > 0 && (
                            <Card>
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-red-900 mb-2">
                                            {previewData.invalidRows} row{previewData.invalidRows !== 1 ? 's have' : ' has'} validation errors
                                        </h3>
                                        <p className="text-sm text-red-700 mb-4">
                                            You can either fix the errors and re-upload, or proceed to insert only the {previewData.validRows} valid rows.
                                        </p>

                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-gray-900">Common errors:</p>
                                            <ul className="text-sm text-gray-700 space-y-1 ml-4">
                                                {getUniqueErrors(previewData.preview).map((error, i) => (
                                                    <li key={i} className="list-disc">{error}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Actions */}
                        <Card>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleReUpload}
                                    fullWidth
                                    disabled={confirming}
                                >
                                    Re-upload File
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleConfirmInsert}
                                    disabled={!previewData || previewData.validRows === 0 || confirming}
                                    loading={confirming}
                                    leftIcon={CheckCircle}
                                    fullWidth
                                >
                                    Confirm & Insert {previewData?.validRows || 0} Students
                                </Button>
                            </div>

                            {previewData && previewData.invalidRows > 0 && (
                                <p className="text-sm text-gray-600 text-center mt-3">
                                    {previewData.invalidRows} invalid row{previewData.invalidRows !== 1 ? 's' : ''} will be skipped
                                </p>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Helper function to get unique error messages
const getUniqueErrors = (students) => {
    const errors = new Set();
    students.forEach(student => {
        if (!student.isValid) {
            student.errors.forEach(error => errors.add(error));
        }
    });
    return Array.from(errors).slice(0, 5); // Show top 5 unique errors
};

export default UploadStudents;
