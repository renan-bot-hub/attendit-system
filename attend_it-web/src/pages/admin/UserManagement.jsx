import React, { useState, useEffect, useRef } from 'react';
import { Search, Edit, UserX, UserCheck, Plus, X, Save, Trash2, Upload, Download } from 'lucide-react';
import { userService } from '../../services/userService';

// CRUD page for users: search, filter, edit, toggle status, delete, bulk import
export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');

  // Edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Create modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', role: 'teacher',
    department: '', section: '', gradeLevel: '', studentId: '',
  });

  const [submitting, setSubmitting] = useState(false);

  // Bulk import
  const fileInputRef = useRef(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);

  // Load users from the backend into local state
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getAllUsers();
      setUsers(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  // Flash a success banner for a few seconds
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Parse a CSV string into an array of row-objects keyed by header name
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      // basic CSV split (no embedded commas in quoted fields — keep simple for schools)
      const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cells[i] || ''; });
      return obj;
    });
  };

  // Trigger the hidden CSV file input
  const handleCSVPick = () => fileInputRef.current?.click();

  // Read the picked CSV, send it to the bulk-create endpoint, show the result
  const handleCSVFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setError('');
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setError('CSV had no data rows.');
        return;
      }
      const payload = rows.map((r) => ({
        name: r.name || r.fullname || '',
        email: r.email,
        password: r.password || '',
        role: (r.role || 'student').toLowerCase(),
        studentId: r.studentid || r['student id'] || '',
        section: r.section || '',
        gradeLevel: r.gradelevel || r['grade level'] || r.grade || '',
        department: r.department || '',
      }));
      const res = await userService.bulkCreate(payload);
      setImportResult(res.data);
      showSuccess(`${res.data.created} users imported. ${res.data.skipped} skipped.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Bulk import failed.');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  // Download a sample CSV that shows the expected columns
  const downloadTemplate = () => {
    const csv = 'name,email,password,role,studentId,section,gradeLevel,department\n' +
                'Juan Dela Cruz,juan@school.edu,changeme123,student,2025-0001,Grade 10-A,Grade 10,\n' +
                'Maria Santos,maria@school.edu,changeme123,teacher,,,,Mathematics\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Open the edit modal pre-filled with this user
  const handleEditClick = (user) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  // Persist the edited user fields
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await userService.updateUser(editingUser._id, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        department: editingUser.department,
        section: editingUser.section,
        gradeLevel: editingUser.gradeLevel,
        studentId: editingUser.studentId,
      });
      setIsEditModalOpen(false);
      setEditingUser(null);
      showSuccess('User updated successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user.');
    } finally {
      setSubmitting(false);
    }
  };

  // Flip a user's active/inactive flag
  const handleToggleStatus = async (id) => {
    try {
      await userService.toggleUserStatus(id);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  // Permanently delete a user (with browser confirm)
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}"? This cannot be undone.`)) return;
    try {
      await userService.deleteUser(id);
      showSuccess('User deleted');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // Submit the create-user form
  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await userService.createUser(newUser);
      setIsCreateModalOpen(false);
      setNewUser({
        name: '', email: '', password: '', role: 'teacher',
        department: '', section: '', gradeLevel: '', studentId: '',
      });
      showSuccess('User created successfully');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      roleFilter === 'All Roles' || user.role?.toLowerCase() === roleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  // Color the role pill based on which role it is
  const getRoleStyle = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'teacher') return 'bg-purple-100 text-purple-700';
    if (r === 'admin')   return 'bg-amber-100 text-amber-700';
    return 'bg-blue-100 text-blue-700';
  };

  // Show section/grade for students, department for staff
  const getGroupLabel = (u) => {
    if (u.role === 'student') return u.section || u.gradeLevel || '—';
    return u.department || '—';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">

      <div className="mb-8 flex flex-wrap gap-3 justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 mt-2">Manage administrators, teachers, and students.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVFile} className="hidden" />
          <button
            onClick={downloadTemplate}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold flex items-center text-sm transition-colors"
          >
            <Download className="w-4 h-4 mr-2" /> CSV Template
          </button>
          <button
            onClick={handleCSVPick}
            disabled={importing}
            className="bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-bold flex items-center text-sm transition-colors"
          >
            <Upload className="w-4 h-4 mr-2" /> {importing ? 'Importing…' : 'Bulk Import'}
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5 mr-2" /> Add New User
          </button>
        </div>
      </div>

      {importResult && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="font-bold text-blue-900 mb-1">
            Import: {importResult.created} created, {importResult.skipped} skipped
          </p>
          {importResult.errors?.length > 0 && (
            <details className="text-xs text-blue-800 mt-1">
              <summary className="cursor-pointer font-bold">View skipped rows ({importResult.errors.length})</summary>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {importResult.errors.slice(0, 30).map((e, i) => (
                  <li key={i}>Row {e.row}: {e.message}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">{successMsg}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

        <div className="p-4 border-b border-slate-200 bg-slate-50 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-slate-200 rounded-lg px-4 py-2 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All Roles">All Roles</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading users...</div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-white text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">Name / Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Dept / Section</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-3 text-right pr-2">Actions</div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <div key={user._id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">

                  <div className="col-span-4">
                    <h3 className="font-bold text-slate-900 text-sm">{user.name}</h3>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>

                  <div className="col-span-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getRoleStyle(user.role)}`}>
                      {user.role}
                    </span>
                  </div>

                  <div className="col-span-2 text-sm text-slate-600 font-medium">
                    {getGroupLabel(user)}
                  </div>

                  <div className="col-span-1">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="col-span-3 flex justify-end gap-3 text-sm font-bold">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                    >
                      <Edit className="w-4 h-4 mr-1" /> Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user._id)}
                      className={`${user.isActive ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-800'} transition-colors flex items-center`}
                    >
                      {user.isActive ? <><UserX className="w-4 h-4 mr-1" /> Disable</> : <><UserCheck className="w-4 h-4 mr-1" /> Enable</>}
                    </button>
                    <button
                      onClick={() => handleDelete(user._id, user.name)}
                      className="text-red-600 hover:text-red-800 transition-colors flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </button>
                  </div>
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No users found matching your search.
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-900">Add New User</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <Field label="Full Name" required>
                <input type="text" required
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="um-input" />
              </Field>
              <Field label="Email" required>
                <input type="email" required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="um-input" />
              </Field>
              <Field label="Password (min 6)" required>
                <input type="password" required minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="um-input" />
              </Field>
              <Field label="Role">
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="um-input">
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>

              {newUser.role === 'student' ? (
                <>
                  <Field label="Student ID">
                    <input type="text"
                      value={newUser.studentId}
                      onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                      className="um-input" />
                  </Field>
                  <Field label="Section">
                    <input type="text"
                      value={newUser.section}
                      onChange={(e) => setNewUser({ ...newUser, section: e.target.value })}
                      className="um-input" />
                  </Field>
                  <Field label="Grade Level">
                    <input type="text"
                      value={newUser.gradeLevel}
                      onChange={(e) => setNewUser({ ...newUser, gradeLevel: e.target.value })}
                      className="um-input" />
                  </Field>
                </>
              ) : (
                <Field label="Department">
                  <input type="text"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="um-input" />
                </Field>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center shadow-sm">
                  <Save className="w-4 h-4 mr-2" /> {submitting ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-900">Edit User</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <Field label="Full Name" required>
                <input type="text" required
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="um-input" />
              </Field>
              <Field label="Email" required>
                <input type="email" required
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="um-input" />
              </Field>
              <Field label="Role">
                <select
                  value={editingUser.role || 'teacher'}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="um-input">
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>

              {editingUser.role === 'student' ? (
                <>
                  <Field label="Student ID">
                    <input type="text"
                      value={editingUser.studentId || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, studentId: e.target.value })}
                      className="um-input" />
                  </Field>
                  <Field label="Section">
                    <input type="text"
                      value={editingUser.section || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, section: e.target.value })}
                      className="um-input" />
                  </Field>
                  <Field label="Grade Level">
                    <input type="text"
                      value={editingUser.gradeLevel || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, gradeLevel: e.target.value })}
                      className="um-input" />
                  </Field>
                </>
              ) : (
                <Field label="Department">
                  <input type="text"
                    value={editingUser.department || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="um-input" />
                </Field>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center shadow-sm">
                  <Save className="w-4 h-4 mr-2" /> {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`.um-input{width:100%;border:1px solid #e2e8f0;border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;outline:none;background:#fff}.um-input:focus{box-shadow:0 0 0 2px rgba(59,130,246,.5);border-color:#3b82f6}`}</style>
    </div>
  );
}

// Labeled form-field wrapper
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
        {label}{required && <span className="text-red-500"> *</span>}
      </label>
      {children}
    </div>
  );
}
