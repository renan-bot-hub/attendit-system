import React, { useState } from 'react';
import { Search, Edit, UserX, UserCheck, Plus, X, Save } from 'lucide-react';

export default function UserManagement() {
  // User Data State
  const [users, setUsers] = useState([
    { id: 1, name: 'Maria Garcia', email: 'm.garcia@school.edu', role: 'Teacher', dept: 'Science', status: 'Active' },
    { id: 2, name: 'Juan Dela Cruz', email: 'j.delacruz@student.edu', role: 'Student', dept: 'Grade 10', status: 'Active' },
    { id: 3, name: 'Sarah Jenkins', email: 'sarah.j@school.edu', role: 'Teacher', dept: 'Mathematics', status: 'Active' },
    { id: 4, name: 'Miguel Santos', email: 'm.santos@student.edu', role: 'Student', dept: 'Grade 11', status: 'Inactive' },
    { id: 5, name: 'Elena Rostova', email: 'elena.r@school.edu', role: 'Teacher', dept: 'Literature', status: 'Active' },
  ]);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Handlers

  const handleEditClick = (user) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const handleToggleStatus = (id) => {
    setUsers(users.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' };
      }
      return u;
    }));
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleStyle = (role) => {
    return role === 'Teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 mt-2">Manage administrators, teachers, and students.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center transition-colors shadow-sm">
          <Plus className="w-5 h-5 mr-2" /> Add New User
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Toolbar (Search & Filter) */}
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
            <option value="Teacher">Teacher</option>
            <option value="Student">Student</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-white text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-4">Name / Email</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-3">Dept / Grade</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2 text-right pr-2">Actions</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-slate-100">
          {filteredUsers.map((user) => (
            <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-50 transition-colors">
              
              <div className="col-span-4">
                <h3 className="font-bold text-slate-900 text-sm">{user.name}</h3>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              
              <div className="col-span-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getRoleStyle(user.role)}`}>
                  {user.role}
                </span>
              </div>
              
              <div className="col-span-3 text-sm text-slate-600 font-medium">
                {user.dept}
              </div>
              
              <div className="col-span-1">
                <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {user.status}
                </span>
              </div>
              
              <div className="col-span-2 flex justify-end gap-3 text-sm font-bold">
                <button 
                  onClick={() => handleEditClick(user)}
                  className="text-blue-600 hover:text-blue-800 transition-colors flex items-center"
                >
                  <Edit className="w-4 h-4 mr-1" /> Edit
                </button>
                <button 
                  onClick={() => handleToggleStatus(user.id)}
                  className={`${user.status === 'Active' ? 'text-red-500 hover:text-red-700' : 'text-emerald-600 hover:text-emerald-800'} transition-colors flex items-center w-20 justify-end`}
                >
                  {user.status === 'Active' ? <><UserX className="w-4 h-4 mr-1" /> Disable</> : <><UserCheck className="w-4 h-4 mr-1" /> Enable</>}
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
      </div>

      {/* EDIT MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-black text-slate-900">Edit User</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
                  <select 
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Student">Student</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dept / Grade</label>
                  <input 
                    type="text" 
                    value={editingUser.dept}
                    onChange={(e) => setEditingUser({...editingUser, dept: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}