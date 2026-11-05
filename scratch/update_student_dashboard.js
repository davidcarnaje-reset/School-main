import fs from 'fs';

let content = fs.readFileSync('sms-frontend/src/pages/student/StudentDashboard.jsx', 'utf8');

// 1. Update calendar logic
const oldCal = `             <div className="grid grid-cols-7 gap-1 text-center">
                <div className="p-2 text-transparent">0</div>
                <div className="p-2 text-transparent">0</div>
                <div className="p-2 text-transparent">0</div>
                {Array.from({length: 28}, (_, i) => i + 1).map(day => (
                  <div key={day} className={\`p-2 text-xs font-bold rounded-lg flex items-center justify-center cursor-pointer transition-colors \${
                     day === today.getDate() ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
                  }\`}>
                    {day}
                  </div>
                ))}
             </div>`;

const newCal = `             <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: new Date(today.getFullYear(), today.getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={\`empty_\${i}\`} className="p-2 text-transparent">0</div>
                ))}
                {Array.from({ length: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => (
                  <div key={day} className={\`p-2 text-xs font-bold rounded-lg flex items-center justify-center cursor-pointer transition-colors \${
                     day === today.getDate() ? 'bg-indigo-600 text-white shadow-md font-black' : 'text-slate-600 hover:bg-slate-100'
                  }\`}>
                    {day}
                  </div>
                ))}
             </div>`;

content = content.replace(oldCal, newCal);

// 2. Fallback to user identifier for schedule and pending tasks
const oldFetch = `        // 3. FETCH REAL SCHEDULE & TASKS
        try {
          const acadRes = await axios.get(\`\${API_BASE_URL}/student/get_student_dashboard_data.php?student_id=\${myData.student_id}\`);
          if (acadRes.data && acadRes.data.success) {
            setScheduleToday(acadRes.data.scheduleToday || []);
            setPendingTasks(acadRes.data.pendingTasks || []);
          }
        } catch (e) { console.error("Academic Data Error:", e); }`;

const newFetch = `        // 3. FETCH REAL SCHEDULE & TASKS
        try {
          const studentIdentifier = myData?.student_id || user?.student_id || user?.username || user?.id;
          const acadRes = await axios.get(\`\${API_BASE_URL}/student/get_student_dashboard_data.php?student_id=\${studentIdentifier}\`);
          if (acadRes.data && acadRes.data.success) {
            setScheduleToday(acadRes.data.scheduleToday || []);
            setPendingTasks(acadRes.data.pendingTasks || []);
          }
        } catch (e) { console.error("Academic Data Error:", e); }`;

content = content.replace(oldFetch, newFetch);

fs.writeFileSync('sms-frontend/src/pages/student/StudentDashboard.jsx', content, 'utf8');
console.log('StudentDashboard.jsx updated successfully!');

