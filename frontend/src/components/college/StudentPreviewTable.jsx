import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Tooltip from '../common/Tooltip';

/**
 * StudentPreviewTable Component
 * Displays student data preview with validation indicators
 * 
 * @param {Array} students - Array of student objects with validation
 * @param {number} maxRows - Maximum rows to display (default: 100)
 */
const StudentPreviewTable = ({ students = [], maxRows = 100 }) => {
    const displayStudents = students.slice(0, maxRows);
    const validCount = students.filter(s => s.isValid).length;
    const invalidCount = students.filter(s => !s.isValid).length;
    const validPercentage = students.length > 0
        ? Math.round((validCount / students.length) * 100)
        : 0;

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Total Rows</p>
                        <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Valid Rows</p>
                        <p className="text-2xl font-bold text-green-600">{validCount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Invalid Rows</p>
                        <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold text-gray-900">{validPercentage}%</p>
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${validPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Warning if invalid rows */}
            {invalidCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-red-900 mb-1">
                            {invalidCount} row{invalidCount !== 1 ? 's' : ''} {invalidCount !== 1 ? 'have' : 'has'} validation errors
                        </h4>
                        <p className="text-sm text-red-700">
                            Please fix the errors in your file and re-upload, or proceed to insert only the valid rows.
                        </p>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Phone
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Roll No
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Branch
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    CGPA
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                    Year
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {displayStudents.map((student, index) => (
                                <tr
                                    key={index}
                                    className={`${student.isValid
                                            ? 'hover:bg-gray-50'
                                            : 'bg-red-50 hover:bg-red-100'
                                        } transition-colors`}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {student.isValid ? (
                                            <Tooltip content="Valid row">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                            </Tooltip>
                                        ) : (
                                            <Tooltip content={
                                                <div className="space-y-1">
                                                    <p className="font-semibold mb-1">Validation Errors:</p>
                                                    {student.errors.map((error, i) => (
                                                        <p key={i} className="text-xs">• {error}</p>
                                                    ))}
                                                </div>
                                            }>
                                                <div className="flex items-center gap-1 cursor-help">
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                    <span className="text-xs text-red-600 font-medium">
                                                        {student.errors.length}
                                                    </span>
                                                </div>
                                            </Tooltip>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`text-sm ${student.isValid ? 'text-gray-900' : 'text-red-900 font-medium'}`}>
                                            {student.name || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`text-sm ${student.isValid ? 'text-gray-600' : 'text-red-700'}`}>
                                            {student.email || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`text-sm ${student.isValid ? 'text-gray-600' : 'text-red-700'}`}>
                                            {student.phone || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`text-sm ${student.isValid ? 'text-gray-600' : 'text-red-700'}`}>
                                            {student.rollNo || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`text-sm ${student.isValid ? 'text-gray-600' : 'text-red-700'}`}>
                                            {student.branch || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`text-sm font-medium ${student.isValid ? 'text-gray-900' : 'text-red-900'}`}>
                                            {student.cgpa !== null && student.cgpa !== undefined ? student.cgpa : '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`text-sm ${student.isValid ? 'text-gray-600' : 'text-red-700'}`}>
                                            {student.graduationYear || '-'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary Footer */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Showing <span className="font-medium">{Math.min(maxRows, students.length)}</span> of{' '}
                        <span className="font-medium">{students.length}</span> rows
                        {students.length > maxRows && (
                            <span className="text-gray-500 ml-1">
                                (first {maxRows} rows displayed)
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-green-600 font-medium">
                            <CheckCircle className="w-4 h-4" />
                            {validCount} valid
                        </span>
                        <span className="flex items-center gap-1 text-red-600 font-medium">
                            <XCircle className="w-4 h-4" />
                            {invalidCount} invalid
                        </span>
                    </div>
                </div>
            </div>

            {/* Scroll hint if many rows */}
            {displayStudents.length > 10 && (
                <p className="text-xs text-gray-500 text-center">
                    Scroll within the table to view all rows
                </p>
            )}
        </div>
    );
};

export default StudentPreviewTable;
