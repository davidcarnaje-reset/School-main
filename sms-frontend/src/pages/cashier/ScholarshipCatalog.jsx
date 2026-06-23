import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Plus,
  Award,
  Trash2,
  X,
  Tag,
  FileText,
  Landmark,
  Pencil,
  Search,
  Banknote,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const ScholarshipCatalog = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [scholarships, setScholarships] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    discount_type: "Percentage",
    discount_value: 0,
    description: "",
  });

  const getLightVariant = (hexColor) =>
    hexColor ? `${hexColor}1F` : "#f8fafc";

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/cashier/manage_scholarships.php`,
      );
      setScholarships(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Fetch error");
    }
  };

  // FIX: Re-added the missing handleDelete function
  const handleDelete = async (id, name) => {
    if (window.confirm(`Sigurado ka bang gusto mong i-delete ang "${name}"?`)) {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/cashier/manage_scholarships.php`,
          {
            id: id,
            action: "delete",
          },
        );
        if (res.data.status === "success") fetchCatalog();
      } catch (err) {
        alert("Error deleting grant");
      }
    }
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name)
      return alert("Fill up required fields!");
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/cashier/manage_scholarships.php`,
        {
          ...formData,
          id: currentId,
          action: isEdit ? "edit" : "add",
        },
      );
      if (res.data.status === "success") {
        setShowAddModal(false);
        setIsEdit(false);
        fetchCatalog();
        setFormData({
          code: "",
          name: "",
          discount_type: "Percentage",
          discount_value: 0,
          description: "",
        });
      }
    } catch (err) {
      alert("Error saving data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 text-left max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-sm">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
            <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-lg">
              <Landmark size={28} />
            </div>
            Scholarship{" "}
            <span style={{ color: branding?.theme_color }}>Catalog</span>
          </h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2 ml-1">
            Manage institutional grants
          </p>
        </div>
        <button
          onClick={() => {
            setIsEdit(false);
            setFormData({
              code: "",
              name: "",
              discount_type: "Percentage",
              discount_value: 0,
              description: "",
            });
            setShowAddModal(true);
          }}
          style={{ backgroundColor: branding?.theme_color }}
          className="w-full md:w-auto text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={20} strokeWidth={3} /> Create Grant
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scholarships.map((s) => (
          <div
            key={s.id}
            className="group bg-white p-1 rounded-[2.5rem] border-2 border-slate-100 shadow-sm hover:border-blue-400 transition-all duration-300 relative overflow-hidden"
          >
            <div className="bg-slate-50 rounded-[2.3rem] p-8 h-full">
              <div className="flex justify-between items-start mb-6">
                <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest shadow-sm">
                  {s.code}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => {
                      setCurrentId(s.id);
                      setFormData(s);
                      setIsEdit(true);
                      setShowAddModal(true);
                    }}
                    className="p-2 bg-white text-slate-400 hover:text-blue-600 rounded-lg border border-slate-100 shadow-sm"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-lg border border-slate-100 shadow-sm"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 uppercase italic leading-tight mb-2 pr-4">
                {s.name}
              </h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mb-8 line-clamp-2 italic">
                {s.description || "Educational assistance grant."}[cite: 2]
              </p>
              <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-between shadow-inner">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Grant Value
                  </p>
                  <p
                    className="text-3xl font-black italic leading-none"
                    style={{ color: branding?.theme_color }}
                  >
                    {s.discount_type === "Percentage"
                      ? `${parseFloat(s.discount_value)}%`
                      : `₱${parseFloat(s.discount_value).toLocaleString()}`}
                  </p>
                </div>
                <div
                  className="p-3 rounded-2xl"
                  style={{
                    backgroundColor: getLightVariant(branding?.theme_color),
                  }}
                >
                  <Award size={24} style={{ color: branding?.theme_color }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          ></div>
          <div className="relative bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-10 shadow-2xl border-4 border-slate-50 no-scrollbar">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase italic leading-none">
                  {isEdit ? "Update" : "Create"} Grant
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Scholarship configuration[cite: 2]
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                    <Tag size={12} /> Grant Code
                  </label>
                  <input
                    className="w-full p-4 bg-slate-50 rounded-2xl font-black italic border-2 border-transparent focus:border-blue-500 outline-none uppercase"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">
                    Official Name
                  </label>
                  <input
                    className="w-full p-4 bg-slate-50 rounded-2xl font-black italic border-2 border-transparent focus:border-blue-500 outline-none"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 flex items-center gap-2">
                  <FileText size={12} /> Description
                </label>
                <textarea
                  className="w-full h-[155px] p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none resize-none"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="col-span-full grid grid-cols-2 gap-4 bg-slate-50 p-2 rounded-[2rem]">
                {["Percentage", "Fixed Amount"].map((type) => (
                  <button
                    key={type}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        discount_type: type,
                        discount_value: 0,
                      })
                    }
                    className={`py-4 rounded-[1.5rem] font-black uppercase text-[10px] transition-all ${formData.discount_type === type ? "bg-white shadow-md text-slate-900" : "text-slate-400 opacity-50"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* DYNAMIC INPUT FIELD BASED ON TYPE */}
              <div className="col-span-full bg-slate-900 p-8 rounded-[2.5rem] border-4 border-white/5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-4">
                  Set Discount Value
                </label>

                {formData.discount_type === "Percentage" ? (
                  <div className="flex items-center gap-6">
                    <div className="text-4xl font-black italic text-white w-24">
                      {formData.discount_value}%
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                      value={formData.discount_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount_value: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50 text-2xl font-black italic">
                      ₱
                    </div>
                    <input
                      type="number"
                      className="w-full bg-white/5 border-2 border-white/10 rounded-3xl p-6 pl-12 text-3xl font-black italic text-white outline-none focus:border-white/30 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="0.00"
                      value={formData.discount_value}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discount_value: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-10">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{ backgroundColor: branding?.theme_color }}
                className="flex-[2] text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-95 disabled:bg-slate-200"
              >
                {loading ? "Processing..." : "Confirm and Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipCatalog;
