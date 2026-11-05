import getStudentSchedule from '../api/controllers/lms/getStudentSchedule.js';

async function test() {
  const req = { query: { student_id: 'K12-2026-0002' } };
  let scheduleData = [];
  let tasksData = [];
  const res = {
    status: () => ({ json: () => {} }),
    json: (d) => {
      scheduleData = d.schedule;
      tasksData = d.tasks;
    }
  };
  await getStudentSchedule(req, res);

  const isClassScheduledOnDay = (classItem, dayOfWeek) => {
    const daysStr = (classItem.days || '').trim().toUpperCase();
    const schedStr = (classItem.schedule || '').trim().toUpperCase();
    const combined = daysStr + ' ' + schedStr;
    switch (dayOfWeek) {
      case 0: return daysStr.includes('SU') || daysStr.includes('SUN') || combined.includes('SUNDAY');
      case 1: return daysStr.split(/[\s,]+/).some(d => d === 'M' || d === 'MON') || combined.includes('MWF') || combined.includes('MONDAY');
      case 2: return daysStr.split(/[\s,]+/).some(d => d === 'T' || d === 'TUE') || combined.includes('TTH') || combined.includes('TUESDAY');
      case 3: return daysStr.split(/[\s,]+/).some(d => d === 'W' || d === 'WED') || combined.includes('MWF') || combined.includes('WEDNESDAY');
      case 4: return daysStr.split(/[\s,]+/).some(d => d === 'TH' || d === 'THU') || combined.includes('TTH') || combined.includes('THURSDAY');
      case 5: return daysStr.split(/[\s,]+/).some(d => d === 'F' || d === 'FRI') || combined.includes('MWF') || combined.includes('FRIDAY');
      case 6: return daysStr.split(/[\s,]+/).some(d => d === 'S' || d === 'SAT') || combined.includes('SATURDAY');
      default: return false;
    }
  };

  const currentYear = 2026;
  const currentMonthNumber = 11;
  const calendarDate = new Date(2026, 10, 1);
  const daysInMonth = 30;

  const dataMap = {};
  const monthStr = String(currentMonthNumber).padStart(2, '0');

  for (let day = 1; day <= daysInMonth; day++) {
    const dayOfWeekForDate = new Date(currentYear, calendarDate.getMonth(), day).getDay();
    const dateStr = `${currentYear}-${monthStr}-${String(day).padStart(2, '0')}`;

    const classesForToday = scheduleData.filter(c => isClassScheduledOnDay(c, dayOfWeekForDate));
    const deadlinesForToday = tasksData.filter(t => t.due_date === dateStr);
    const assignedForToday = tasksData.filter(t => t.assigned_date === dateStr && t.due_date !== dateStr);

    if (classesForToday.length > 0 || deadlinesForToday.length > 0 || assignedForToday.length > 0) {
      dataMap[day] = {
        classes: classesForToday.length,
        deadlines: deadlinesForToday.length,
        assigned: assignedForToday.length,
        deadlinesList: deadlinesForToday.map(d => d.title),
        assignedList: assignedForToday.map(a => a.title),
        classesList: classesForToday.map(c => c.code)
      };
    }
  }

  console.log('November 2026 dataMap:');
  console.log(JSON.stringify(dataMap, null, 2));

  process.exit(0);
}

test().catch(console.error);

