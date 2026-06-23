import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Image as ImageIcon, Plus, Trash2, X, CheckCircle } from 'lucide-react';

const LandingPromotions = () => {
  const { branding, token, API_BASE_URL } = useAuth();
  const [promotions, setPromotions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '', subtitle: '', button_text: '', button_link: '/login'
  });

  const fetchPromotions = async () => {
    try {
      // NOTE: Gamitin natin yung get_promotions.php na ginawa natin kanina
      const res = await axios.get(`${API_BASE_URL}/public/get_promotions.php`);
      if (res.data.success) {
        setPromotions(res.data.promotions);
      }
    } catch (error) { console.error("Error fetching", error); }
  };

  useEffect(() => { fetchPromotions(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!imageFile) return alert("Please select an image!");
    setLoading(true);

    const data = new FormData();
    data.append('image_file', imageFile);
    data.append('title', formData.title);
    data.append('subtitle', formData.subtitle);
    data.append('button_text', formData.button_text);
    data.append('button_link', formData.button_link);

    try {
      const res = await axios.post(`${API_BASE_URL}/admin/add_promotion.php`, data, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setShowModal(false);
        setImageFile(null);
        setFormData({ title: '', subtitle: '', button_text: '', button_link: '/login' });
        fetchPromotions();
      } else { alert(res.data.message); }
    } catch (error) { alert("Upload failed."); }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this banner?")) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/admin/delete_promotion.php`, { id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) fetchPromotions();
    } catch (error) { alert("Delete failed."); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Landing Page Banners</h1>
          <p className="text-slate-500 font-medium">Manage images shown on the public landing page.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg" style={{backgroundColor: branding?.theme_color}}>
          <Plus size={20}/> Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-400 bg-white rounded-[2rem] border border-slate-100 border-dashed">
            <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
            <p className="font-bold">No banners added yet.</p>
            <p className="text-sm">Default "Your Future Starts Here" screen is currently displayed.</p>
          </div>
        ) : promotions.map(promo => (
          <div key={promo.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 group">
            <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
              <img src={`${API_BASE_URL}/uploads/promotions/${promo.image_file}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div className="p-6">
              <h3 className="font-black text-slate-800 text-lg leading-tight mb-1">{promo.title}</h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{promo.subtitle}</p>
              <button onClick={() => handleDelete(promo.id)} className="w-full py-2.5 rounded-xl border-2 border-red-100 text-red-500 font-bold text-sm hover:bg-red-50 flex items-center justify-center gap-2 transition-all">
                <Trash2 size={16} /> Remove Banner
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleSave} className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-slate-800">Upload New Banner</h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Banner Image *</label>
                <input required type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="w-full p-3 border border-slate-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Headline Title *</label>
                <input required type="text" value={formData.title} onChange={e=>setFormData({...formData, title: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="e.g. Enrollment is Open!" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">Subtitle Description</label>
                <textarea value={formData.subtitle} onChange={e=>setFormData({...formData, subtitle: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm" rows="2" placeholder="e.g. Join us for A.Y. 2026-2027"></textarea>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Button Text</label>
                  <input type="text" value={formData.button_text} onChange={e=>setFormData({...formData, button_text: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="e.g. Apply Now" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Button Link</label>
                  <input type="text" value={formData.button_link} onChange={e=>setFormData({...formData, button_link: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm" placeholder="e.g. /login" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500">Cancel</button>
              <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl font-black text-white bg-blue-600 shadow-lg flex items-center gap-2" style={{backgroundColor: branding?.theme_color}}>
                <CheckCircle size={18}/> {loading ? 'Uploading...' : 'Save Banner'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default LandingPromotions;