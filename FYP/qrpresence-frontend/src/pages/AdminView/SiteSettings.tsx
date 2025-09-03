// src/components/admin/Settings/SiteSettings.tsx
import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Upload } from 'lucide-react';
import axios from 'axios';

interface SiteSettings {
  site_title: string;
  site_logo: string;
  academic_year: string;
  semester: string;
  attendance_threshold: number;
  qr_code_expiry: number;
}

const SiteSettings: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: 'QRPresence',
    site_logo: '',
    academic_year: '2023/2024',
    semester: '1',
    attendance_threshold: 75,
    qr_code_expiry: 15,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://127.0.0.1:8000/api/admin/settings/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSettings(response.data as SiteSettings);
    } catch (err) {
      console.error('Settings fetch error:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post('http://127.0.0.1:8000/api/admin/settings/', settings, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Failed to save settings');
      console.error('Settings save error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Implement logo upload logic here
      console.log('Uploading logo:', file);
    }
  };

  return (
    <div className="site-settings">
      <div className="site-settings__header">
        <h2>Site Settings</h2>
        <button 
          className={`admin-button admin-button--primary ${loading ? 'admin-button--loading' : ''}`}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? <RefreshCw size={16} className="spinner" /> : <Save size={16} />}
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {saved && (
        <div className="admin-message admin-message--success">
          Settings saved successfully!
        </div>
      )}

      <div className="site-settings__form">
        <div className="form-section">
          <h3>General Settings</h3>
          
          <div className="form-group">
            <label htmlFor="site_title">Site Title</label>
            <input
              type="text"
              id="site_title"
              name="site_title"
              value={settings.site_title}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="site_logo">Site Logo</label>
            <div className="logo-upload">
              <input
                type="file"
                id="site_logo"
                accept="image/*"
                onChange={handleLogoUpload}
                className="logo-upload__input"
              />
              <label htmlFor="site_logo" className="logo-upload__label">
                <Upload size={16} />
                Upload Logo
              </label>
              {settings.site_logo && (
                <div className="logo-preview">
                  <img src={settings.site_logo} alt="Site logo" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Academic Settings</h3>
          
          <div className="form-group">
            <label htmlFor="academic_year">Academic Year</label>
            <input
              type="text"
              id="academic_year"
              name="academic_year"
              value={settings.academic_year}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., 2023/2024"
            />
          </div>

          <div className="form-group">
            <label htmlFor="semester">Semester</label>
            <select
              id="semester"
              name="semester"
              value={settings.semester}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Summer Semester</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>Attendance Settings</h3>
          
          <div className="form-group">
            <label htmlFor="attendance_threshold">Attendance Threshold (%)</label>
            <input
              type="number"
              id="attendance_threshold"
              name="attendance_threshold"
              value={settings.attendance_threshold}
              onChange={handleInputChange}
              min="0"
              max="100"
              className="form-input"
            />
            <p className="form-help">Minimum attendance percentage required</p>
          </div>

          <div className="form-group">
            <label htmlFor="qr_code_expiry">QR Code Expiry (minutes)</label>
            <input
              type="number"
              id="qr_code_expiry"
              name="qr_code_expiry"
              value={settings.qr_code_expiry}
              onChange={handleInputChange}
              min="1"
              max="60"
              className="form-input"
            />
            <p className="form-help">How long QR codes remain valid</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteSettings;