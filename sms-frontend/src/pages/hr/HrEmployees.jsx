import React, { useState } from 'react';
import { Users, PlusCircle, Search, Mail, UserCheck, Send, CheckCircle2, UserPlus } from 'lucide-react';

const HrEmployees = () => {
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([
    { id: "EMP-041", name: "Jobel Jobert", email: "jobel.it@school.edu", role: "IT", status: "Active", triggers: ["IT Account Created", "Payroll Set up"] },
    { id: "EMP-042", name: "Clara Santos", email: "clara.registrar@school.edu", role: "Registrar", status: "Active", triggers: ["IT Account Created", "Payroll Set up"] },
    { id: "EMP-043", name: "Prof. Del Rosario", email: "delrosario.teach@school.edu", role: "Teacher", status: "Active", triggers: ["IT Account Created", "Payroll Set up", "Faculty Classroom Load Assigned"] }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('IT');

  const handleHireEmployee = (e) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    // Build automated triggers based on selected role
    const triggers = ["IT Account request sent", "Payroll configuration queued"];
    if (newRole.toLowerCase() === 'teacher') {
      triggers.push("Faculty assignment setup requested (Registrar)");
    }
    triggers.push("Performance evaluation setup dispatched to Dept Head");

    const newEmp = {
      id: `EMP-0${Math.floor(44 + Math.random() * 100)}`,
      name: newName,
      email: newEmail,
      role: newRole,
      status: "Active",
      triggers
    };

    setEmployees([newEmp, ...employees]);
    setNewName('');
    setNewEmail('');
    setShowForm(false);

    alert(
      `Hired successfully!\n\nAutomated workflows triggered:\n1. IT Portal account generation\n2. Finance payroll record queue\n3. ${newRole === 'Teacher' ? 'Registrar Classroom Load Mapping\n4. ' : ''}Evaluation check setup`
    );
  };

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="text-blue-600" size={32} />
            Employee Management
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Register new faculty, configure department roles, and track automated inter-departmental triggers.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
        >
          <UserPlus size={16} />
          Hire New Employee
        </button>
      </div>

      {/* NEW HIRE FORM MODAL */}
      {showForm && (
        <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl space-y-4 animate-in slide-in-from-top-3 duration-300">
          <h3 className="text-sm font-black text-slate-800 tracking-tight">Enter New Hire Profile Details</h3>
          <form onSubmit={handleHireEmployee} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Full Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="e.g. Jobel Jobert" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Email Address</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="e.g. jobel@school.edu" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Position / Role</label>
              <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors">
                <option value="IT">IT Portal Staff</option>
                <option value="Registrar">Registrar Administrator</option>
                <option value="Cashier">Finance Cashier</option>
                <option value="Teacher">Academic Teacher (Faculty)</option>
                <option value="Custodian">Custodian Staff</option>
                <option value="School Admin">School Operations Admin</option>
              </select>
            </div>
            <button type="submit" className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]">
              Approve & Trigger Setup
            </button>
          </form>
        </div>
      )}

      {/* FILTER SEARCH BAR */}
      <div className="bg-white rounded-[2rem] border border-slate-100 p-4 shadow-xl flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees by name, position role..."
          className="w-full text-sm bg-transparent focus:outline-none placeholder-slate-400 font-medium text-slate-700"
        />
      </div>

      {/* DIRECTORY TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 md:p-8 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name Details</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Job Position</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Automated Inter-Dept Status</th>
                <th className="py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Uptime status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pr-4">
                    <span className="text-xs font-mono font-bold text-slate-400">{emp.id}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <p className="text-sm font-bold text-slate-700">{emp.name}</p>
                    <span className="text-xs text-slate-400 font-semibold">{emp.email}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-full">{emp.role}</span>
                  </td>
                  <td className="py-4 pr-4 max-w-xs">
                    <div className="flex flex-wrap gap-1.5">
                      {emp.triggers.map((t, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                          <CheckCircle2 size={10} />
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default HrEmployees;
