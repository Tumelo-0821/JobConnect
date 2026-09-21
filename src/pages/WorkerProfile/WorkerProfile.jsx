import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar/Navbar';
import { api } from '../../services/api';
import './WorkerProfile.css';

function WorkerProfile({ user, onLogout, authLoading }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    province: '',
    id_number: '',
    profile_photo_url: '',
    skills: '',
    bio: '',
  });

  const [saving, setSaving] = useState(false);
  const [uploadingCV, setUploadingCV] = useState(false);
  const [cvFileName, setCvFileName] = useState(user?.cv_file_name || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    setFormData({
      firstName: user.first_name || '',
      lastName: user.last_name || '',
      phone: user.phone || '',
      province: user.province || '',
      id_number: user.id_number || '',
      profile_photo_url: user.profile_photo_url || '',
      skills: user.skills?.join(', ') || '',
      bio: user.bio || '',
    });
  }, [user]);

  if (authLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  if (user.role !== 'worker') {
    navigate('/employer-dashboard');
    return null;
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    setMessage('');
    setError('');
  }

    async function handleCVUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    setMessage('');
    setError('');

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF, DOC, or DOCX file.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('CV file must not exceed 5 MB.');
      e.target.value = '';
      return;
    }

    setUploadingCV(true);

    try {
      const result = await api.uploadWorkerCV(file);

      setCvFileName(result.cv_file_name || file.name);
      setMessage('CV uploaded successfully.');
    } catch (err) {
      setError(err.message || 'Failed to upload CV.');
    } finally {
      setUploadingCV(false);
      e.target.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const updatedUser = await api.updateWorkerProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null,
        city: formData.province || null,
        id_number: formData.id_number || null,
        profile_photo_url: formData.profile_photo_url || null,
        skills: formData.skills
          .split(',')
          .map(skill => skill.trim())
          .filter(Boolean),
        bio: formData.bio || null,
      });

      setMessage('Profile updated successfully.');

      // Update the displayed user in App.jsx
      window.location.href = '/worker-dashboard';

    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  const provinces = [
    'Gauteng',
    'Western Cape',
    'KwaZulu-Natal',
    'Eastern Cape',
    'Limpopo',
    'Mpumalanga',
    'North West',
    'Free State',
    'Northern Cape',
  ];

  return (
    <div className="worker-profile-page">
      <Navbar user={user} onLogout={onLogout} />

      <div className="worker-profile-container">

        <div className="worker-profile-header">
          <div>
            <h1>Edit Your Profile</h1>
            <p>Keep your profile updated so employers can find you.</p>
          </div>

          <button
            type="button"
            className="profile-back-btn"
            onClick={() => navigate('/worker-dashboard')}
          >
            ← Back to Dashboard
          </button>
        </div>

        {message && (
          <div className="profile-success">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="profile-error">
            ⚠️ {error}
          </div>
        )}

        <form className="worker-profile-card" onSubmit={handleSubmit}>

          <div className="profile-photo-section">
            <div className="profile-photo-large">
              {user.name?.charAt(0)?.toUpperCase() || 'W'}
            </div>

            <div>
              <h3>{user.name}</h3>
              <p>Worker Profile</p>
            </div>
          </div>

          <div className="form-section">
            <h2>Personal Information</h2>

            <div className="form-row">

              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>

            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                value={user.email || ''}
                disabled
              />
              <small>Email address cannot be changed here.</small>
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                placeholder="071 000 0000"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Province</label>

              <select
                name="province"
                value={formData.province}
                onChange={handleChange}
              >
                <option value="">Select province</option>

                {provinces.map(province => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h2>Identity</h2>

            <div className="form-group">
              <label>South African ID Number</label>

              <input
                type="text"
                name="id_number"
                placeholder="13-digit ID number"
                maxLength="13"
                value={formData.id_number}
                onChange={handleChange}
              />

              <small>
                Your ID document upload will be added later when we build the
                verification system.
              </small>
            </div>
          </div>

          <div className="form-section">
            <h2>Professional Information</h2>

            <div className="form-group">
              <label>Skills</label>

              <input
                type="text"
                name="skills"
                placeholder="e.g. Plumbing, Electrical, Painting"
                value={formData.skills}
                onChange={handleChange}
              />

              <small>
                Separate multiple skills with commas.
              </small>
            </div>

            <div className="form-group">
              <label>About Me</label>

              <textarea
                name="bio"
                rows="5"
                placeholder="Tell employers about your experience..."
                value={formData.bio}
                onChange={handleChange}
              />
            </div>
          </div>

                     <div className="form-section">
            <h2>Curriculum Vitae (CV)</h2>

            <div className="form-group">
              <label htmlFor="cv-upload">
                Upload your CV
              </label>

              <input
                id="cv-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCVUpload}
                disabled={uploadingCV}
              />

              <small>
                Upload a PDF, DOC, or DOCX file. Maximum size: 5 MB.
              </small>
            </div>

            {cvFileName && (
              <div className="cv-file-display">
                <strong>Current CV:</strong>{' '}
                {cvFileName}
              </div>
            )}

            {uploadingCV && (
              <div className="cv-upload-status">
                Uploading CV...
              </div>
            )}
          </div>

          <div className="profile-actions">

            <button
              type="button"
              className="cancel-profile-btn"
              onClick={() => navigate('/worker-dashboard')}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="save-profile-btn"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}

export default WorkerProfile;
