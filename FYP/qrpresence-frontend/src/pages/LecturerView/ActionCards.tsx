			  
			  
			  import { useNavigate } from 'react-router-dom';
export const ActionCards = () => {
  const navigate = useNavigate();
  

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-purple-800 mb-4">Generate Attendance QR</h2>
        <button
          onClick={() => navigate('/generate-qr')}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
        >
          📷 Generate QR
        </button>
      </div>
      
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-green-800">Session Management</h2>
        <button
          onClick={() => navigate('/create-session')}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
        >
          🔧 Create Session
        </button>
        <button
          onClick={() => navigate('/session-list')}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition-colors duration-200"
        >
          📋 View Sessions
        </button>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-indigo-800">Students Management</h2>
        <button
          onClick={() => navigate('/student-manager')}
          className="w-full bg-green-400 hover:bg-green-500 text-white py-3 rounded-lg font-medium transition-colors duration-200"
        >
          👥 Manage Students
        </button>
        <button
          onClick={() => navigate('#courses')}
          className="w-full bg-blue-400 hover:bg-blue-500 text-white py-3 rounded-lg font-medium transition-colors duration-200"
        >
          ➕ Enroll Students
        </button>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-indigo-800 mb-4">Course Management</h2>
        <button
          onClick={() => navigate('#courses')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
        >
          🎓 Manage Courses
        </button>
      </div>
    </div>
  );
};