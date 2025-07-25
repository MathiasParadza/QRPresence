import React from 'react';
// Define AttendanceRecord type here if not available elsewhere
export interface AttendanceRecord {
  id: string | number;
  student?: {
    user?: {
      username?: string;
    };
    student_id?: string;
  };
  session?: {
    class_name?: string;
  };
  check_in_time?: string;
  check_out_time?: string;
  status: string;
}

interface AttendanceStatsProps {
  attendanceReport: AttendanceRecord[];
  loading: boolean;
  error?: string | null;
  searchTerm: string;
  statusFilter: string;
  currentPage: number;
  totalPages: number;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onExport: () => void;
}

const AttendanceStats: React.FC<AttendanceStatsProps> = ({
  attendanceReport,
  loading,
  error,
  searchTerm,
  statusFilter,
  currentPage,
  totalPages,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onExport,
}) => {
  const handlePrevious = () => onPageChange(Math.max(currentPage - 1, 1));
  const handleNext = () => onPageChange(Math.min(currentPage + 1, totalPages));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-50 rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search by student or session..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700">
              Status Filter
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            >
              <option value="">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Export
            </label>
            <button
              onClick={onExport}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
            >
              ⬇️ Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">Loading attendance records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-purple-100 border-b border-purple-200">
                <tr>
                  <th className="text-left px-6 py-4 font-semibold text-purple-800">Student</th>
                  <th className="text-left px-6 py-4 font-semibold text-purple-800">Student ID</th>
                  <th className="text-left px-6 py-4 font-semibold text-purple-800">Session</th>
                  <th className="text-left px-6 py-4 font-semibold text-purple-800">Check In</th>
                  <th className="text-left px-6 py-4 font-semibold text-purple-800">Check Out</th>
                  <th className="text-left px-6 py-4 font-semibold text-purple-800">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendanceReport.length > 0 ? (
                  attendanceReport.map((record) => (
                    <AttendanceRow key={`${record.id}-${record.check_in_time}`} record={record} />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No attendance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Previous
          </button>

          <span className="text-gray-600 font-medium">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

// Extracted row component for better readability
const AttendanceRow: React.FC<{ record: AttendanceRecord }> = ({ record }) => {
  const statusClass = {
    present: 'bg-green-100 text-green-800',
    absent: 'bg-red-100 text-red-800',
    late: 'bg-yellow-100 text-yellow-800',
    default: 'bg-gray-100 text-gray-800',
  };

  const getStatusClass = () => {
    const status = record.status.toLowerCase();
    if (status === 'present') return statusClass.present;
    if (status === 'absent') return statusClass.absent;
    if (status === 'late') return statusClass.late;
    return statusClass.default;
  };

  return (
    <tr className="even:bg-gray-50 odd:bg-white">
      <td className="px-6 py-4 text-gray-900">{record.student?.user?.username || 'N/A'}</td>
      <td className="px-6 py-4 text-gray-900">{record.student?.student_id || 'N/A'}</td>
      <td className="px-6 py-4 text-gray-900">{record.session?.class_name || 'N/A'}</td>
      <td className="px-6 py-4 text-gray-900">
        {record.check_in_time ? new Date(record.check_in_time).toLocaleString() : '-'}
      </td>
      <td className="px-6 py-4 text-gray-900">
        {record.check_out_time ? new Date(record.check_out_time).toLocaleString() : '-'}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getStatusClass()}`}>
          {record.status}
        </span>
      </td>
    </tr>
  );
};

export default AttendanceStats;