import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Rocket, Star, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

const KidsDashboard = ({ courses = [], nextLessons = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="animate-in fade-in zoom-in duration-500 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-amber-500 p-8 md:p-10 rounded-[3rem] mb-10 text-white relative overflow-hidden shadow-xl">
        <Rocket className="absolute right-6 top-6 opacity-25 rotate-12" size={120} />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-3">
            <Sparkles size={14} /> Welcome Back!
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">Hi Little Explorer! 🚀</h1>
          <p className="font-bold opacity-90 text-sm md:text-base">Ready for your fun classes and activities today?</p>
        </div>
      </div>

      {/* ACTIVITIES / HOMEWORK TO ANSWER */}
      {nextLessons && nextLessons.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <AlertCircle className="text-rose-500" /> Things to Answer & Submit 📝
            </h2>
            <span className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-black rounded-full">
              {nextLessons.length} {nextLessons.length === 1 ? 'Task' : 'Tasks'} Pending
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nextLessons.map((task, i) => (
              <div
                key={task.id || i}
                onClick={() => task.id ? navigate(`/lms/exam/${task.id}`) : navigate(`/lms/course/${task.class_id}`)}
                className="bg-white p-5 rounded-[2.5rem] shadow-lg border-b-6 border-rose-300 hover:border-rose-500 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 font-black text-[10px] uppercase tracking-wider">
                      {task.desc || task.subject || 'Task'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {task.duration || 'No Due'}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 group-hover:text-rose-500 transition-colors line-clamp-2">
                    {task.title}
                  </h3>
                  {task.teacher && (
                    <p className="text-xs font-bold text-slate-400 mt-1">Teacher: {task.teacher}</p>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (task.id) navigate(`/lms/exam/${task.id}`);
                    else navigate(`/lms/course/${task.class_id}`);
                  }}
                  className="mt-4 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-full font-black text-xs w-full shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  Start Activity Now! <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBJECTS SECTION */}
      <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
        <Star className="text-yellow-500 fill-yellow-500" /> My Subjects
      </h2>
      
      {/* Course Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course, i) => (
          <div
            key={course.class_id || i}
            onClick={() => navigate(`/lms/course/${course.class_id}`)}
            className="bg-white p-2 rounded-[2.5rem] shadow-lg border-b-8 border-slate-200 hover:border-orange-400 transition-all cursor-pointer group"
          >
             <div className={`h-48 rounded-[2rem] ${course.color} flex items-center justify-center mb-4 relative overflow-hidden`}>
                <span className="text-3xl font-black text-white/30 px-4 text-center">{course.title.split(':')[0]}</span>
                <PlayCircle className="absolute text-white group-hover:scale-125 transition-transform drop-shadow-lg" size={60} />
             </div>
             <div className="p-4 text-center">
                <h3 className="text-xl font-black text-slate-800 truncate">{course.title}</h3>
                {course.teacher && (
                  <p className="text-xs font-bold text-slate-400 mt-1 truncate">Teacher: {course.teacher}</p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/lms/course/${course.class_id}`);
                  }}
                  className="mt-4 bg-orange-400 text-white px-6 py-2 rounded-full font-black text-sm w-full shadow-md hover:bg-orange-500 transition-colors"
                >
                  Let's Learn!
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KidsDashboard;
