import fs from 'fs';

let content = fs.readFileSync('sms-frontend/src/pages/teacher/TeacherActivities.jsx', 'utf8');

// 1. Replace displayedActivities
const oldDisplayed = `  const displayedActivities = activities.filter(act => {
    if (act.category === 'performance') return false;
    if (filterCategory && act.category !== filterCategory) return false;
    if (filterQuarter && String(act.quarter) !== String(filterQuarter)) return false;
    return true;
  });`;

const newDisplayed = `  const matchesCategory = (actCategory, catKey) => {
    if (!catKey) return true;
    if (catKey === 'written') {
      return actCategory === 'written' || actCategory === 'seatwork' || actCategory === 'quiz' || actCategory === 'task' || actCategory === 'assignment';
    }
    if (catKey === 'performance') {
      return actCategory === 'performance' || actCategory === 'activity' || actCategory === 'pt' || actCategory === 'project';
    }
    if (catKey === 'exam') {
      return actCategory === 'exam' || actCategory === 'quarterly' || actCategory === 'periodical' || actCategory === 'prelim' || actCategory === 'midterm' || actCategory === 'finals' || actCategory === 'quarterly_exam';
    }
    return actCategory === catKey;
  };

  const displayedActivities = activities.filter(act => {
    if (filterCategory && !matchesCategory(act.category, filterCategory)) return false;
    if (filterQuarter && String(act.quarter) !== String(filterQuarter)) return false;
    return true;
  });`;

content = content.replace(oldDisplayed, newDisplayed);

// 2. Replace streamItems filter
const oldStreamFilter = `...activities.filter(a => a.category !== 'performance').map(act => ({`;
const newStreamFilter = `...activities.map(act => ({`;
content = content.replace(oldStreamFilter, newStreamFilter);

const oldStreamBadge = `badgeType: act.category === 'exam' ? 'Examination' : 'Classwork',`;
const newStreamBadge = `badgeType: act.category === 'exam' ? 'Examination' : act.category === 'seatwork' ? 'Seatwork' : act.category === 'quiz' ? 'Class Quiz' : act.category === 'performance' ? 'Performance Task' : 'Classwork',`;
content = content.replace(oldStreamBadge, newStreamBadge);

// 3. Replace category map in Classwork
const oldCategoryMap = `              {viewCategories.map(category => {
                const items = displayedActivities.filter(act => act.category === category.key);
                if (items.length === 0) return null;`;

const newCategoryMap = `              {viewCategories.map(category => {
                const items = displayedActivities.filter(act => matchesCategory(act.category, category.key));
                if (items.length === 0) return null;`;

content = content.replace(oldCategoryMap, newCategoryMap);

// 4. Add badges to activity title
const oldTitleRow = `                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-800 text-[15px]">{act.title}</h3>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{act.max_score} pts {act.quarter && \` • Q\${act.quarter}\`}</p>
                            </div>`;

const newTitleRow = `                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-slate-800 text-[15px]">{act.title}</h3>
                                {act.category === 'seatwork' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700">Seatwork</span>
                                )}
                                {act.category === 'quiz' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700">Class Quiz</span>
                                )}
                                {act.category === 'activity' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700">Activity</span>
                                )}
                                {act.category === 'performance' && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700">Performance Task</span>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-1">{act.max_score} pts {act.quarter && \` • Q\${act.quarter}\`}</p>
                            </div>`;

content = content.replace(oldTitleRow, newTitleRow);

fs.writeFileSync('sms-frontend/src/pages/teacher/TeacherActivities.jsx', content, 'utf8');
console.log('TeacherActivities.jsx successfully updated!');

