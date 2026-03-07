import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceAPI, employeeAPI } from '../api';
import { Calendar, Plus, Filter, X, CheckCircle, XCircle } from 'lucide-react';
import AttendanceForm from './AttendanceForm';

const AttendanceList = () => {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [empRes, attRes] = await Promise.all([
        employeeAPI.getById(employeeId),
        attendanceAPI.getByEmployee(employeeId, startDate || null, endDate || null)
      ]);
      // setEmployee(empRes.data);
      // setAttendances(attRes.data);
      setEmployee(empRes.data.data ?? empRes.data);
      setAttendances(attRes.data.data ?? attRes.data);
    } catch {
      setError('Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [employeeId, startDate, endDate]);

  const presentDays = attendances.filter(a => a.status === 'present').length;
  const absentDays  = attendances.filter(a => a.status === 'absent').length;
  const attendanceRate = attendances.length > 0
    ? Math.round((presentDays / attendances.length) * 100)
    : null;

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span className="loading-text">Loading attendance data…</span>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  if (!employee) {
    return <div className="alert alert-warning">Employee not found.</div>;
  }

  const filtersActive = startDate || endDate;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Attendance Records</h1>
          <p className="page-subtitle">Tracking daily attendance for {employee.full_name}</p>
        </div>
        <div className="page-header-right">
          <button
            className={`btn btn-outline btn-sm${showFilters ? ' active' : ''}`}
            onClick={() => setShowFilters(v => !v)}
            style={filtersActive ? { borderColor: 'var(--blue)', color: 'var(--blue)' } : {}}
          >
            <Filter size={14} />
            Filters
            {filtersActive && (
              <span style={{
                background: 'var(--blue)', color: '#fff',
                fontSize: 10, fontWeight: 700,
                padding: '1px 5px', borderRadius: 99, marginLeft: 2
              }}>ON</span>
            )}
          </button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} />
            Mark Attendance
          </button>
        </div>
      </div>

      {/* Employee Profile */}
      <div className="employee-profile-card">
        <div className="employee-avatar">{getInitials(employee.full_name)}</div>
        <div style={{ flex: 1 }}>
          <div className="employee-name">{employee.full_name}</div>
          <div className="employee-meta">
            <span><b>ID:</b> {employee.employee_id}</span>
            <span><b>Dept:</b> {employee.department}</span>
            <span style={{ display: 'inline-block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom' }}>{employee.email_address}</span>
          </div>
        </div>
        {attendanceRate !== null && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 700,
              color: attendanceRate >= 75 ? 'var(--green)' : attendanceRate >= 50 ? 'var(--accent-dk)' : 'var(--red)'
            }}>{attendanceRate}%</div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Attendance Rate</div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card blue">
          <div className="stat-label">Total Recorded</div>
          <div className="stat-value">{attendances.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Present Days</div>
          <div className="stat-value">{presentDays}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-label">Absent Days</div>
          <div className="stat-value">{absentDays}</div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>Filter by Date Range</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowFilters(false)}><X size={15} /></button>
          </div>
          <div className="filter-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">From Date</label>
              <input type="date" className="form-input" value={startDate}
                onChange={e => setStartDate(e.target.value)} max={endDate || undefined} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">To Date</label>
              <input type="date" className="form-input" value={endDate}
                onChange={e => setEndDate(e.target.value)} min={startDate || undefined} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => { setStartDate(''); setEndDate(''); }}>
                Clear Filters
              </button>
            </div>
          </div>
          {filtersActive && (
            <div className="filter-active-badge">
              <Filter size={12} />
              {startDate && `From ${startDate}`}{startDate && endDate && ' → '}{endDate && `To ${endDate}`}
            </div>
          )}
        </div>
      )}

      {/* Attendance Table or Empty */}
      {attendances.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><Calendar size={24} /></div>
            <h3 className="empty-title">
              {filtersActive ? 'No records in this range' : 'No attendance records'}
            </h3>
            <p className="empty-desc">
              {filtersActive
                ? 'Try adjusting your date filters.'
                : 'Start marking attendance for this employee.'}
            </p>
            {!filtersActive && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={15} /> Mark First Attendance
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {attendances.length} record{attendances.length !== 1 ? 's' : ''}
              {filtersActive ? ' (filtered)' : ''}
            </span>
            {filtersActive && (
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}
                onClick={() => { setStartDate(''); setEndDate(''); }}>
                <X size={12} /> Clear filters
              </button>
            )}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...attendances]
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map(att => {
                    const d = new Date(att.date + 'T00:00:00');
                    const dayName = d.toLocaleDateString('en-IN', { weekday: 'long' });
                    const dateStr = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                    const isPresent = att.status === 'present';
                    return (
                      <tr key={att.id}>
                        <td><span className="cell-primary">{dateStr}</span></td>
                        <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>{dayName}</td>
                        <td>
                          <span className={`chip ${isPresent ? 'chip-green' : 'chip-red'}`}>
                            {isPresent
                              ? <CheckCircle size={12} />
                              : <XCircle size={12} />}
                            {isPresent ? 'Present' : 'Absent'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <AttendanceForm
          employeeId={employeeId}
          existingDates={attendances.map(a => a.date)}
          onAttendanceAdded={fetchData}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};

export default AttendanceList;