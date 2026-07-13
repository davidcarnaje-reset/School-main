import React from 'react';
import { FolderOpen, FileText, Download } from 'lucide-react';

const HrDocuments = () => {
  const folders = [
    { name: "Mark Torres (Faculty)", files: "4 Documents (Resume, Contract, Transcript, ID Card)", size: "4.8 MB" },
    { name: "Clara Santos (Registrar)", files: "3 Documents (Resume, Contract, Clearance Sheet)", size: "3.2 MB" },
    { name: "Jobel Jobert (IT Support)", files: "2 Documents (Resume, IT Security Agreement)", size: "2.1 MB" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <FolderOpen className="text-blue-600" size={32} />
          Digital 201 Personnel Folders
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">Upload and manage employee contracts, medical certificates, and educational credentials.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <h3 className="text-lg font-black text-slate-800 tracking-tight mb-4 font-black">Active Archive Directories</h3>
        <div className="space-y-4">
          {folders.map((f, i) => (
            <div key={i} className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center border border-blue-100 shrink-0">
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
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-sm"
                >
                  <Download size={14} className="inline mr-1" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HrDocuments;
