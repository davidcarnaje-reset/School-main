import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { Library, Plus, RefreshCw, X, Check, Trash2, AlertCircle, Edit, Download, Upload, FileSpreadsheet } from 'lucide-react'; 
import { useAuth } from '../../context/AuthContext';

const AcademicPrograms = () => {
  const { branding, API_BASE_URL } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // --- BAGONG STATES PARA SA DELETE MODAL ---
  const [deleteModal, setDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);

  const [formData, setFormData] = useState({
    department: 'SHS',
    program_code: '',
    program_description: '',
    major: '',
    status: 'Active',
    curriculum_year: '2024-2025'
  });

  const [curriculumYearsList, setCurriculumYearsList] = useState([]);

  // --- EXCEL IMPORT/EXPORT STATES ---
  const fileInputRef = useRef(null);
  const [importModal, setImportModal] = useState(false);
  const [importedRows, setImportedRows] = useState([]);
  const [importLoading, setImportLoading] = useState(false);

  useEffect(() => {
    fetchPrograms();
    fetchCurriculumYears();
  }, []);

  const fetchCurriculumYears = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/curriculum-years`);
      if (res.data?.data) {
        setCurriculumYearsList(res.data.data.filter(c => c.status === 'Active'));
        if (res.data.data.length > 0) {
          const defaultYr = res.data.data.find(c => c.status === 'Active')?.curriculum_year || res.data.data[0].curriculum_year;
          setFormData(prev => ({ ...prev, curriculum_year: prev.curriculum_year || defaultYr }));
        }
      }
    } catch (err) {
      console.error("fetchCurriculumYears error:", err);
    }
  };

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/registrar/get_academic_programs.php`);
      if (Array.isArray(res.data)) {
        setPrograms(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      let res;
      if (editingProgram) {
        res = await axios.post(`${API_BASE_URL}/registrar/update_academic_program.php`, {
          id: editingProgram.id,
          ...formData
        });
      } else {
        res = await axios.post(`${API_BASE_URL}/registrar/add_academic_program.php`, formData);
      }

      if (res.data.success) {
        alert(editingProgram ? "Program updated successfully!" : "Program added successfully!");
        setShowModal(false);
        setEditingProgram(null);
        const defaultYr = curriculumYearsList[0]?.curriculum_year || '2024-2025';
        setFormData({ department: 'SHS', program_code: '', program_description: '', major: '', status: 'Active', curriculum_year: defaultYr });
        fetchPrograms();
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Server error.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditClick = (program) => {
    setEditingProgram(program);
    let cleanMajor = program.major || '';
    if (cleanMajor) {
      cleanMajor = cleanMajor.replace(/^major\s+in\s+/i, '').trim();
    }
    setFormData({
      department: program.department || 'SHS',
      program_code: program.program_code || '',
      program_description: program.program_description || '',
      major: cleanMajor,
      status: program.status || 'Active',
      curriculum_year: program.curriculum_year || (curriculumYearsList[0]?.curriculum_year || '2024-2025')
    });
    setShowModal(true);
  };

  // --- BINAGONG DELETE LOGIC (Bubukas lang ng UI Modal) ---
  const handleDeleteClick = (id, programCode) => {
    setProgramToDelete({ id, programCode });
    setDeleteModal(true);
  };

  // --- ITO YUNG TOTOONG MAGBUBURA SA DATABASE ---
  const confirmDelete = async () => {
    if (!programToDelete) return;
    
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/delete_academic_program.php`, { id: programToDelete.id });
      if (res.data.success) {
        fetchPrograms(); // I-refresh ang table after ma-delete
        setDeleteModal(false);
        setProgramToDelete(null);
      } else {
        alert("Error: " + res.data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Server error while deleting.");
    }
  };

  // --- EXCEL LOGIC ---
  const handleExportExcel = async () => {
    if (programs.length === 0) {
      alert("No academic programs available to export.");
      return;
    }

    const activeYears = curriculumYearsList.map(c => c.curriculum_year);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SMS Cloud';

    const ws = workbook.addWorksheet('Academic Programs Catalog', {
      views: [{ showGridLines: true }]
    });

    ws.columns = [
      { header: 'Department', key: 'department', width: 18 },
      { header: 'Program Code', key: 'program_code', width: 20 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'Major', key: 'major', width: 30 },
      { header: 'Curriculum Year', key: 'curriculum_year', width: 22 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    // Header styling
    const headerRow = ws.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Add ALL existing programs from database
    programs.forEach(p => {
      ws.addRow({
        department: p.department || 'College',
        program_code: p.program_code || '',
        description: p.program_description || '',
        major: p.major ? p.major.replace(/^major\s+in\s+/i, '') : '',
        curriculum_year: p.curriculum_year || '2024-2025',
        status: p.status || 'Active'
      });
    });

    // Formulate list strings for data validation
    const deptFormula = '"College,SHS"';
    const yearsFormula = activeYears.length > 0 ? `"${activeYears.join(',')}"` : '"2024-2025,2025-2026"';
    const statusFormula = '"Active,Inactive"';

    const maxRow = Math.max(programs.length + 50, 300);

    // Apply native Excel Data Validation Dropdowns to Rows
    for (let r = 2; r <= maxRow; r++) {
      ws.getCell(`A${r}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [deptFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Department',
        error: 'Please select College or SHS from the dropdown.'
      };

      ws.getCell(`E${r}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [yearsFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Curriculum Year',
        error: 'Please select a valid Curriculum Year from Admin Setup.'
      };

      ws.getCell(`F${r}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [statusFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Status',
        error: 'Please select Active or Inactive.'
      };
    }

    // Add Instructions & Allowed Values Sheet
    const guideWs = workbook.addWorksheet('Instructions & Allowed Values');
    guideWs.columns = [
      { header: 'Field Name', key: 'field', width: 22 },
      { header: 'Allowed Values / Format', key: 'allowed', width: 45 },
      { header: 'Required?', key: 'required', width: 15 }
    ];

    const gHeader = guideWs.getRow(1);
    gHeader.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    gHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    gHeader.height = 26;

    guideWs.addRow({ field: 'Department', allowed: 'College, SHS', required: 'Yes' });
    guideWs.addRow({ field: 'Program Code', allowed: 'e.g. BSIT, STEM, BSCS, BSED', required: 'Yes' });
    guideWs.addRow({ field: 'Description', allowed: 'Full program description', required: 'Yes' });
    guideWs.addRow({ field: 'Major', allowed: 'Optional (e.g. Application Development)', required: 'No' });
    guideWs.addRow({ field: 'Curriculum Year', allowed: activeYears.join(', ') || '2024-2025, 2025-2026', required: 'Yes' });
    guideWs.addRow({ field: 'Status', allowed: 'Active, Inactive', required: 'Yes' });

    // Download buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Academic_Programs_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = async () => {
    const activeYears = curriculumYearsList.map(c => c.curriculum_year);
    const sampleYear = activeYears[0] || '2025-2026';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SMS Cloud';

    const ws = workbook.addWorksheet('Academic Programs Template', {
      views: [{ showGridLines: true }]
    });

    ws.columns = [
      { header: 'Department', key: 'department', width: 18 },
      { header: 'Program Code', key: 'program_code', width: 20 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'Major', key: 'major', width: 30 },
      { header: 'Curriculum Year', key: 'curriculum_year', width: 22 },
      { header: 'Status', key: 'status', width: 15 }
    ];

    // Header styling
    const headerRow = ws.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Add 1 sample row
    ws.addRow({
      department: 'College',
      program_code: 'BSIT',
      description: 'Bachelor of Science in Information Technology',
      major: 'Application Development',
      curriculum_year: sampleYear,
      status: 'Active'
    });

    // Formulate list strings for data validation
    const deptFormula = '"College,SHS"';
    const yearsFormula = activeYears.length > 0 ? `"${activeYears.join(',')}"` : '"2024-2025,2025-2026"';
    const statusFormula = '"Active,Inactive"';

    // Apply native Excel Data Validation Dropdowns to Rows 2-300
    for (let r = 2; r <= 300; r++) {
      ws.getCell(`A${r}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [deptFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Department',
        error: 'Please select College or SHS from the dropdown.'
      };

      ws.getCell(`E${r}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [yearsFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Curriculum Year',
        error: 'Please select a valid Curriculum Year from Admin Setup.'
      };

      ws.getCell(`F${r}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [statusFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Status',
        error: 'Please select Active or Inactive.'
      };
    }

    // Add Instructions & Allowed Values Sheet
    const guideWs = workbook.addWorksheet('Instructions & Allowed Values');
    guideWs.columns = [
      { header: 'Field Name', key: 'field', width: 22 },
      { header: 'Allowed Values / Format', key: 'allowed', width: 45 },
      { header: 'Required?', key: 'required', width: 15 }
    ];

    const gHeader = guideWs.getRow(1);
    gHeader.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    gHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    gHeader.height = 26;

    guideWs.addRow({ field: 'Department', allowed: 'College, SHS', required: 'Yes' });
    guideWs.addRow({ field: 'Program Code', allowed: 'e.g. BSIT, STEM, BSCS, BSED', required: 'Yes' });
    guideWs.addRow({ field: 'Description', allowed: 'Full program description', required: 'Yes' });
    guideWs.addRow({ field: 'Major', allowed: 'Optional (e.g. Application Development)', required: 'No' });
    guideWs.addRow({ field: 'Curriculum Year', allowed: activeYears.join(', ') || '2024-2025, 2025-2026', required: 'Yes' });
    guideWs.addRow({ field: 'Status', allowed: 'Active, Inactive', required: 'Yes' });

    // Download buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Academic_Programs_Template.xlsx';
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validYears = curriculumYearsList.map(c => c.curriculum_year);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rawJson.length === 0) {
          alert("Uploaded Excel file is empty!");
          return;
        }

        const parsed = rawJson.map((row, idx) => {
          const rawDept = (row['Department'] || row['department'] || 'College').toString().trim();
          const cleanDept = rawDept.toUpperCase().includes('SHS') ? 'SHS' : 'College';
          const code = (row['Program Code'] || row['program_code'] || row['Code'] || '').toString().trim();
          const desc = (row['Description'] || row['program_description'] || '').toString().trim();
          const major = (row['Major'] || row['major'] || '').toString().trim();
          const currYear = (row['Curriculum Year'] || row['curriculum_year'] || validYears[0] || '2024-2025').toString().trim();
          const status = (row['Status'] || row['status'] || 'Active').toString().trim();

          let errorMsg = null;
          if (!code) errorMsg = "Missing Program Code";
          else if (!desc) errorMsg = "Missing Description";
          else if (validYears.length > 0 && !validYears.includes(currYear)) {
            errorMsg = `Curriculum Year '${currYear}' does not exist in Admin Setup`;
          }

          return {
            rowNum: idx + 2,
            department: cleanDept,
            program_code: code,
            program_description: desc,
            major: major,
            curriculum_year: currYear,
            status: status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
            error: errorMsg
          };
        });

        setImportedRows(parsed);
        setImportModal(true);
      } catch (err) {
        console.error("Excel parse error:", err);
        alert("Failed to read Excel file. Please ensure it is a valid .xlsx or .csv file.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleConfirmImport = async () => {
    if (importedRows.length === 0) return;
    setImportLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/bulk_import_academic_programs.php`, {
        programs: importedRows
      });

      if (res.data.success) {
        alert(res.data.message);
        setImportModal(false);
        setImportedRows([]);
        fetchPrograms();
      } else {
        alert("Import Error: " + res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to import programs.");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Library className="text-blue-500" size={32} /> Academic Programs
          </h1>
          <p className="text-slate-500 font-medium">Manage SHS Strands and College Courses.</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />

          <button 
            onClick={fetchPrograms} 
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 transition-all"
            title="Refresh List"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>

          <button 
            onClick={handleDownloadTemplate}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center gap-1.5 text-sm"
            title="Download Sample Template"
          >
            <FileSpreadsheet size={18} className="text-emerald-600"/> Template
          </button>

          <button 
            onClick={handleExportExcel}
            className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-xl transition-all flex items-center gap-1.5 text-sm"
            title="Export Programs to Excel"
          >
            <Download size={18}/> Export Excel
          </button>

          <button 
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 rounded-xl transition-all flex items-center gap-1.5 text-sm"
            title="Upload Excel File"
          >
            <Upload size={18}/> Import Excel
          </button>

          <button 
            onClick={() => {
              setEditingProgram(null);
              const defaultYr = curriculumYearsList[0]?.curriculum_year || '2024-2025';
              setFormData({ department: 'SHS', program_code: '', program_description: '', major: '', status: 'Active', curriculum_year: defaultYr });
              setShowModal(true);
            }}
            className="px-6 py-3 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 text-sm"
            style={{ backgroundColor: branding.theme_color || '#2563eb' }}
          >
            <Plus size={20} /> Add Program
          </button>
        </div>
      </div>

      {/* PROGRAMS TABLE */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-8">Dept. & Code</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description & Major</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
              <th className="p-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="4" className="p-10 text-center font-bold text-slate-400">Loading programs...</td></tr>
            ) : programs.length === 0 ? (
              <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold">No programs found.</td></tr>
            ) : (
              programs.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-5 pl-8">
                    <p className="font-bold text-slate-800 text-lg">{p.program_code}</p>
                    <div className="flex gap-2 items-center mt-1">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                        p.department === 'College' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                      }`}>
                        {p.department}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        Curriculum: {p.curriculum_year || '2024-2025'}
                      </span>
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="font-bold text-slate-600">{p.program_description}</p>
                    {p.major && (
                      <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                        Major in {p.major.replace(/^major\s+in\s+/i, '')}
                      </p>
                    )}
                  </td>
                  <td className="p-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      p.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button 
                        onClick={() => handleEditClick(p)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                        title="Edit Program"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(p.id, p.program_code)}
                        className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
                        title="Delete Program"
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

      {/* --- CUSTOM DELETE CONFIRMATION MODAL --- */}
      {deleteModal && programToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl flex flex-col animate-in zoom-in duration-200 overflow-hidden">
            <div className="p-6 text-center pt-8">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Delete Program?</h3>
              <p className="text-sm text-slate-500 font-medium">
                Are you sure you want to delete <span className="font-bold text-red-500">{programToDelete.programCode}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => { setDeleteModal(false); setProgramToDelete(null); }} 
                className="flex-1 py-3 font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-3 font-black text-white bg-red-500 hover:bg-red-600 shadow-md rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl flex flex-col animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase tracking-tight">
                {editingProgram ? 'Edit Academic Program' : 'Add New Program'}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>
            
            <div className="p-8 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Department</label>
                <select value={formData.department} onChange={e=>setFormData({...formData, department: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700">
                  <option value="SHS">Senior High School (SHS)</option>
                  <option value="College">College</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Program / Strand Code *</label>
                <input required type="text" placeholder="e.g. BSIT or STEM" value={formData.program_code} onChange={e=>setFormData({...formData, program_code: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700 uppercase" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Description *</label>
                <input required type="text" placeholder="e.g. Bachelor of Science in Information Technology" value={formData.program_description} onChange={e=>setFormData({...formData, program_description: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Curriculum Year *</label>
                <select value={formData.curriculum_year} onChange={e=>setFormData({...formData, curriculum_year: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700">
                  {curriculumYearsList.length === 0 ? (
                    <>
                      <option value="2023-2024">2023-2024</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                    </>
                  ) : (
                    curriculumYearsList.map(c => (
                      <option key={c.id || c.curriculum_year} value={c.curriculum_year}>
                        {c.curriculum_year} {c.description ? `(${c.description})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {formData.department === 'College' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Major (Optional)</label>
                  <input type="text" placeholder="e.g. Application Development" value={formData.major} onChange={e=>setFormData({...formData, major: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700" />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Status</label>
                <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-blue-500 text-sm font-bold text-slate-700">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2.5rem] flex gap-3">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
              <button type="submit" disabled={saveLoading} className="flex-1 py-3 font-black text-white rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700 transition-all flex justify-center items-center gap-2">
                {saveLoading ? <RefreshCw size={18} className="animate-spin"/> : <><Check size={18}/> {editingProgram ? 'Update Program' : 'Save Program'}</>}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* PREVIEW EXCEL IMPORT MODAL */}
      {importModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Preview Excel Import</h3>
                <p className="text-xs text-slate-500 font-medium">{importedRows.length} program(s) found in uploaded file.</p>
              </div>
              <button type="button" onClick={() => setImportModal(false)} className="p-2 text-slate-400 hover:text-red-500"><X size={20}/></button>
            </div>

            {importedRows.some(r => r.error) && (
              <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-xs font-bold">
                <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
                <div>
                  Warning: Some rows contain invalid Curriculum Years or missing required fields. Rows with errors will be skipped upon import.
                </div>
              </div>
            )}

            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="p-3 font-bold text-slate-600">Row</th>
                    <th className="p-3 font-bold text-slate-600">Dept.</th>
                    <th className="p-3 font-bold text-slate-600">Code</th>
                    <th className="p-3 font-bold text-slate-600">Description</th>
                    <th className="p-3 font-bold text-slate-600">Major</th>
                    <th className="p-3 font-bold text-slate-600">Curriculum</th>
                    <th className="p-3 font-bold text-slate-600">Status</th>
                    <th className="p-3 font-bold text-slate-600">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importedRows.map((row, idx) => (
                    <tr key={idx} className={row.error ? 'bg-red-50/70' : 'hover:bg-slate-50'}>
                      <td className="p-3 text-slate-400 font-mono">#{row.rowNum || idx + 2}</td>
                      <td className="p-3 font-semibold">{row.department}</td>
                      <td className="p-3 font-bold text-blue-600">{row.program_code}</td>
                      <td className="p-3 text-slate-700">{row.program_description}</td>
                      <td className="p-3 text-slate-500">{row.major || '-'}</td>
                      <td className="p-3 font-bold">{row.curriculum_year}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${row.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {row.error ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-[10px] font-bold flex items-center gap-1">
                            <AlertCircle size={12}/> {row.error}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold flex items-center gap-1 w-fit">
                            <Check size={12}/> Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2.5rem] flex gap-3 justify-between items-center">
              <span className="text-xs text-slate-400 font-bold">* Valid rows will be imported. Duplicates & invalid rows will be skipped automatically.</span>
              <div className="flex gap-3">
                <button type="button" onClick={() => setImportModal(false)} className="px-5 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
                <button 
                  onClick={handleConfirmImport} 
                  disabled={importLoading || importedRows.every(r => r.error)} 
                  className="px-6 py-3 font-black text-white rounded-xl shadow-lg bg-emerald-600 hover:bg-emerald-700 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importLoading ? <RefreshCw size={18} className="animate-spin"/> : <><Upload size={18}/> Save to System</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicPrograms;