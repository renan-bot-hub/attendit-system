import React, { useState } from 'react';

const initialMockUsers = [
  { id: 1001, name: "Maria Garcia", role: "Teacher", email: "m.garcia@school.edu", status: "Active", department: "Science" },
  { id: 1002, name: "Juan Dela Cruz", role: "Student", email: "j.delacruz@student.edu", status: "Active", department: "Grade 10" },
  { id: 1003, name: "Sarah Jenkins", role: "Teacher", email: "sarah.j@school.edu", status: "Active", department: "Mathematics" },
  { id: 1004, name: "Miguel Santos", role: "Student", email: "m.santos@student.edu", status: "Inactive", department: "Grade 11" },
  { id: 1005, name: "Elena Rostova", role: "Teacher", email: "elena.r@school.edu", status: "Active", department: "Literature" }
];

export default function UserManagement() {
  const [users, setUsers] = useState(initialMockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All Roles');

  // 🛑 MOCK FUNCTION: Filter the users based on search and dropdown
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All Roles' || user.role + 's' === roleFilter; 
    return matchesSearch && matchesRole;
  });

  // 🛑 MOCK FUNCTION: Delete/Disable a user
  const handleDisable = (id) => {
    if(window.confirm("Are you sure you want to disable this user?")) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  // 🛑 MOCK FUNCTION: Add a new user (UI only)
  const handleAddUser = () => {
    const newName = window.prompt("Enter new user's name:");
    if (newName) {
      const newUser = {
        id: Date.now(),
        name: newName,
        role: "Teacher",
        email: `${newName.split(' ')[0].toLowerCase()}@school.edu`,
        status: "Active",
        department: "General"
      };
      setUsers([...users, newUser]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 mt-1">Manage administrators, teachers, and students.</p>
        </div>
        <button 
          onClick={handleAddUser}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all"
        >
          + Add New User
        </button>
      </header>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex gap-4 shadow-sm">
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none font-medium text-slate-600"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option>All Roles</option>
          <option>Teachers</option>
          <option>Students</option>
        </select>
      </div>

      {/* User Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">Name / Email</th>
                <th className="p-4 font-bold border-b border-slate-200">Role</th>
                <th className="p-4 font-bold border-b border-slate-200">Dept / Grade</th>
                <th className="p-4 font-bold border-b border-slate-200">Status</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-slate-500">No users found.</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                      user.role === 'Teacher' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 font-medium">{user.department}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-blue-600 font-bold text-sm hover:underline mr-4">Edit</button>
                    <button onClick={() => handleDisable(user.id)} className="text-red-500 font-bold text-sm hover:underline">Disable</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}