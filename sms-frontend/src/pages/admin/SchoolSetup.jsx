import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  School, Palette, Upload, Image as ImageIcon, Save, RefreshCw, 
  Calendar, Building2, DoorOpen, Plus, Edit, Trash2, CheckCircle, 
  AlertCircle, Globe, Facebook, Phone, MapPin, Hash, Layers, 
  Tag, Info, Check, X, Sliders
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SchoolSetup = () => {
  const { API_BASE_URL, getLogoUrl } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'schoolyear', 'buildings', 'rooms'
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------------
  // TAB 1: PROFILE & PREFIXES STATES
  // -------------------------------------------------------------
  const [profile, setProfile] = useState({
    school_name: '',
    school_address: '',
    website_link: '',
    fb_page: '',
    contact_number: '',
    prefix_k12: 'K12-',
    prefix_college: 'COL-',
    theme_color: '#2563eb',
    school_logo: ''
  });
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // -------------------------------------------------------------
  // TAB 2: SCHOOL YEARS STATES
  // -------------------------------------------------------------
  const [schoolYears, setSchoolYears] = useState([]);
  const [showSyModal, setShowSyModal] = useState(false);
  const [editingSy, setEditingSy] = useState(null);
  const [syForm, setSyForm] = useState({
    school_year: '',
    start_date: '',
    end_date: '',
    status: 'Open',
    is_current: false
  });

  // -------------------------------------------------------------
  // TAB 3: BUILDINGS STATES
  // -------------------------------------------------------------
  const [buildings, setBuildings] = useState([]);
  const [showBldgModal, setShowBldgModal] = useState(false);
  const [editingBldg, setEditingBldg] = useState(null);
  const [bldgForm, setBldgForm] = useState({
    building_name: '',
    floors: 1,
    status: 'Active'
  });

  // -------------------------------------------------------------
  // TAB 4: ROOMS STATES
  // -------------------------------------------------------------
  const [rooms, setRooms] = useState([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    room_name: '',
    room_number: '',
    building_id: '',
    floor_number: 1,
    category: 'Lecture',
    room_type: 'Physical',
    capacity: 40,
    status: 'Active'
  });

  // Global Delete Modal State
  const [deleteModal, setDeleteModal] = useState({ show: false, type: '', id: null, title: '' });

  useEffect(() => {
    fetchProfile();
    fetchSchoolYears();
    fetchBuildings();
    fetchRooms();
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  // -------------------------------------------------------------
  // 1. FETCH & SAVE SCHOOL PROFILE
  // -------------------------------------------------------------
  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/school-profile`);
      if (res.data?.data) {
        setProfile({
          school_name: res.data.data.school_name || '',
          school_address: res.data.data.school_address || '',
          website_link: res.data.data.website_link || '',
          fb_page: res.data.data.fb_page || '',
          contact_number: res.data.data.contact_number || '',
          prefix_k12: res.data.data.prefix_k12 || 'K12-',
          prefix_college: res.data.data.prefix_college || 'COL-',
          theme_color: res.data.data.theme_color || '#2563eb',
          school_logo: res.data.data.school_logo || ''
        });
      }
    } catch (err) {
      console.error("fetchProfile error:", err);
    }
  };

  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.keys(profile).forEach(key => {
      if (key !== 'school_logo') {
        formData.append(key, profile[key]);
      }
    });

    if (selectedLogoFile) {
      formData.append('school_logo', selectedLogoFile);
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/admin/school-profile`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.status === 'success') {
        showToast("School Profile & Prefixes updated successfully!", "success");
        fetchProfile();
      } else {
        showToast(res.data?.message || "Failed to update profile.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating profile settings.", "error");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // 2. SCHOOL YEAR CRUD
  // -------------------------------------------------------------
  const fetchSchoolYears = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/school-years`);
      if (res.data?.data) {
        setSchoolYears(res.data.data);
      }
    } catch (err) {
      console.error("fetchSchoolYears error:", err);
    }
  };

  const handleSaveSy = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingSy) {
        res = await axios.put(`${API_BASE_URL}/admin/school-years/${editingSy.id}`, syForm);
      } else {
        res = await axios.post(`${API_BASE_URL}/admin/school-years`, syForm);
      }
      if (res.data?.status === 'success') {
        showToast(editingSy ? "School Year updated!" : "School Year created!", "success");
        fetchSchoolYears();
        setShowSyModal(false);
        setEditingSy(null);
        setSyForm({ school_year: '', start_date: '', end_date: '', status: 'Open', is_current: false });
      } else {
        showToast(res.data?.message || "Failed to save School Year.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving School Year.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSy = (sy) => {
    setEditingSy(sy);
    setSyForm({
      school_year: sy.school_year || '',
      start_date: sy.start_date || '',
      end_date: sy.end_date || '',
      status: sy.status || 'Open',
      is_current: !!sy.is_current
    });
    setShowSyModal(true);
  };

  // -------------------------------------------------------------
  // 3. BUILDINGS CRUD
  // -------------------------------------------------------------
  const fetchBuildings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/buildings`);
      if (res.data?.data) {
        setBuildings(res.data.data);
      }
    } catch (err) {
      console.error("fetchBuildings error:", err);
    }
  };

  const handleSaveBldg = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingBldg) {
        res = await axios.put(`${API_BASE_URL}/admin/buildings/${editingBldg.id}`, bldgForm);
      } else {
        res = await axios.post(`${API_BASE_URL}/admin/buildings`, bldgForm);
      }
      if (res.data?.status === 'success') {
        showToast(editingBldg ? "Building updated!" : "Building created!", "success");
        fetchBuildings();
        setShowBldgModal(false);
        setEditingBldg(null);
        setBldgForm({ building_name: '', floors: 1, status: 'Active' });
      } else {
        showToast(res.data?.message || "Failed to save building.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving building.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBldg = (bldg) => {
    setEditingBldg(bldg);
    setBldgForm({
      building_name: bldg.building_name || '',
      floors: bldg.floors || 1,
      status: bldg.status || 'Active'
    });
    setShowBldgModal(true);
  };

  // -------------------------------------------------------------
  // 4. ROOMS CRUD (UPGRADED)
  // -------------------------------------------------------------
  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/rooms`);
      const roomList = res.data?.data || res.data;
      if (Array.isArray(roomList)) {
        setRooms(roomList);
      }
    } catch (err) {
      console.error("fetchRooms error:", err);
    }
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (editingRoom) {
        res = await axios.put(`${API_BASE_URL}/admin/rooms/${editingRoom.id || editingRoom.room_id}`, roomForm);
      } else {
        res = await axios.post(`${API_BASE_URL}/admin/rooms`, roomForm);
      }
      if (res.data?.status === 'success') {
        showToast(editingRoom ? "Room updated!" : "Room created!", "success");
        fetchRooms();
        setShowRoomModal(false);
        setEditingRoom(null);
        setRoomForm({
          room_name: '', room_number: '', building_id: '', floor_number: 1,
          category: 'Lecture', room_type: 'Physical', capacity: 40, status: 'Active'
        });
      } else {
        showToast(res.data?.message || "Failed to save room.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving room.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      room_name: room.room_name || '',
      room_number: room.room_number || '',
      building_id: room.building_id || '',
      floor_number: room.floor_number || 1,
      category: room.category || 'Lecture',
      room_type: room.room_type || 'Physical',
      capacity: room.capacity || 40,
      status: room.status || 'Active'
    });
    setShowRoomModal(true);
  };

  // -------------------------------------------------------------
  // GLOBAL DELETE EXECUTION
  // -------------------------------------------------------------
  const executeDelete = async () => {
    try {
      const { type, id } = deleteModal;
      let endpoint = '';
      if (type === 'sy') endpoint = `/admin/school-years/${id}`;
      if (type === 'building') endpoint = `/admin/buildings/${id}`;
      if (type === 'room') endpoint = `/admin/rooms/${id}`;

      const res = await axios.delete(`${API_BASE_URL}${endpoint}`);
      if (res.data?.status === 'success') {
        showToast("Record deleted successfully.", "success");
        if (type === 'sy') fetchSchoolYears();
        if (type === 'building') fetchBuildings();
        if (type === 'room') fetchRooms();
      } else {
        showToast(res.data?.message || "Failed to delete record.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting record.", "error");
    } finally {
      setDeleteModal({ show: false, type: '', id: null, title: '' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-600/10 text-blue-600 rounded-2xl">
            <School size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admin School Setup</h1>
            <p className="text-slate-500 text-xs font-medium mt-0.5">
              Manage School Profile, Student Prefixes, Academic Years, Buildings, and Classrooms.
            </p>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {notification.show && (
        <div className={`p-4 rounded-2xl shadow-lg border flex items-center space-x-3 text-sm font-bold animate-in slide-in-from-top duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TAB NAVIGATION */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
          }`}
        >
          <School size={16} />
          <span>School Profile & Prefixes</span>
        </button>

        <button
          onClick={() => setActiveTab('schoolyear')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'schoolyear'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
          }`}
        >
          <Calendar size={16} />
          <span>School Year Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('buildings')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'buildings'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
          }`}
        >
          <Building2 size={16} />
          <span>Building Setup</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center space-x-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'rooms'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-200'
          }`}
        >
          <DoorOpen size={16} />
          <span>Room Management</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SCHOOL PROFILE & PREFIXES */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8 animate-in fade-in duration-300">
          <form onSubmit={handleSaveProfile} className="space-y-8">
            
            {/* LOGO UPLOAD & BRANDING COLOR */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-b border-slate-100 pb-8">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                    {logoPreview || profile.school_logo ? (
                      <img 
                        src={logoPreview || getLogoUrl(profile.school_logo)} 
                        alt="Logo" 
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <ImageIcon size={40} className="text-slate-300" />
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-xl cursor-pointer shadow-lg hover:bg-blue-700 transition-all">
                    <Upload size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoFileChange} />
                  </label>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">School Logo / Icon</p>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div>
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    <School size={14} />
                    <span>School Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.school_name}
                    onChange={(e) => setProfile({ ...profile, school_name: e.target.value })}
                    className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-slate-800 font-bold"
                    placeholder="Ex. St. Jude International School"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    <Palette size={14} />
                    <span>Primary Theme Color</span>
                  </label>
                  <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <input
                      type="color"
                      value={profile.theme_color}
                      onChange={(e) => setProfile({ ...profile, theme_color: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent"
                    />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{profile.theme_color}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SCHOOL ADDRESS & CONTACT INFO */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <MapPin size={16} className="text-blue-600" />
                <span>Contact Information & Address</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">School Address</label>
                  <input
                    type="text"
                    value={profile.school_address}
                    onChange={(e) => setProfile({ ...profile, school_address: e.target.value })}
                    className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-medium"
                    placeholder="Ex. 123 University Avenue, Manila, Philippines"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    <Globe size={14} />
                    <span>Website Link</span>
                  </label>
                  <input
                    type="text"
                    value={profile.website_link}
                    onChange={(e) => setProfile({ ...profile, website_link: e.target.value })}
                    className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-medium"
                    placeholder="https://myschool.edu.ph"
                  />
                </div>

                <div>
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    <Facebook size={14} />
                    <span>FB Page Link</span>
                  </label>
                  <input
                    type="text"
                    value={profile.fb_page}
                    onChange={(e) => setProfile({ ...profile, fb_page: e.target.value })}
                    className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-medium"
                    placeholder="https://facebook.com/myschool"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase mb-2">
                    <Phone size={14} />
                    <span>Contact Number</span>
                  </label>
                  <input
                    type="text"
                    value={profile.contact_number}
                    onChange={(e) => setProfile({ ...profile, contact_number: e.target.value })}
                    className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-medium"
                    placeholder="+63 912 345 6789 / (02) 8123-4567"
                  />
                </div>
              </div>
            </div>

            {/* PREFIXES NG STUDENTS */}
            <div className="pt-4 border-t border-slate-100">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                  <Tag size={16} className="text-blue-600" />
                  <span>Student ID Prefixes</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Add student ID prefixes as indicators for K to 12 vs. College students (e.g. <code className="bg-slate-100 px-1 rounded">K12-2026-0001</code> vs <code className="bg-slate-100 px-1 rounded">COL-2026-0001</code>).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                <div>
                  <label className="block text-xs font-bold text-blue-900 uppercase mb-2">K to 12 Student Prefix</label>
                  <input
                    type="text"
                    value={profile.prefix_k12}
                    onChange={(e) => setProfile({ ...profile, prefix_k12: e.target.value })}
                    className="w-full p-3.5 bg-white border border-blue-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-800 text-sm"
                    placeholder="Ex. K12- or HS-"
                  />
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">Applied to Kinder to Grade 12 students</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-blue-900 uppercase mb-2">College Student Prefix</label>
                  <input
                    type="text"
                    value={profile.prefix_college}
                    onChange={(e) => setProfile({ ...profile, prefix_college: e.target.value })}
                    className="w-full p-3.5 bg-white border border-blue-200 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-800 text-sm"
                    placeholder="Ex. COL- or HEI-"
                  />
                  <span className="text-[10px] text-slate-400 font-bold mt-1 block">Applied to Higher Education / College students</span>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                <span>Save School Profile & Settings</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SCHOOL YEAR SETUP */}
      {/* ========================================================================= */}
      {activeTab === 'schoolyear' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-800">School Academic Years</h2>
              <p className="text-xs text-slate-500">Configure academic year opening/closing dates and enrollment status.</p>
            </div>
            <button
              onClick={() => {
                setEditingSy(null);
                setSyForm({ school_year: '', start_date: '', end_date: '', status: 'Open', is_current: false });
                setShowSyModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md"
            >
              <Plus size={16} />
              <span>Add School Year</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-4">School Year</th>
                  <th className="p-4">Start Date (Open)</th>
                  <th className="p-4">End Date (Close)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Current Active</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {schoolYears.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">No school years configured yet.</td>
                  </tr>
                ) : (
                  schoolYears.map((sy) => (
                    <tr key={sy.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-800">{sy.school_year}</td>
                      <td className="p-4 text-slate-600">{sy.start_date || '---'}</td>
                      <td className="p-4 text-slate-600">{sy.end_date || '---'}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          sy.status === 'Open' || sy.status === 'Enrollment Open'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {sy.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {sy.is_current ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 space-x-1">
                            <Check size={12} />
                            <span>Active SY</span>
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">---</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditSy(sy)}
                          className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ show: true, type: 'sy', id: sy.id, title: sy.school_year })}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BUILDING SETUP */}
      {/* ========================================================================= */}
      {activeTab === 'buildings' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Building Management</h2>
              <p className="text-xs text-slate-500">Add buildings and configure number of available floors.</p>
            </div>
            <button
              onClick={() => {
                setEditingBldg(null);
                setBldgForm({ building_name: '', floors: 1, status: 'Active' });
                setShowBldgModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md"
            >
              <Plus size={16} />
              <span>Add Building</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {buildings.length === 0 ? (
              <div className="col-span-3 bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 font-medium">
                No buildings configured yet. Click "Add Building" above.
              </div>
            ) : (
              buildings.map((bldg) => (
                <div key={bldg.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                      <Building2 size={24} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      bldg.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {bldg.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800 tracking-tight">{bldg.building_name}</h3>
                    <p className="text-xs font-semibold text-slate-500 mt-1 flex items-center space-x-1">
                      <Layers size={14} className="text-slate-400" />
                      <span>{bldg.floors} {bldg.floors === 1 ? 'Floor' : 'Floors'}</span>
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                    <button
                      onClick={() => handleEditBldg(bldg)}
                      className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteModal({ show: true, type: 'building', id: bldg.id, title: bldg.building_name })}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ROOM MANAGEMENT (UPGRADED) */}
      {/* ========================================================================= */}
      {activeTab === 'rooms' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Room Management</h2>
              <p className="text-xs text-slate-500">Configure classrooms, laboratories, floor allocation, capacity, and status.</p>
            </div>
            <button
              onClick={() => {
                setEditingRoom(null);
                setRoomForm({
                  room_name: '', room_number: '', building_id: '', floor_number: 1,
                  category: 'Lecture', room_type: 'Physical', capacity: 40, status: 'Active'
                });
                setShowRoomModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center space-x-2 transition-all shadow-md"
            >
              <Plus size={16} />
              <span>Add Room</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-4">Room Name / No.</th>
                  <th className="p-4">Building</th>
                  <th className="p-4">Floor</th>
                  <th className="p-4">Category</th>
                  <th className="p-4 text-center">Capacity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {rooms.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 font-medium">No rooms configured yet.</td>
                  </tr>
                ) : (
                  rooms.map((room) => (
                    <tr key={room.id || room.room_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{room.room_name}</div>
                        {room.room_number && <div className="text-[10px] font-bold text-slate-400">Room #{room.room_number}</div>}
                      </td>
                      <td className="p-4 font-semibold text-slate-600">{room.building_name || '---'}</td>
                      <td className="p-4 font-semibold text-slate-600">Floor {room.floor_number || 1}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          room.category === 'Laboratory'
                            ? 'bg-purple-100 text-purple-700'
                            : room.category === 'AVR' || room.category === 'Gymnasium'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {room.category || 'Lecture'}
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700">{room.capacity} pax</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          room.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : room.status === 'Maintenance'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {room.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleEditRoom(room)}
                          className="p-2 text-slate-400 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteModal({ show: true, type: 'room', id: room.id || room.room_id, title: room.room_name })}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD/EDIT SCHOOL YEAR */}
      {/* ========================================================================= */}
      {showSyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingSy ? 'Edit School Year' : 'Add School Year'}</h3>
              <button onClick={() => setShowSyModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveSy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">School Year *</label>
                <input
                  type="text"
                  required
                  value={syForm.school_year}
                  onChange={(e) => setSyForm({ ...syForm, school_year: e.target.value })}
                  className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold"
                  placeholder="Ex. 2026-2027"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date (Open)</label>
                  <input
                    type="date"
                    value={syForm.start_date}
                    onChange={(e) => setSyForm({ ...syForm, start_date: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date (Close)</label>
                  <input
                    type="date"
                    value={syForm.end_date}
                    onChange={(e) => setSyForm({ ...syForm, end_date: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-2xl outline-none text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                <select
                  value={syForm.status}
                  onChange={(e) => setSyForm({ ...syForm, status: e.target.value })}
                  className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold"
                >
                  <option value="Open">Open</option>
                  <option value="Enrollment Open">Enrollment Open</option>
                  <option value="Closed">Closed</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="is_current"
                  checked={syForm.is_current}
                  onChange={(e) => setSyForm({ ...syForm, is_current: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="is_current" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Set as Current Active School Year
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowSyModal(false)} className="px-5 py-3 rounded-2xl font-bold text-slate-500 text-xs">Cancel</button>
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-md">
                  {loading ? 'Saving...' : 'Save School Year'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD/EDIT BUILDING */}
      {/* ========================================================================= */}
      {showBldgModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingBldg ? 'Edit Building' : 'Add Building'}</h3>
              <button onClick={() => setShowBldgModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveBldg} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Building Name *</label>
                <input
                  type="text"
                  required
                  value={bldgForm.building_name}
                  onChange={(e) => setBldgForm({ ...bldgForm, building_name: e.target.value })}
                  className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold"
                  placeholder="Ex. Main Academic Building"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Floors *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={bldgForm.floors}
                  onChange={(e) => setBldgForm({ ...bldgForm, floors: e.target.value })}
                  className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                <select
                  value={bldgForm.status}
                  onChange={(e) => setBldgForm({ ...bldgForm, status: e.target.value })}
                  className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowBldgModal(false)} className="px-5 py-3 rounded-2xl font-bold text-slate-500 text-xs">Cancel</button>
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-md">
                  {loading ? 'Saving...' : 'Save Building'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD/EDIT ROOM */}
      {/* ========================================================================= */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-800">{editingRoom ? 'Edit Room' : 'Add Room'}</h3>
              <button onClick={() => setShowRoomModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Room Name / Title *</label>
                  <input
                    type="text"
                    required
                    value={roomForm.room_name}
                    onChange={(e) => setRoomForm({ ...roomForm, room_name: e.target.value })}
                    className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold"
                    placeholder="Ex. Computer Lab 1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Room No.</label>
                  <input
                    type="text"
                    value={roomForm.room_number}
                    onChange={(e) => setRoomForm({ ...roomForm, room_number: e.target.value })}
                    className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold"
                    placeholder="Ex. 101"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Building</label>
                  <select
                    value={roomForm.building_id}
                    onChange={(e) => setRoomForm({ ...roomForm, building_id: e.target.value })}
                    className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold"
                  >
                    <option value="">-- Select Building --</option>
                    {buildings.map((b) => (
                      <option key={b.id} value={b.id}>{b.building_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Floor #</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={roomForm.floor_number}
                    onChange={(e) => setRoomForm({ ...roomForm, floor_number: e.target.value })}
                    className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category (Lab / Lecture) *</label>
                  <select
                    value={roomForm.category}
                    onChange={(e) => setRoomForm({ ...roomForm, category: e.target.value })}
                    className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold"
                  >
                    <option value="Lecture">Lecture</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="AVR">AVR</option>
                    <option value="Gymnasium">Gymnasium</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Capacity (Pax) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                    className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                <select
                  value={roomForm.status}
                  onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                  className="w-full p-3.5 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold"
                >
                  <option value="Active">Active</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowRoomModal(false)} className="px-5 py-3 rounded-2xl font-bold text-slate-500 text-xs">Cancel</button>
                <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-md">
                  {loading ? 'Saving...' : 'Save Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRMATION */}
      {/* ========================================================================= */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <strong className="text-slate-700">{deleteModal.title}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-3 pt-2">
              <button
                onClick={() => setDeleteModal({ show: false, type: '', id: null, title: '' })}
                className="px-5 py-2.5 rounded-2xl font-bold text-slate-500 text-xs bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-5 py-2.5 rounded-2xl font-bold text-white text-xs bg-red-600 hover:bg-red-700 shadow-md"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SchoolSetup;
