import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { 
  BookOpen, Plus, Search, Layers, FileText, 
  Trash2, X, CheckCircle, RefreshCw, GraduationCap, Filter, AlertTriangle, Download, Upload, FileSpreadsheet, AlertCircle, Check
} from 'lucide-react';
import SubjectDetailsModal from '../../components/registrar/SubjectDetailsModal';
import { useAuth } from '../../context/AuthContext';

const RegistrarSubjects = () => {
  const { branding, token, API_BASE_URL } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [curriculumFilter, setCurriculumFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);

  // 🛑 ARCHITECT ADDITION: State para sa Custom Delete Modal
  const [deleteModal, setDeleteModal] = useState({ show: false, subject: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // States para sa Subject Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectClasses, setSubjectClasses] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [curriculumYearsList, setCurriculumYearsList] = useState([]);

  // --- EXCEL IMPORT / EXPORT STATES ---
  const fileInputRef = useRef(null);
  const [importModal, setImportModal] = useState(false);
  const [importedRows, setImportedRows] = useState([]);
  const [importLoading, setImportLoading] = useState(false);

  const LEVEL_CONFIG = {
    'K-10': { levels: ['Kinder', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'], needsProgram: false },
    'SHS': { levels: ['Grade 11', 'Grade 12'], needsProgram: true },
    'College': { levels: ['1st Year', '2nd Year', '3rd Year', '4th Year'], needsProgram: true }
  };

  // ARCHITECT FIX: Idinagdag ang subject_type sa initial form para mapadala sa DB
  const initialForm = {
    level_category: 'K-10', subject_type: 'None', subject_code: '', subject_description: '',
    units: 0, grade_level_applicable: 'Grade 1', program_id: '', semester: 'N/A',
    curriculum_year: '2024-2025'
  };
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, currRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/registrar/get_subjects.php`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/registrar/curriculum-years`).catch(() => ({ data: { data: [] } }))
      ]);
      if (res.data.success) {
        setSubjects(res.data.subjects || []);
        setPrograms(res.data.programs || []);
      }
      if (currRes.data?.data) {
        setCurriculumYearsList(currRes.data.data.filter(c => c.status === 'Active'));
        if (currRes.data.data.length > 0) {
          const defaultYr = currRes.data.data.find(c => c.status === 'Active')?.curriculum_year || currRes.data.data[0].curriculum_year;
          setFormData(prev => ({ ...prev, curriculum_year: prev.curriculum_year || defaultYr }));
        }
      }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleLevelCategoryChange = (cat) => {
    const newUnits = (cat === 'College') ? 3 : 0;
    
    // ARCHITECT FIX: Dynamic na default subject_type base sa category
    let newSubjectType = 'None';
    if (cat === 'College') newSubjectType = 'GE';
    if (cat === 'SHS') newSubjectType = 'Core';

    setFormData({
      ...formData, 
      level_category: cat, 
      grade_level_applicable: LEVEL_CONFIG[cat].levels[0],
      program_id: '', 
      semester: cat === 'K-10' ? 'N/A' : '1st', 
      units: newUnits,
      subject_type: newSubjectType // Idinagdag ang subject_type dito
    });
  };

  const handleCurriculumYearChange = (newYear) => {
    setFormData(prev => {
      const filteredPrograms = programs.filter(p => 
        p.department === (prev.level_category === 'SHS' ? 'SHS' : 'College') &&
        (p.curriculum_year === newYear || (!p.curriculum_year && newYear === '2024-2025'))
      );
      const isValidProg = prev.program_id === 'GE' || filteredPrograms.some(p => p.id?.toString() === prev.program_id?.toString());
      return {
        ...prev,
        curriculum_year: newYear,
        program_id: isValidProg ? prev.program_id : ''
      };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/registrar/add_subject.php`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.data.success) {
        setShowModal(false); setFormData(initialForm); fetchData(); 
      } else { alert("Error: " + res.data.message); }
    } catch (error) { alert("Server Error"); }
    finally { setSaveLoading(false); }
  };

  // 🛑 ARCHITECT FIX: Bubuksan lang natin yung Custom Modal, hindi na window.confirm
  const handleDeleteClick = (e, subject) => {
      e.stopPropagation(); // Pigilan bumukas yung Details Modal
      setDeleteModal({ show: true, subject });
  };

  // 🛑 ARCHITECT FIX: Ito ang tatawag sa bagong PHP file natin
  const confirmDelete = async () => {
      setIsDeleting(true);
      try {
          const res = await axios.post(`${API_BASE_URL}/registrar/delete_subject.php`, 
              { subject_id: deleteModal.subject.id },
              { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
          );
          
          if(res.data.success) {
              setDeleteModal({ show: false, subject: null });
              fetchData(); // I-refresh ang table para mawala yung binura
          } else {
              alert("Error: " + res.data.message);
          }
      } catch (error) {
          console.error(error);
          alert("Server Error while deleting subject.");
      } finally {
          setIsDeleting(false);
      }
  };

  const handleRowClick = async (subject) => {
      setSelectedSubject(subject);
      setShowDetailsModal(true);
      setDetailsLoading(true);
      try {
          const res = await axios.get(`${API_BASE_URL}/registrar/get_subject_details.php`, {
              params: { subject_id: subject.id },
              headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.success) { setSubjectClasses(res.data.classes); }
      } catch (error) { console.error("Error fetching details", error); }
      finally { setDetailsLoading(false); }
  };

  const filteredSubjects = (subjects || []).filter(s => {
    const matchesSearch = `${s.subject_code} ${s.subject_description}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || s.level_category === categoryFilter;
    const matchesCurriculum = curriculumFilter === 'All' || s.curriculum_year === curriculumFilter;
    return matchesSearch && matchesCategory && matchesCurriculum;
  });

  // --- EXCEL LOGIC FOR SUBJECTS ---
  const handleExportExcel = async () => {
    if (filteredSubjects.length === 0) {
      alert("No subjects available to export.");
      return;
    }

    const activeYears = curriculumYearsList.map(c => c.curriculum_year);
    const progCodes = ['GE', ...new Set(programs.map(p => p.program_code))];
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SMS Cloud';

    const ws = workbook.addWorksheet('Subject Registry Masterlist', {
      views: [{ showGridLines: true }]
    });

    ws.columns = [
      { header: 'Subject Code', key: 'subject_code', width: 18 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'Academic Category', key: 'level_category', width: 20 },
      { header: 'Subject Type', key: 'subject_type', width: 16 },
      { header: 'Units', key: 'units', width: 12 },
      { header: 'Grade / Year Level', key: 'grade_level_applicable', width: 22 },
      { header: 'Program Code', key: 'program_code', width: 20 },
      { header: 'Semester', key: 'semester', width: 15 },
      { header: 'Curriculum Year', key: 'curriculum_year', width: 22 }
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

    // Add all filtered subjects
    filteredSubjects.forEach(s => {
      ws.addRow({
        subject_code: s.subject_code || '',
        description: s.subject_description || '',
        level_category: s.level_category || 'College',
        subject_type: s.subject_type || 'None',
        units: s.units || 0,
        grade_level_applicable: s.grade_level_applicable || '1st Year',
        program_code: s.program_code || 'GE',
        semester: s.semester || '1st',
        curriculum_year: s.curriculum_year || '2024-2025'
      });
    });

    const catFormula = '"College,SHS,K-10"';
    const typeFormula = '"GE,Major,Core,Applied,None"';
    const semFormula = '"1st,2nd,Summer,N/A"';
    const yearsFormula = activeYears.length > 0 ? `"${activeYears.join(',')}"` : '"2024-2025,2025-2026"';
    const progsFormula = progCodes.length > 0 ? `"${progCodes.join(',')}"` : '"GE,BSIT,BSCS,STEM"';

    const maxRow = Math.max(filteredSubjects.length + 50, 300);

    for (let r = 2; r <= maxRow; r++) {
      ws.getCell(`C${r}`).dataValidation = {
        type: 'list', allowBlank: false, formulae: [catFormula],
        showErrorMessage: true, errorTitle: 'Invalid Category', error: 'Select College, SHS, or K-10'
      };
      ws.getCell(`D${r}`).dataValidation = {
        type: 'list', allowBlank: false, formulae: [typeFormula],
        showErrorMessage: true, errorTitle: 'Invalid Subject Type', error: 'Select GE, Major, Core, Applied, or None'
      };
      ws.getCell(`G${r}`).dataValidation = {
        type: 'list', allowBlank: false, formulae: [progsFormula],
        showErrorMessage: true, errorTitle: 'Invalid Program Code', error: 'Select a valid Program Code or GE'
      };
      ws.getCell(`H${r}`).dataValidation = {
        type: 'list', allowBlank: false, formulae: [semFormula],
        showErrorMessage: true, errorTitle: 'Invalid Semester', error: 'Select 1st, 2nd, Summer, or N/A'
      };
      ws.getCell(`I${r}`).dataValidation = {
        type: 'list', allowBlank: false, formulae: [yearsFormula],
        showErrorMessage: true, errorTitle: 'Invalid Curriculum Year', error: 'Select an existing Curriculum Year'
      };
    }

    // Guide sheet
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

    guideWs.addRow({ field: 'Subject Code', allowed: 'e.g. CC 101, MATH101, GENMATH', required: 'Yes' });
    guideWs.addRow({ field: 'Description', allowed: 'Full subject title', required: 'Yes' });
    guideWs.addRow({ field: 'Academic Category', allowed: 'College, SHS, K-10', required: 'Yes' });
    guideWs.addRow({ field: 'Subject Type', allowed: 'GE, Major, Core, Applied, None', required: 'Yes' });
    guideWs.addRow({ field: 'Units', allowed: 'Number (e.g. 3 for College, 0 for SHS/K-10)', required: 'Yes' });
    guideWs.addRow({ field: 'Grade / Year Level', allowed: '1st Year, 2nd Year, Grade 11, Grade 1, etc.', required: 'Yes' });
    guideWs.addRow({ field: 'Program Code', allowed: progCodes.join(', ') || 'GE, BSIT, BSCS, STEM', required: 'Yes (or GE)' });
    guideWs.addRow({ field: 'Semester', allowed: '1st, 2nd, Summer, N/A', required: 'Yes' });
    guideWs.addRow({ field: 'Curriculum Year', allowed: activeYears.join(', ') || '2024-2025, 2025-2026', required: 'Yes' });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Subject_Registry_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = async () => {
    const activeYears = curriculumYearsList.map(c => c.curriculum_year);
    const sampleYear = activeYears[0] || '2025-2026';
    const progCodes = ['GE', ...new Set(programs.map(p => p.program_code))];
    const sampleProg = progCodes[1] || 'GE';

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SMS Cloud';

    const ws = workbook.addWorksheet('Subject Registry Template', {
      views: [{ showGridLines: true }]
    });

    ws.columns = [
      { header: 'Subject Code', key: 'subject_code', width: 18 },
      { header: 'Description', key: 'description', width: 45 },
      { header: 'Academic Category', key: 'level_category', width: 20 },
      { header: 'Subject Type', key: 'subject_type', width: 16 },
      { header: 'Units', key: 'units', width: 12 },
      { header: 'Grade / Year Level', key: 'grade_level_applicable', width: 22 },
      { header: 'Program Code', key: 'program_code', width: 20 },
      { header: 'Semester', key: 'semester', width: 15 },
      { header: 'Curriculum Year', key: 'curriculum_year', width: 22 }
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // 1 Sample Row
    ws.addRow({
      subject_code: 'CC 101',
      description: 'Basic Programming',
      level_category: 'College',
      subject_type: 'Major',
      units: 3,
      grade_level_applicable: '1st Year',
      program_code: sampleProg,
      semester: '1st',
      curriculum_year: sampleYear
    });

    const catFormula = '"College,SHS,K-10"';
    const typeFormula = '"GE,Major,Core,Applied,None"';
    const semFormula = '"1st,2nd,Summer,N/A"';
    const yearsFormula = activeYears.length > 0 ? `"${activeYears.join(',')}"` : '"2024-2025,2025-2026"';
    const progsFormula = progCodes.length > 0 ? `"${progCodes.join(',')}"` : '"GE,BSIT,BSCS,STEM"';

    for (let r = 2; r <= 300; r++) {
      ws.getCell(`C${r}`).dataValidation = {
        type: 'list', allowBlank: false, formulae: [catFormula],
        showErrorMessage: true, errorTitle: 'Invalid Category', error: 'Select College, SHS, or K-10'
      };
      ws.getCell(`D${r}`).dataValidation = {
        type: 'list', allowBlank: false, formulae: [typeFormula],
        showErrorMessage: true, errorTitle: 'Invalid Subject Type', error: 'Select GE, Major, Core, Applied, or None'
      };
      ws.getCell(`G${r}`).dataValidation = {
        type: 'list', allowBlank: false, formulae: [progsFormula],
        showErrorMessage: true, errorTitle: 'Invalid Program Code', error: 'Select a valid Program Code or GE'
      };
      ws.getCell(`H${r}`).dataValidation = {
        type: 'list', allowBlank: false, formulae: [semFormula],
        showErrorMessage: true, errorTitle: 'Invalid Semester', error: 'Select 1st, 2nd, Summer, or N/A'
      };
      ws.getCell(`I${r}`).dataValidation = {
        type: 'list', allowBlank: false, formulae: [yearsFormula],
        showErrorMessage: true, errorTitle: 'Invalid Curriculum Year', error: 'Select an existing Curriculum Year'
      };
    }

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

    guideWs.addRow({ field: 'Subject Code', allowed: 'e.g. CC 101, MATH101, GENMATH', required: 'Yes' });
    guideWs.addRow({ field: 'Description', allowed: 'Full subject title', required: 'Yes' });
    guideWs.addRow({ field: 'Academic Category', allowed: 'College, SHS, K-10', required: 'Yes' });
    guideWs.addRow({ field: 'Subject Type', allowed: 'GE, Major, Core, Applied, None', required: 'Yes' });
    guideWs.addRow({ field: 'Units', allowed: 'Number (e.g. 3 for College, 0 for SHS/K-10)', required: 'Yes' });
    guideWs.addRow({ field: 'Grade / Year Level', allowed: '1st Year, 2nd Year, Grade 11, Grade 1, etc.', required: 'Yes' });
    guideWs.addRow({ field: 'Program Code', allowed: progCodes.join(', ') || 'GE, BSIT, BSCS, STEM', required: 'Yes (or GE)' });
    guideWs.addRow({ field: 'Semester', allowed: '1st, 2nd, Summer, N/A', required: 'Yes' });
    guideWs.addRow({ field: 'Curriculum Year', allowed: activeYears.join(', ') || '2024-2025, 2025-2026', required: 'Yes' });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'Subject_Registry_Template.xlsx';
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
          const code = (row['Subject Code'] || row['subject_code'] || row['Code'] || '').toString().trim();
          const desc = (row['Description'] || row['subject_description'] || '').toString().trim();
          const rawCat = (row['Academic Category'] || row['level_category'] || row['Category'] || 'College').toString().trim();
          let cleanCat = 'College';
          if (rawCat.toUpperCase().includes('SHS')) cleanCat = 'SHS';
          else if (rawCat.toUpperCase().includes('K-10') || rawCat.toUpperCase().includes('K10')) cleanCat = 'K-10';

          const type = (row['Subject Type'] || row['subject_type'] || (cleanCat === 'K-10' ? 'None' : 'GE')).toString().trim();
          const units = parseInt(row['Units'] || row['units'] || (cleanCat === 'College' ? 3 : 0), 10);
          const gradeLevel = (row['Grade / Year Level'] || row['grade_level_applicable'] || row['Grade Level'] || (cleanCat === 'College' ? '1st Year' : (cleanCat === 'SHS' ? 'Grade 11' : 'Grade 1'))).toString().trim();
          const progCode = (row['Program Code'] || row['program_code'] || row['Program / Strand'] || 'GE').toString().trim();
          const semester = (row['Semester'] || row['semester'] || (cleanCat === 'K-10' ? 'N/A' : '1st')).toString().trim();
          const currYear = (row['Curriculum Year'] || row['curriculum_year'] || validYears[0] || '2024-2025').toString().trim();

          let errorMsg = null;
          if (!code) errorMsg = "Missing Subject Code";
          else if (!desc) errorMsg = "Missing Description";
          else if (validYears.length > 0 && !validYears.includes(currYear)) {
            errorMsg = `Curriculum Year '${currYear}' does not exist in Admin Setup`;
          }

          return {
            rowNum: idx + 2,
            subject_code: code,
            subject_description: desc,
            level_category: cleanCat,
            subject_type: type,
            units: units,
            grade_level_applicable: gradeLevel,
            program_code: progCode,
            semester: semester,
            curriculum_year: currYear,
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
      const res = await axios.post(`${API_BASE_URL}/registrar/bulk_import_subjects.php`, {
        subjects: importedRows
      });

      if (res.data.success) {
        alert(res.data.message);
        setImportModal(false);
        setImportedRows([]);
        fetchData();
      } else {
        alert("Import Error: " + res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to import subjects.");
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-3 uppercase">
            <BookOpen className="text-blue-600" size={32} /> Subject Registry
          </h1>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">Curriculum Management & Masterlist</p>
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
            onClick={handleDownloadTemplate}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all flex items-center gap-1.5 text-xs uppercase tracking-widest"
            title="Download Sample Template"
          >
            <FileSpreadsheet size={18} className="text-emerald-600"/> Template
          </button>

          <button 
            onClick={handleExportExcel}
            className="px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-xl transition-all flex items-center gap-1.5 text-xs uppercase tracking-widest"
            title="Export Subjects to Excel"
          >
            <Download size={18}/> Export Excel
          </button>

          <button 
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 rounded-xl transition-all flex items-center gap-1.5 text-xs uppercase tracking-widest"
            title="Upload Excel File"
          >
            <Upload size={18}/> Import Excel
          </button>

          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-blue-700 transition-all shadow-xl active:scale-95">
            <Plus size={20} /> New Subject
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 mb-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search by subject code or name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 shadow-sm transition-all" />
        </div>
        <div className="relative w-full md:w-60">
           <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 shadow-sm transition-all appearance-none cursor-pointer">
              <option value="All">All Categories</option>
              <option value="College">College Subjects</option>
              <option value="SHS">Senior High (SHS)</option>
              <option value="K-10">K-10 (Kinder - Gr.10)</option>
           </select>
        </div>
        <div className="relative w-full md:w-60">
           <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
           <select value={curriculumFilter} onChange={(e) => setCurriculumFilter(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-slate-700 shadow-sm transition-all appearance-none cursor-pointer">
              <option value="All">All Curricula</option>
              {curriculumYearsList.length === 0 ? (
                <>
                  <option value="2023-2024">2023-2024</option>
                  <option value="2024-2025">2024-2025</option>
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </>
              ) : (
                curriculumYearsList.map(c => (
                  <option key={c.id || c.curriculum_year} value={c.curriculum_year}>{c.curriculum_year}</option>
                ))
              )}
           </select>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-10 whitespace-nowrap">Subject Details</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Level & Category</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Program / Strand</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">Units</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan="5" className="py-20 text-center font-black text-slate-300 uppercase animate-pulse tracking-widest">Synchronizing Subject Catalog...</td></tr>
                ) : filteredSubjects.length === 0 ? (
                  <tr><td colSpan="5" className="py-20 text-center font-black text-slate-300 uppercase tracking-widest">{categoryFilter !== 'All' ? `No ${categoryFilter} subjects found.` : 'No subjects found in the registry.'}</td></tr>
                ) : (
                  filteredSubjects.map((item) => (
                    <tr key={item.id} onClick={() => handleRowClick(item)} className="hover:bg-blue-50/50 transition-colors group cursor-pointer">
                      <td className="p-6 pl-10">
                        <div>
                          <p className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{item.subject_code}</p>
                           <p className="text-xs font-bold text-slate-500 mt-1">{item.subject_description}</p>
                           <div className="flex gap-2 items-center mt-1">
                             {item.subject_type && item.subject_type !== 'None' && (
                               <span className="text-[9px] font-black uppercase text-indigo-500">{item.subject_type}</span>
                             )}
                             <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                               Curriculum: {item.curriculum_year || '2024-2025'}
                             </span>
                           </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="space-y-2">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest w-max flex ${
                            item.level_category === 'College' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 
                            item.level_category === 'SHS' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            {item.level_category || 'K-10'}
                          </span>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <GraduationCap size={12}/> {item.grade_level_applicable}
                          </p>
                        </div>
                      </td>
                      <td className="p-6">
                         <div>
                            <span className={`text-xs font-black ${item.program_code ? 'text-slate-800' : 'text-blue-500 italic'}`}>
                                {item.program_code || 'General Education (All)'}
                            </span>
                            {(() => {
                              const foundProg = programs.find(p => p.id?.toString() === item.program_id?.toString());
                              const majorText = item.program_major || item.major || foundProg?.major;
                              if (!majorText) return null;
                              const cleanMajor = majorText.replace(/^major\s+in\s+/i, '').trim();
                              if (!cleanMajor) return null;
                              return (
                                <p className="text-[10px] font-bold text-indigo-600 mt-0.5 uppercase tracking-wide">
                                  Major in {cleanMajor}
                                </p>
                              );
                            })()}
                         </div>
                      </td>
                      <td className="p-6 text-center">
                         <span className="text-lg font-black text-slate-600">{item.units}<span className="text-[10px] text-slate-400 font-bold ml-0.5">u</span></span>
                      </td>
                      <td className="p-6 text-center">
                         {/* 🛑 ARCHITECT FIX: Binago ang onClick para tawagin ang Custom Modal */}
                         <button onClick={(e) => handleDeleteClick(e, item)} className="p-3 bg-white border border-slate-100 rounded-xl text-slate-300 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all shadow-sm">
                            <Trash2 size={16}/>
                         </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </div>
      </div>

      <SubjectDetailsModal 
          isOpen={showDetailsModal} 
          onClose={() => setShowDetailsModal(false)} 
          subject={selectedSubject} 
          classes={subjectClasses} 
          loading={detailsLoading} 
      />

      {/* 🛑 ARCHITECT ADDITION: CUSTOM DELETE WARNING MODAL 🛑 */}
      {deleteModal.show && deleteModal.subject && (
        <div className="fixed inset-0 bg-slate-900/60 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-2xl font-black text-center text-slate-800 uppercase tracking-tighter mb-2">Delete Subject?</h3>
                <p className="text-center font-bold text-slate-500 text-sm mb-6">
                    Are you sure you want to delete <span className="text-red-500 font-black">{deleteModal.subject.subject_code}</span>? 
                </p>
                <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-8">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-relaxed text-center">
                        Warning: This will permanently delete all schedules and student enrollments connected to this subject!
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <button onClick={() => setDeleteModal({show: false, subject: null})} disabled={isDeleting} className="flex-1 py-4 rounded-2xl font-black text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-100 transition-all">
                        Cancel
                    </button>
                    <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:bg-red-600 transition-all flex justify-center items-center gap-2">
                        {isDeleting ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />}
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* SMART MODAL (ADD SUBJECT) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          {/* KEEP YOUR ORIGINAL ADD FORM HERE */}
          <form onSubmit={handleSave} className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Register Subject</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Curriculum Database</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>

            <div className="p-10 overflow-y-auto space-y-6">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Category</label>
                 <div className="grid grid-cols-3 gap-3">
                    {Object.keys(LEVEL_CONFIG).map(cat => (
                       <button key={cat} type="button" onClick={() => handleLevelCategoryChange(cat)}
                          className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${formData.level_category === cat ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-300'}`}>
                          {cat}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Subject Code *</label>
                  <input required type="text" placeholder="MATH101" value={formData.subject_code} onChange={e=>setFormData({...formData, subject_code: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Units (Credit)</label>
                  <input type="number" min="0" value={formData.units} onChange={e => setFormData({...formData, units: e.target.value})} disabled={formData.level_category !== 'College'} className={`w-full p-4 rounded-2xl outline-none font-bold transition-all ${formData.level_category !== 'College' ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70' : 'bg-slate-100 text-slate-800 focus:ring-2 focus:ring-blue-500' }`} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Full Description *</label>
                  <input required type="text" placeholder="e.g. Fundamentals of Mathematics" value={formData.subject_description} onChange={e=>setFormData({...formData, subject_description: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:border-blue-500 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Grade / Year Level</label>
                  <select value={formData.grade_level_applicable} onChange={e=>setFormData({...formData, grade_level_applicable: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500">
                    {LEVEL_CONFIG[formData.level_category].levels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Curriculum Year *</label>
                  <select value={formData.curriculum_year} onChange={e => handleCurriculumYearChange(e.target.value)} className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500">
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
                
                {/* ARCHITECT FIX: Dito nilagay ang Subject Type Selection para sa College at SHS */}
                {LEVEL_CONFIG[formData.level_category].needsProgram && (
                   <div className="space-y-1.5 animate-in slide-in-from-top-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Subject Type</label>
                     <select required value={formData.subject_type} onChange={e => setFormData({...formData, subject_type: e.target.value})} className="w-full p-4 bg-slate-100 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500">
                       {formData.level_category === 'College' && (
                         <>
                           <option value="GE">General Education (GE)</option>
                           <option value="Major">Major Subject</option>
                         </>
                       )}
                       {formData.level_category === 'SHS' && (
                         <>
                           <option value="Core">Core Subject</option>
                           <option value="Applied">Applied Subject</option>
                         </>
                       )}
                     </select>
                   </div>
                )}

                {LEVEL_CONFIG[formData.level_category].needsProgram && (
                   <div className="col-span-2 space-y-1.5 animate-in slide-in-from-top-2">
                     <label className="text-[10px] font-black text-blue-500 uppercase ml-1">Program / Course Link</label>
                      <select required value={formData.program_id} onChange={e => setFormData({...formData, program_id: e.target.value})} className="w-full p-4 bg-blue-50 border-2 border-blue-100 text-blue-900 rounded-2xl font-bold outline-none">
                        <option value="" disabled>-- Choose Program / Strand --</option>
                        <option value="GE">{formData.level_category === 'SHS' ? 'Applicable to All Strands' : 'Applicable to All Courses'}</option>
                        {programs
                          .filter(p => 
                            p.department === (formData.level_category === 'SHS' ? 'SHS' : 'College') &&
                            (p.curriculum_year === formData.curriculum_year || (!p.curriculum_year && formData.curriculum_year === '2024-2025'))
                          )
                          .map(p => (
                             <option key={p.id} value={p.id}>
                               {p.program_code} {p.program_description ? `- ${p.program_description}` : ''} {p.major ? `(Major in ${p.major.replace(/^major\s+in\s+/i, '')})` : ''}
                             </option>
                          ))
                        }
                      </select>
                   </div>
                )}
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-8 py-4 rounded-2xl font-black text-slate-400 uppercase text-xs tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
              <button type="submit" disabled={saveLoading} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2 hover:bg-blue-700">
                {saveLoading ? <RefreshCw className="animate-spin" size={18}/> : <><CheckCircle size={18}/> Register Subject</>}
              </button>
            </div>
          </form>
        </div>
      )}
      {/* PREVIEW SUBJECT EXCEL IMPORT MODAL */}
      {importModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-black text-slate-800 uppercase tracking-tight text-lg">Preview Subject Excel Import</h3>
                <p className="text-xs text-slate-500 font-medium">{importedRows.length} subject(s) found in uploaded file.</p>
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
                    <th className="p-3 font-bold text-slate-600">Code</th>
                    <th className="p-3 font-bold text-slate-600">Description</th>
                    <th className="p-3 font-bold text-slate-600">Category</th>
                    <th className="p-3 font-bold text-slate-600">Type</th>
                    <th className="p-3 font-bold text-slate-600">Units</th>
                    <th className="p-3 font-bold text-slate-600">Level</th>
                    <th className="p-3 font-bold text-slate-600">Program</th>
                    <th className="p-3 font-bold text-slate-600">Curriculum</th>
                    <th className="p-3 font-bold text-slate-600">Validation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {importedRows.map((row, idx) => (
                    <tr key={idx} className={row.error ? 'bg-red-50/70' : 'hover:bg-slate-50'}>
                      <td className="p-3 text-slate-400 font-mono">#{row.rowNum || idx + 2}</td>
                      <td className="p-3 font-bold text-blue-600">{row.subject_code}</td>
                      <td className="p-3 text-slate-700">{row.subject_description}</td>
                      <td className="p-3 font-semibold">{row.level_category}</td>
                      <td className="p-3 text-slate-500">{row.subject_type}</td>
                      <td className="p-3 font-bold">{row.units}u</td>
                      <td className="p-3 text-slate-600">{row.grade_level_applicable}</td>
                      <td className="p-3 font-bold text-indigo-600">{row.program_code}</td>
                      <td className="p-3 font-bold">{row.curriculum_year}</td>
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

export default RegistrarSubjects;