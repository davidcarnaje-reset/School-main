import React, { useState, useEffect } from 'react';
import { FolderOpen, FileText, Download, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const HrDocuments = () => {
  const { API_BASE_URL, branding } = useAuth();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const themeColor = branding?.theme_color || '#2563eb';

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/cashier/payroll/employees`);
      if (res.data) {
        const list = res.data.map(emp => {
          const docList = [];
          if (emp.psa_file) docList.push("PSA Birth Cert");
          if (emp.coe_file) docList.push("COE Reference");
          if (emp.nbi_file) docList.push("NBI Clearance");
          if (emp.sss_doc_file) docList.push("SSS Card");
          if (emp.philhealth_doc_file) docList.push("PhilHealth MDRF");
          if (emp.pagibig_doc_file) docList.push("Pag-IBIG MDF");
          if (emp.tin_doc_file) docList.push("TIN ID");

          const filesStr = docList.length > 0 
            ? `${docList.length} Documents (${docList.join(", ")})` 
            : "No uploaded documents";

          return {
            name: `${emp.first_name} ${emp.last_name} (${emp.position})`,
            files: filesStr,
            size: docList.length > 0 ? `${(docList.length * 1.2).toFixed(1)} MB` : "0 KB",
            rawList: docList
          };
        });
        setFolders(list);
      }
    } catch (err) {
      console.error("Error loading personnel folders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <FolderOpen className="text-blue-600" size={32} style={{ color: themeColor }} />
          Digital 201 Personnel Folders
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Upload and manage employee contracts, medical certificates, and educational credentials.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Active Archive Directories</h3>
        
        {loading ? (
          <div className="py-12 flex justify-center items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Loader2 className="animate-spin text-blue-600" size={16} style={{ color: themeColor }} /> Loading folders...
          </div>
        ) : folders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs">
            No employee digital folders registered.
          </div>
        ) : (
          <div className="space-y-4">
            {folders.map((f, i) => (
              <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0" style={{ color: themeColor, backgroundColor: `${themeColor}10` }}>
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{f.name}</h4>
                    <p className="text-slate-400 text-xs font-semibold mt-1">{f.files}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left sm:text-right">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Total size</p>
                    <p className="text-xs font-bold text-slate-600 mt-0.5">{f.size}</p>
                  </div>
                  <button 
                    onClick={() => alert(`Downloading 201 folder files for ${f.name}...`)}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-55 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
                    disabled={f.rawList.length === 0}
                  >
                    <Download size={14} className="inline mr-1" /> Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default HrDocuments;
