import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Download, 
  Trash2, 
  Eye,
  Clock,
  Calendar,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

type QRCode = {
  id: string;
  session?: {
    class_name: string;
    session_id: string;
    course?: {
      code: string;
    };
  };
  created_at?: string;
  expires_at?: string;
};

type Session = {
  id: string;
  class_name: string;
  session_id: string;
  course?: {
    code: string;
  };
};

const QRCodeManagement = () => {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    session: '',
    ordering: 'created_at'
  });

  const fetchQRCodes = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      
      if (filters.session) params.append('session', filters.session);
      if (filters.ordering) params.append('ordering', filters.ordering);

      const response = await axios.get<QRCode[]>(`http://localhost:8000/api/admin/qr-codes/?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setQrCodes(response.data);
    } catch (err) {
      setError('Failed to fetch QR codes');
      console.error('Error fetching QR codes:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchQRCodes();
    fetchSessions();
  }, [filters, fetchQRCodes]);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get<Session[]>('http://localhost:8000/api/admin/sessions/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSessions(response.data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    }
  };

interface FilterState {
    session: string;
    ordering: string;
}

const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
};

interface DeleteQRCodeParams {
    qrCodeId: string;
}

const handleDeleteQRCode = async ({ qrCodeId }: DeleteQRCodeParams): Promise<void> => {
    if (!window.confirm('Are you sure you want to delete this QR code?')) return;
    
    try {
        const token = localStorage.getItem('access_token');
        await axios.delete(`http://localhost:8000/api/admin/qr-codes/${qrCodeId}/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setQrCodes(qrCodes.filter((qrCode: QRCode) => qrCode.id !== qrCodeId));
    } catch (err) {
        setError('Failed to delete QR code');
        console.error('Error deleting QR code:', err);
    }
};


type RegenerateQRCodeResponse = QRCode;

const handleRegenerateQRCode = async (qrCodeId: string): Promise<void> => {
    try {
        const token = localStorage.getItem('access_token');
        const response = await axios.post<RegenerateQRCodeResponse>(
            `http://localhost:8000/api/admin/qr-codes/${qrCodeId}/regenerate/`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Update the QR code in the list
        setQrCodes(qrCodes.map((qrCode: QRCode) => 
            qrCode.id === qrCodeId ? response.data : qrCode
        ));
        
        alert('QR code regenerated successfully!');
    } catch (err) {
        setError('Failed to regenerate QR code');
        console.error('Error regenerating QR code:', err);
    }
};

interface IsQRCodeExpiredParams {
    expiresAt?: string;
}

const isQRCodeExpired = (expiresAt: IsQRCodeExpiredParams['expiresAt']): boolean => {
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
};

interface QRCodeStatusParams {
    expires_at?: string;
}

type QRCodeStatus = 'expired' | 'expiring-soon' | 'active';

const getQRCodeStatus = (qrCode: QRCodeStatusParams): QRCodeStatus => {
    if (isQRCodeExpired(qrCode.expires_at)) {
        return 'expired';
    }
    
    const now = new Date();
    const expiresAt = new Date(qrCode.expires_at as string);
    const timeUntilExpiry = expiresAt.getTime() - now.getTime();
    const minutesUntilExpiry = timeUntilExpiry / (1000 * 60);
    
    if (minutesUntilExpiry < 5) {
        return 'expiring-soon';
    }
    
    return 'active';
};

  if (loading) return <div className="admin-loading">Loading QR codes...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h2>QR Code Management</h2>
        <p>Manage all QR codes for attendance tracking</p>
      </div>

      {/* Filters */}
      <div className="admin-filters">
        <div className="admin-filters__group">
          <div className="admin-filter">
            <label htmlFor="sessionSelect">Session</label>
            <select 
              id="sessionSelect"
              value={filters.session} 
              onChange={(e) => handleFilterChange('session', e.target.value)}
            >
              <option value="">All Sessions</option>
              {sessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.class_name} ({session.session_id})
                </option>
              ))}
            </select>
          </div>

          <div className="admin-filter">
            <label htmlFor="sortBySelect">Sort By</label>
            <select 
              id="sortBySelect"
              value={filters.ordering} 
              onChange={(e) => handleFilterChange('ordering', e.target.value)}
            >
              <option value="created_at">Created Date</option>
              <option value="-created_at">Created Date (Desc)</option>
              <option value="expires_at">Expiry Date</option>
              <option value="-expires_at">Expiry Date (Desc)</option>
            </select>
          </div>
        </div>
      </div>

      {/* QR Codes Table */}
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>QR Code ID</th>
              <th>Session</th>
              <th>Course</th>
              <th>Created At</th>
              <th>Expires At</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {qrCodes.map((qrCode) => {
              const status = getQRCodeStatus(qrCode);
              
              return (
                <tr key={qrCode.id}>
                  <td>
                    <span className="qr-code-id">
                      {qrCode.id.slice(0, 8)}...
                    </span>
                  </td>
                  <td>
                    {qrCode.session && (
                      <span className="session-info">
                        {qrCode.session.class_name}
                        <br />
                        <small className="text-muted">
                          ID: {qrCode.session.session_id}
                        </small>
                      </span>
                    )}
                  </td>
                  <td>
                    {qrCode.session?.course && (
                      <span className="course-info">
                        {qrCode.session.course.code}
                      </span>
                    )}
                  </td>
                  <td>
                    {qrCode.created_at && (
                      <span className="created-date">
                        <Calendar size={14} />
                        {new Date(qrCode.created_at).toLocaleDateString()}
                        <br />
                        <small className="text-muted">
                          {new Date(qrCode.created_at).toLocaleTimeString()}
                        </small>
                      </span>
                    )}
                  </td>
                  <td>
                    {qrCode.expires_at && (
                      <span className={`expiry-date ${status}`}>
                        <Clock size={14} />
                        {new Date(qrCode.expires_at).toLocaleDateString()}
                        <br />
                        <small className="text-muted">
                          {new Date(qrCode.expires_at).toLocaleTimeString()}
                        </small>
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`qr-status qr-status--${status}`}>
                      {status === 'active' && 'Active'}
                      {status === 'expiring-soon' && 'Expiring Soon'}
                      {status === 'expired' && 'Expired'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-action-btn admin-action-btn--view" title="View QR Code">
                        <Eye size={16} />
                      </button>
                      <button 
                        className="admin-action-btn admin-action-btn--refresh" 
                        title="Regenerate QR Code"
                        onClick={() => handleRegenerateQRCode(qrCode.id)}
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button 
                        className="admin-action-btn admin-action-btn--delete" 
                        title="Delete"
                        onClick={() => handleDeleteQRCode({ qrCodeId: qrCode.id })}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {qrCodes.length === 0 && (
          <div className="admin-empty-state">
            <QrCode size={48} />
            <p>No QR codes found</p>
          </div>
        )}
      </div>

      <div className="admin-page__actions">
        <button className="admin-button admin-button--secondary">
          <Download size={20} />
          Export Data
        </button>
      </div>
    </div>
  );
};

export default QRCodeManagement;