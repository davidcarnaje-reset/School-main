import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  UserPlus, Pencil, Trash2, X, Shield, Mail, RefreshCw, 
  Calendar, Phone, User, Search, Filter, GraduationCap, 
  Users, CheckCircle2, AlertCircle, Eye
} from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const { user: currentUser, branding, API_BASE_URL } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false); 
  
  // Filtering & Category States
  const [categoryTab, setCategoryTab] = useState('staff'); // 'staff', 'students', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [emailError, setEmailError] = useState('');

  // Form State
  const initialFormState = {
    username: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    birthday: '',
    phone_number: '',
    role: 'registrar'
  };

  const [formData, setFormData] = useState(initialFormState);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null, name: '', isStudent: false });

  // -------------------------------------------------------------
  // FETCH STAFF & STUDENTS
  // -------------------------------------------------------------
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Staff
      const staffRes = await axios.get(`${API_BASE_URL}/admin/users`);
      if (Array.isArray(staffRes.data)) {
        setUsers(staffRes.data);
      }

      // Fetch Students
      const stdRes = await axios.get(`${API_BASE_URL}/registrar/get_students_list.php`);
      if (Array.isArray(stdRes.data)) {
        setStudents(stdRes.data);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [API_BASE_URL]);

  // Real-time Email Check for Staff Invitation
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (formData.email && !isEditMode && showModal) { 
        try {
          const res = await axios.get(`${API_BASE_URL}/auth/check-email?email=${formData.email}`);
          if (res.data.exists) {
            setEmailError('This email is already registered to another account.');
          } else {
            setEmailError('');
          }
        } catch (err) { console.error(err); }
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.email, isEditMode, showModal, API_BASE_URL]);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const handleAddUser = async (e) => {
    if (e) e.preventDefault();
    if (emailError || saveLoading) return; 

    setSaveLoading(true); 
    try {
      let response;
      if (isEditMode) {
        response = await axios.put(`${API_BASE_URL}/admin/users/${selectedUserId}`, formData);
      } else {
        response = await axios.post(`${API_BASE_URL}/admin/users`, formData);
      }

      if (response.data && response.data.success) {
        setShowModal(false);
        setFormData(initialFormState);
        setEmailError('');
        await fetchData(); 
        
        setTimeout(() => {
          alert("Success: " + response.data.message);
        }, 100);
      } else {
        alert("Failed: " + (response.data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Critical Error:", error);
      alert(error.response?.data?.message || "Failed to save user.");
    } finally {
      setSaveLoading(false);
    }
  };

  const confirmDelete = (id, name, isStudent = false) => {
    setDeleteModal({ show: true, id, name, isStudent });
  };

  const executeDelete = async () => {
    try {
      const endpoint = deleteModal.isStudent 
        ? `${API_BASE_URL}/admin/users/${deleteModal.id}?is_student=true`
        : `${API_BASE_URL}/admin/users/${deleteModal.id}`;

      const response = await axios.delete(endpoint);
      if (response.data.success) {
        setDeleteModal({ show: false, id: null, name: '', isStudent: false });
        fetchData();
      }
    } catch (error) { 
      alert(error.response?.data?.message || "Error deleting user account."); 
    }
  };

  const openEditModal = (user) => {
    setIsEditMode(true);
    setSelectedUserId(user.id);
    setEmailError(''); 
    setFormData({
      first_name: user.first_name || '',
      middle_name: user.middle_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      username: user.username || '',
      birthday: user.birthday || '',
      phone_number: user.phone_number || '',
      role: user.role || 'registrar',
    });
    setShowModal(true);
  };

  // -------------------------------------------------------------
  // COMBINE AND FILTER RECORDS
  // -------------------------------------------------------------
  const formattedStaff = users.map(u => ({
    id: u.id,
    type: 'Staff',
    name: u.full_name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
    identifier: `@${u.username || 'user'}`,
    email: u.email,
    phone: u.phone_number,
    role: u.role,
    is_verified: u.is_verified == 1,
    originalData: u
  }));

  const formattedStudents = students.map(s => ({
    id: s.id,
    student_id: s.student_id,
    type: 'Student',
    name: `${s.first_name || ''} ${s.middle_name ? s.middle_name + ' ' : ''}${s.last_name || ''}`.trim(),
    identifier: `ID: ${s.student_id || 'N/A'}${s.lrn ? ` (LRN: ${s.lrn})` : ''}`,
    email: s.email,
    phone: s.mobile_no,
    role: 'Student',
    grade_level: s.grade_level,
    program_code: s.program_code,
    is_verified: s.is_verified == 1,
    originalData: s
  }));

  // Filter based on selected category tab
  let currentList = [];
  if (categoryTab === 'staff') currentList = formattedStaff;
  else if (categoryTab === 'students') currentList = formattedStudents;
  else currentList = [...formattedStaff, ...formattedStudents];

  // Search & Select Filters
  const filteredList = currentList.filter(item => {
    // 1. Search Query Filter
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = !query || 
      item.name.toLowerCase().includes(query) ||
      (item.email && item.email.toLowerCase().includes(query)) ||
      (item.identifier && item.identifier.toLowerCase().includes(query)) ||
      (item.phone && item.phone.toLowerCase().includes(query));

    // 2. Role Filter
    const matchesRole = roleFilter === 'ALL' || item.role.toLowerCase() === roleFilter.toLowerCase();

    // 3. Status Filter
    const matchesStatus = statusFilter === 'ALL' || 
      (statusFilter === 'VERIFIED' && item.is_verified) || 
      (statusFilter === 'PENDING' && !item.is_verified);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Account Management</h1>
          <p className="text-slate-500 text-xs font-medium mt-0.5">
            Manage system personnel accounts, staff invitations, and student user records.
          </p>
        </div>

        <button 
          onClick={() => { 
            setIsEditMode(false); 
            setFormData(initialFormState);
            setEmailError('');
            setShowModal(true); 
          }}
          className="shine-effect group text-white px-6 py-3.5 rounded-2xl flex items-center space-x-2 shadow-xl shadow-blue-200 transition-all duration-300 active:scale-95 border border-white/20 shrink-0 self-start md:self-auto"
          style={{ backgroundColor: branding.theme_color || '#2563eb' }}
        >
          <UserPlus size={18} className="group-hover:rotate-12 transition-transform" />
          <span className="font-bold text-xs tracking-tight">Invite Staff Member</span>
        </button>
      </div>

      {/* CATEGORY TABS & SUMMARY COUNTS */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => { setCategoryTab('staff'); setRoleFilter('ALL'); }}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              categoryTab === 'staff'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
            }`}
          >
            <Users size={16} />
            <span>Employees / Staff</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-current">
              {formattedStaff.length}
            </span>
          </button>

          <button
            onClick={() => { setCategoryTab('students'); setRoleFilter('ALL'); }}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              categoryTab === 'students'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
            }`}
          >
            <GraduationCap size={16} />
            <span>Students</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-current">
              {formattedStudents.length}
            </span>
          </button>

          <button
            onClick={() => { setCategoryTab('all'); setRoleFilter('ALL'); }}
            className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              categoryTab === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
            }`}
          >
            <span>All Accounts</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
              {formattedStaff.length + formattedStudents.length}
            </span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, username, or ID..."
            className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-xs font-bold text-slate-800 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <Filter size={14} className="text-slate-400 ml-1" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              {categoryTab !== 'students' && (
                <>
                  <option value="admin">Administrator</option>
                  <option value="registrar">Registrar</option>
                  <option value="cashier">Cashier</option>
                  <option value="it">IT Support</option>
                  <option value="hr">Human Resources (HR)</option>
                  <option value="school_admin">School Admin</option>
                  <option value="custodian">Custodian</option>
                  <option value="Teacher">Teacher</option>
                </>
              )}
              {categoryTab !== 'staff' && (
                <option value="Student">Student</option>
              )}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
            <Shield size={14} className="text-slate-400 ml-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="VERIFIED">Verified / Active</option>
              <option value="PENDING">Pending / Unverified</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => { setSearchTerm(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* USER TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4">Account Type</th>
                <th className="p-4">User / Name</th>
                <th className="p-4">Contact Info</th>
                <th className="p-4">Role / Level</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 italic">
                    <RefreshCw className="animate-spin inline-block mr-2" size={18} />
                    Loading accounts...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400 font-medium">
                    No matching user accounts found. Try adjusting your search or filters.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Account Type Badge */}
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.type === 'Student'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.type}
                      </span>
                    </td>

                    {/* Name & Avatar */}
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-sm"
                          style={{ backgroundColor: item.type === 'Student' ? '#4f46e5' : (branding.theme_color || '#2563eb') }}
                        >
                          {item.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{item.identifier}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact Info */}
                    <td className="p-4">
                      <p className="text-slate-700 text-xs font-semibold">{item.email || 'No email'}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{item.phone || 'No phone'}</p>
                    </td>

                    {/* Role / Grade Level */}
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                        item.role === 'admin' || item.role === 'Administrator' ? 'bg-purple-100 text-purple-700' :
                        item.role === 'registrar' ? 'bg-blue-100 text-blue-700' :
                        item.role === 'cashier' ? 'bg-emerald-100 text-emerald-700' :
                        item.role === 'Student' ? 'bg-indigo-100 text-indigo-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {item.role} {item.grade_level ? `(${item.grade_level})` : ''}
                      </span>
                      {item.program_code && (
                        <p className="text-[10px] font-bold text-slate-400 mt-1">{item.program_code}</p>
                      )}
                    </td>

                    {/* Verification Status */}
                    <td className="p-4">
                      {item.is_verified ? (
                        <span className="inline-flex items-center space-x-1 text-emerald-600 text-xs font-bold">
                          <CheckCircle2 size={14} />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-amber-500 text-xs font-bold">
                          <Mail size={14} />
                          <span>Pending</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {item.type === 'Staff' && (
                          <button 
                            onClick={() => openEditModal(item.originalData)} 
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Edit Staff"
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                        <button 
                          disabled={item.type === 'Staff' && item.id === currentUser?.id}
                          onClick={() => confirmDelete(item.id, item.name, item.type === 'Student')}
                          className={`p-2 rounded-xl transition-all ${
                            (item.type === 'Staff' && item.id === currentUser?.id)
                              ? 'opacity-0 cursor-default'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: INVITE / EDIT STAFF */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <UserPlus className="text-blue-500" />
                {isEditMode ? 'Update Staff Member' : 'Invite New Staff'}
              </h3>
              <button onClick={() => {setShowModal(false); setEmailError('');}} className="text-slate-400 hover:text-slate-600 bg-white shadow-sm p-2 rounded-full"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 md:p-8 space-y-5 overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">First Name</label>
                  <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                    value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} placeholder="Juan" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Middle Name</label>
                  <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                    value={formData.middle_name} onChange={(e) => setFormData({...formData, middle_name: e.target.value})} placeholder="Optional" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Last Name</label>
                  <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                    value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} placeholder="Dela Cruz" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Mail size={10} /> Email Address</label>
                  <input type="email" required className={`w-full p-3 border rounded-xl outline-none transition-all text-sm font-bold ${emailError ? 'border-red-400 bg-red-50' : 'bg-slate-50 border-slate-200 focus:border-blue-500'}`}
                    placeholder="juan@school.edu" value={formData.email} onChange={(e) => {setEmailError(''); setFormData({...formData, email: e.target.value});}} />
                  {emailError && <p className="text-[10px] text-red-500 font-bold ml-1 animate-in fade-in slide-in-from-top-1">⚠️ {emailError}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Phone size={10} /> Phone Number</label>
                  <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                    placeholder="09123456789" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><Calendar size={10} /> Birthday</label>
                  <input type="date" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm text-slate-600 font-bold"
                    value={formData.birthday} onChange={(e) => setFormData({...formData, birthday: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 flex items-center gap-1"><User size={10} /> Username</label>
                  <input type="text" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-bold"
                    value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="juandc" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Position / Role</label>
                  <select value={formData.role} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm font-bold text-slate-700"
                    onChange={(e) => setFormData({...formData, role: e.target.value})}>
                    <option value="registrar">Registrar</option>
                    <option value="cashier">Cashier</option>
                    <option value="it">IT Support</option>
                    <option value="hr">Human Resources (HR)</option>
                    <option value="school_admin">School Admin</option>
                    <option value="custodian">Custodian</option>
                    <option value="admin">Administrator</option>
                    <option value="Teacher">Teacher</option>
                  </select>
                </div>
              </div>

              {!isEditMode && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3 mt-4 shrink-0">
                  <Mail className="text-blue-500 mt-0.5 shrink-0" size={16} />
                  <div>
                    <p className="text-xs font-bold text-blue-800">Account Invitation</p>
                    <p className="text-[11px] text-blue-600 mt-0.5">Ang staff na ito ay makakatanggap ng email link upang i-verify ang kanilang account at gumawa ng sariling password.</p>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={saveLoading || emailError}
                className="shine-effect w-full py-4 rounded-xl text-white font-black shadow-xl mt-6 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 shrink-0"
                style={{ 
                  backgroundColor: branding.theme_color || '#2563eb',
                  opacity: (saveLoading || emailError) ? 0.7 : 1,
                  cursor: (saveLoading || emailError) ? 'not-allowed' : 'pointer'
                }}
              >
                {saveLoading ? (
                  <><RefreshCw className="animate-spin" size={18} /><span>Processing...</span></>
                ) : (
                  <span>{isEditMode ? 'Save Changes' : 'Send Invitation'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 text-center shadow-2xl">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><Trash2 size={40} /></div>
            <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Confirm Delete</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">Are you sure you want to remove <span className="font-bold text-slate-800">{deleteModal.name}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ show: false, id: null, name: '', isStudent: false })} className="flex-1 py-3.5 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={executeDelete} className="flex-1 py-3.5 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-lg shadow-red-200 transition-all">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;