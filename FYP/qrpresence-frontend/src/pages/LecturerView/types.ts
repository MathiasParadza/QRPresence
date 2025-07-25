

export interface AttendanceRecord {
  id: number;
  student?: {
    student_id?: string;
    user?: {
      username?: string;
    };
  };
  session?: {
    class_name?: string;
  };
  status: string;
  check_in_time: string;
  check_out_time: string | null;
}

export interface AttendanceStatsProps {
  /**
   * Array of attendance records to display
   */
  attendanceReport: AttendanceRecord[];
  
  /**
   * Loading state of the component
   */
  loading: boolean;
  
  /**
   * Error message to display (if any)
   */
  error?: string | null;
  
  /**
   * Current search term value
   */
  searchTerm: string;
  
  /**
   * Current status filter value
   */
  statusFilter: string;
  
  /**
   * Current page number
   */
  currentPage: number;
  
  /**
   * Total number of pages available
   */
  totalPages: number;
  
  /**
   * Callback when search term changes
   * @param value - New search term value
   */
  onSearchChange: (value: string) => void;
  
  /**
   * Callback when status filter changes
   * @param value - New status filter value
   */
  onStatusFilterChange: (value: string) => void;
  
  /**
   * Callback when page changes
   * @param page - New page number
   */
  onPageChange: (page: number) => void;
  
  /**
   * Callback when export button is clicked
   */
  onExport: () => void;
}

// Optional: If you want to type the status options
export const StatusFilterOptions = {
  ALL: '',
  PRESENT: 'Present',
  ABSENT: 'Absent',
  LATE: 'Late',
} as const;

export type StatusFilterOption = typeof StatusFilterOptions[keyof typeof StatusFilterOptions];