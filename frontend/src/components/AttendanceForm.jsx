import { useState } from 'react';
import { attendanceAPI } from '../api';
import { Calendar, CheckCircle, XCircle, X } from 'lucide-react';

const AttendanceForm = ({ employeeId, existingDates = [], onAttendanceAdded, onClose }) => {
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({ date: today, status: 'present' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const isDuplicate = existingDates.includes(formData.date);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDuplicate) {
      setError('Attendance already marked for this date.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await attendanceAPI.create({ ...formData, employee_id: employeeId });
      onAttendanceAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to mark attendance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Mark Attendance</h2>
          <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: 18 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Date</label>
              <div className="form-input-icon">
                <Calendar size={15} className="input-icon" />
                <input
                  type="date" name="date" value={formData.date}
                  onChange={handleChange} className="form-input"
                  max={today}
                  style={isDuplicate ? { borderColor: 'var(--red)', background: 'var(--red-lt)' } : {}}
                  required
                />
              </div>
              {isDuplicate && (
                <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 5 }}>
                  Attendance already recorded for this date.
                </p>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Status</label>
              <div className="radio-cards">
                <label className="radio-card">
                  <input type="radio" name="status" value="present"
                    checked={formData.status === 'present'} onChange={handleChange} />
                  <CheckCircle size={18} color={formData.status === 'present' ? 'var(--blue)' : 'var(--green)'} />
                  <span className="radio-label">Present</span>
                </label>
                <label className="radio-card">
                  <input type="radio" name="status" value="absent"
                    checked={formData.status === 'absent'} onChange={handleChange} />
                  <XCircle size={18} color={formData.status === 'absent' ? 'var(--red)' : 'var(--ink-4)'} />
                  <span className="radio-label">Absent</span>
                </label>
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={loading || isDuplicate}
          >
            {loading ? 'Saving…' : 'Save Attendance'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceForm;