import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { employeeAPI } from '../api';
import { Users, Trash2, Calendar, Search, ChevronLeft, ChevronRight, Plus, UserPlus } from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';
import EmployeeForm from './EmployeeForm';

const EmployeeList = () => {
  const [employees, setEmployees]     = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError]             = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [searchTerm, setSearchTerm]   = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pagination, setPagination]   = useState({ total: 0, limit: 10, has_next: false, has_prev: false });
  const debounceRef   = useRef(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const isFirstLoad   = useRef(true);

  const fetchEmployees = async (page = 0, search = '') => {
    try {
      setError('');
      const skip = page * pagination.limit;
      const res  = await employeeAPI.getAll(skip, pagination.limit, search);
      // Backend wraps: { status: 'success', data: { employees, total, ... } }
      const payload = res.data.data ?? res.data;
      setEmployees(payload.employees ?? []);
      setPagination({
        total:    payload.total ?? payload.employees?.length ?? 0,
        limit:    payload.limit  ?? 10,
        has_next: payload.has_next ?? false,
        has_prev: payload.has_prev ?? false,
      });
    } catch {
      setError('Unable to load employees. Please try again.');
    } finally {
      if (isFirstLoad.current) {
        setInitialLoading(false);
        isFirstLoad.current = false;
      }
    }
  };

  useEffect(() => { fetchEmployees(currentPage, debouncedSearch); }, [currentPage, debouncedSearch]);
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleSearch = useCallback((e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(val); setCurrentPage(0); }, 300);
  }, []);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await employeeAPI.delete(deleteTarget.employee_id);
      setDeleteTarget(null);
      fetchEmployees(currentPage, debouncedSearch);
    } catch {
      setError('Failed to delete employee.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages  = Math.ceil(pagination.total / pagination.limit);
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (initialLoading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <span className="loading-text">Loading employees…</span>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Employee Management</h1>
          <p className="page-subtitle">
            {(pagination.total > 0 || employees.length > 0)
              ? `${pagination.total || employees.length} employee${(pagination.total || employees.length) !== 1 ? 's' : ''} registered`
              : 'No employees yet'}
          </p>
        </div>
        <div className="page-header-right">
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <UserPlus size={16} />
            Add Employee
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
        </div>
      )}

      {(pagination.total > 0 || debouncedSearch) && (
        <>
          <div className="search-row">
            <div className="search-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by name, ID, email, or department…"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>
          {debouncedSearch && (
            <p className="search-hint" style={{ marginBottom: 14 }}>
              Results for: <span>"{debouncedSearch}"</span> — {pagination.total} found
            </p>
          )}
        </>
      )}

      {employees.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><Users size={24} /></div>
            <h3 className="empty-title">
              {debouncedSearch ? 'No matches found' : 'No employees yet'}
            </h3>
            <p className="empty-desc">
              {debouncedSearch
                ? `No employees match "${debouncedSearch}". Try a different search.`
                : 'Add your first employee to get started.'}
            </p>
            {!debouncedSearch && (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                <Plus size={15} /> Add First Employee
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="employee-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                          {getInitials(emp.full_name)}
                        </div>
                        <span className="cell-primary">{emp.full_name}</span>
                      </div>
                    </td>
                    <td><span className="cell-mono">{emp.employee_id}</span></td>
                    <td style={{ color: 'var(--ink-3)', fontSize: 13 }}>{emp.email_address}</td>
                    <td><span className="dept-badge">{emp.department}</span></td>
                    <td>
                      <div className="action-group">
                        <Link
                          to={`/attendance/${emp.employee_id}`}
                          className="icon-btn icon-btn-blue"
                          title="View Attendance"
                        >
                          <Calendar size={15} />
                        </Link>
                        <button
                          className="icon-btn icon-btn-red"
                          onClick={() => setDeleteTarget(emp)}
                          title="Delete Employee"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination-row">
              <span className="pagination-info">
                {currentPage * pagination.limit + 1}–{Math.min((currentPage + 1) * pagination.limit, pagination.total)} of {pagination.total}
              </span>
              <div className="pagination-controls">
                <button className="page-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={!pagination.has_prev}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} className={`page-btn${i === currentPage ? ' active' : ''}`} onClick={() => setCurrentPage(i)}>
                    {i + 1}
                  </button>
                ))}
                <button className="page-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={!pagination.has_next}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <EmployeeForm
          onEmployeeAdded={() => { fetchEmployees(currentPage, debouncedSearch); setShowForm(false); }}
          onClose={() => setShowForm(false)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          employee={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
};

export default EmployeeList;