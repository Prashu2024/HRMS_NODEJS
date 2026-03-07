import { useState } from 'react';
import { employeeAPI } from '../api';
import { User, Mail, Building, Hash, X } from 'lucide-react';

const EmployeeForm = ({ onEmployeeAdded, onClose }) => {
  const [formData, setFormData] = useState({
    employee_id: '', full_name: '', email_address: '', department: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear field error as user types
    if (fieldErrors[name]) setFieldErrors({ ...fieldErrors, [name]: '' });
  };

  const validate = () => {
    const errors = {};
    if (!formData.employee_id.trim())    errors.employee_id    = 'This field is required.';
    if (!formData.full_name.trim())      errors.full_name      = 'This field is required.';
    if (!formData.email_address.trim())  errors.email_address  = 'This field is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address))
                                         errors.email_address  = 'Enter a valid email address.';
    if (!formData.department.trim())     errors.department     = 'This field is required.';
    return errors;
  };

  // Parse FastAPI error detail — can be a string or an array of Pydantic error objects
  const parseApiError = (detail) => {
    if (!detail) return 'Failed to add employee. Please try again.';
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(e => e.msg || JSON.stringify(e)).join(', ');
    }
    return 'Failed to add employee. Please try again.';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      await employeeAPI.create(formData);
      onEmployeeAdded();
      onClose();
    } catch (err) {
      setError(parseApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {fieldErrors[name]}
      </p>
    ) : null;

  const inputStyle = (name) =>
    fieldErrors[name] ? { borderColor: 'var(--red)', background: 'var(--red-lt)' } : {};

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Add New Employee</h2>
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

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Employee ID</label>
              <div className="form-input-icon">
                <Hash size={15} className="input-icon" />
                <input
                  type="text" name="employee_id" value={formData.employee_id}
                  onChange={handleChange} className="form-input"
                  placeholder="e.g. EMP001" style={inputStyle('employee_id')}
                />
              </div>
              <FieldError name="employee_id" />
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="form-input-icon">
                <User size={15} className="input-icon" />
                <input
                  type="text" name="full_name" value={formData.full_name}
                  onChange={handleChange} className="form-input"
                  placeholder="e.g. Priya Sharma" style={inputStyle('full_name')}
                />
              </div>
              <FieldError name="full_name" />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="form-input-icon">
                <Mail size={15} className="input-icon" />
                <input
                  type="email" name="email_address" value={formData.email_address}
                  onChange={handleChange} className="form-input"
                  placeholder="e.g. priya@company.com" style={inputStyle('email_address')}
                />
              </div>
              <FieldError name="email_address" />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Department</label>
              <div className="form-input-icon">
                <Building size={15} className="input-icon" />
                <input
                  type="text" name="department" value={formData.department}
                  onChange={handleChange} className="form-input"
                  placeholder="e.g. Engineering" style={inputStyle('department')}
                />
              </div>
              <FieldError name="department" />
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding…' : 'Add'}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;