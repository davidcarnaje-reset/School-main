import fs from 'fs';

let content = fs.readFileSync('sms-frontend/src/components/lms/StandardSchedule.jsx', 'utf8');
const lines = content.split(/\r?\n/);
const startIdx = lines.findIndex(l => l.includes('{day && ('));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('{hasContent'));

console.log('startIdx:', startIdx, 'endIdx:', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const newBlock = [
    '                   {day && (',
    '                     <>',
    '                        <div className="flex items-center justify-between w-full">',
    '                          <span className={`text-[10px] md:text-sm font-black ${isToday ? "text-[var(--primary-color)] dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>{day}</span>',
    '                          {isToday && (',
    '                            <span className="hidden md:inline-block px-1.5 py-0.5 rounded-full bg-[var(--primary-color)] text-white text-[8px] font-black uppercase tracking-wider">Today</span>',
    '                          )}',
    '                        </div>',
    '                        ',
    '                        <div className="mt-auto md:mt-2 w-full flex flex-col gap-1 z-10">',
    '                           {(dayData?.classes?.length > 0) && (',
    '                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-[var(--primary-color)] dark:text-blue-300 text-[9px] md:text-[10px] font-black truncate border border-blue-100 dark:border-blue-900/40" title={`${dayData.classes.length} Classes scheduled`}>',
    '                                <BookOpen size={10} className="shrink-0 hidden md:block" />',
    '                                <span className="truncate">{dayData.classes.length} {dayData.classes.length === 1 ? "Class" : "Classes"}</span>',
    '                              </div>',
    '                           )}',
    '                           {(dayData?.deadlines?.length > 0) && (',
    '                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[9px] md:text-[10px] font-black truncate border border-red-100 dark:border-red-900/40" title={`${dayData.deadlines.length} Deadlines due`}>',
    '                                <AlertCircle size={10} className="shrink-0 hidden md:block" />',
    '                                <span className="truncate">{dayData.deadlines.length} Due</span>',
    '                              </div>',
    '                           )}',
    '                           {(dayData?.assigned?.length > 0) && (',
    '                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[9px] md:text-[10px] font-black truncate border border-amber-100 dark:border-amber-900/40" title={`${dayData.assigned.length} Tasks posted`}>',
    '                                <Edit3 size={10} className="shrink-0 hidden md:block" />',
    '                                <span className="truncate">{dayData.assigned.length} Posted</span>',
    '                              </div>',
    '                           )}',
    '                           {dayReminders?.length > 0 && (',
    '                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-[9px] md:text-[10px] font-black truncate border border-purple-100 dark:border-purple-900/40">',
    '                                <StickyNote size={10} className="shrink-0 hidden md:block" />',
    '                                <span className="truncate">{dayReminders.length} Note</span>',
    '                              </div>',
    '                           )}',
    '                        </div>'
  ];

  lines.splice(startIdx, endIdx - startIdx, ...newBlock);
  fs.writeFileSync('sms-frontend/src/components/lms/StandardSchedule.jsx', lines.join('\n'), 'utf8');
  console.log('Successfully updated StandardSchedule.jsx!');
}

