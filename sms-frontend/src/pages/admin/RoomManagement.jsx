import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DoorOpen, Users, Save, RefreshCw, Plus, MapPin, Edit, Trash2, X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; 

const RoomManagement = () => {
  const { API_BASE_URL } = useAuth(); 
  
  const initialFormState = { id: '', room_name: '', room_type: 'Physical', capacity: '', status: 'Active' };
  const [roomData, setRoomData] = useState(initialFormState);
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // ARCHITECT UPDATE: Custom States para sa UI Dialogues
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ show: false, roomId: null });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/get_rooms.php`);
      if (Array.isArray(res.data)) {
        setRooms(res.data);
      } else {
        setRooms([]);
      }
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setRooms([]);
    }
  };

  // Helper function para magpakita ng magandang Toast Notification
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    // Automatic na mawawala after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = isEditing ? 'update_room.php' : 'create_room.php';

    try {
      const res = await axios.post(`${API_BASE_URL}/admin/${endpoint}`, roomData);

      if (res.data.status === 'success') {
        showNotification(isEditing ? "Room updated successfully!" : "Room added successfully!", "success");
        fetchRooms(); 
        handleCancelEdit(); 
      } else {
        showNotification(res.data.message || "Failed to save room.", "error");
      }
    } catch (err) {
      showNotification("Error connecting to server.", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (room) => {
    setIsEditing(true);
    setRoomData({
      id: room.room_id,
      room_name: room.room_name,
      room_type: room.room_type,
      capacity: room.capacity,
      status: room.status
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setRoomData(initialFormState);
  };

  // ARCHITECT UPDATE: Imbes na window.confirm, bubuksan lang natin ang Modal
  const confirmDelete = (id) => {
    setDeleteModal({ show: true, roomId: id });
  };

  // Ito yung mismong magbubura kapag pinindot ang "Yes, Delete" sa modal
  const executeDelete = async () => {
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/delete_room.php`, { id: deleteModal.roomId });
      if (res.data.status === 'success') {
        showNotification("Room deleted successfully.", "success");
        fetchRooms();
      } else {
        showNotification(res.data.message, "error");
      }
    } catch (err) {
      showNotification("Error deleting room.", "error");
    } finally {
      // Isara ang modal pagkatapos
      setDeleteModal({ show: false, roomId: null });
    }
  };

  return (
    <div className="max-w-5xl space-y-6 animate-in fade-in duration-500 relative">
      
      {/* --- TOAST NOTIFICATION UI --- */}
      {notification.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl transition-all animate-in slide-in-from-top-5 ${notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {notification.type === 'success' ? <CheckCircle size={20} className="text-green-600" /> : <AlertCircle size={20} className="text-red-600" />}
          <span className="font-semibold text-sm">{notification.message}</span>
        </div>
      )}

      {/* --- CUSTOM DELETE MODAL UI --- */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Delete Room?</h3>
            </div>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Are you sure you want to delete this facility? This action cannot be undone and might affect class schedules assigned here.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteModal({ show: false, roomId: null })}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-red-200 text-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Room Management</h1>
        <p className="text-slate-500 text-sm">Create and manage physical facilities, classrooms, and laboratories.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* ADD/EDIT ROOM FORM */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 col-span-1 h-fit relative">
          {isEditing && (
            <button onClick={handleCancelEdit} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors">
              <X size={18} />
            </button>
          )}

          <h2 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
            {isEditing ? <Edit size={18} className="text-amber-500" /> : <Plus size={18} className="text-blue-500" />}
            {isEditing ? "Edit Room" : "Add New Room"}
          </h2>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                <MapPin size={14} /><span>Room Name</span>
              </label>
              <input 
                type="text" required
                value={roomData.room_name} 
                onChange={(e) => setRoomData({...roomData, room_name: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 text-sm"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                <DoorOpen size={14} /><span>Room Type</span>
              </label>
              <select 
                value={roomData.room_type} 
                onChange={(e) => setRoomData({...roomData, room_type: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 text-sm bg-white"
              >
                <option value="Physical">Physical</option>
                <option value="Laboratory">Laboratory</option>
                <option value="Virtual">Virtual</option>
              </select>
            </div>

            <div>
              <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                <Users size={14} /><span>Capacity (Max Students)</span>
              </label>
              <input 
                type="number" required
                value={roomData.capacity} 
                onChange={(e) => setRoomData({...roomData, capacity: e.target.value})}
                className="w-full p-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 text-sm"
              />
            </div>

            {isEditing && (
              <div>
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase mb-2 ml-1">
                  <span>Status</span>
                </label>
                <select 
                  value={roomData.status} 
                  onChange={(e) => setRoomData({...roomData, status: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-slate-700 text-sm bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            )}

            <button 
              type="submit" disabled={loading}
              className={`w-full text-white py-3 rounded-2xl font-bold flex items-center justify-center space-x-2 transition-all shadow-lg disabled:opacity-50 text-sm mt-4 
                ${isEditing ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-slate-900 hover:bg-black shadow-slate-200'}`}
            >
              {loading ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
              <span>{isEditing ? "Update Room" : "Save Room"}</span>
            </button>
          </form>
        </div>

        {/* ROOMS TABLE LIST */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 col-span-2 relative z-0">
          <h2 className="text-lg font-bold text-slate-700 mb-6">List of Rooms</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
                  <th className="p-3 font-bold">Room Name</th>
                  <th className="p-3 font-bold">Type</th>
                  <th className="p-3 font-bold">Capacity</th>
                  <th className="p-3 font-bold">Status</th>
                  <th className="p-3 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(rooms) && rooms.length > 0 ? (
                  rooms.map((room) => (
                    <tr key={room.room_id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors text-sm text-slate-600">
                      <td className="p-3 font-medium text-slate-800">{room.room_name}</td>
                      <td className="p-3">{room.room_type}</td>
                      <td className="p-3">{room.capacity} students</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded-lg ${room.status === 'Active' ? 'bg-green-100 text-green-700' : room.status === 'Maintenance' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {room.status}
                        </span>
                      </td>
                      <td className="p-3 flex justify-center space-x-2">
                        <button 
                          onClick={() => handleEdit(room)}
                          className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(room.room_id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-400 text-sm">
                      No rooms found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RoomManagement;