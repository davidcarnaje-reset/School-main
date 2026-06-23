import React from 'react';
import { PlayCircle, Rocket, Star } from 'lucide-react';

const KidsDashboard = ({ courses }) => {
  return (
    <div className="animate-in fade-in zoom-in duration-500">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-8 rounded-[3rem] mb-10 text-white relative overflow-hidden shadow-xl">
         <Rocket className="absolute right-10 top-10 opacity-20 rotate-12" size={120} />
         <h1 className="text-3xl md:text-4xl font-black mb-2">Hi Little Explorer! 🚀</h1>
         <p className="font-bold opacity-90">Ready for your fun classes today?</p>
      </div>

      <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
         <Star className="text-yellow-500 fill-yellow-500" /> My Subjects
      </h2>
      
      {/* Course Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course, i) => (
          <div key={i} className="bg-white p-2 rounded-[2.5rem] shadow-lg border-b-8 border-slate-200 hover:border-orange-400 transition-all cursor-pointer group">
             <div className={`h-48 rounded-[2rem] ${course.color} flex items-center justify-center mb-4 relative overflow-hidden`}>
                <span className="text-3xl font-black text-white/30 px-4 text-center">{course.title.split(':')[0]}</span>
                <PlayCircle className="absolute text-white group-hover:scale-125 transition-transform drop-shadow-lg" size={60} />
             </div>
             <div className="p-4 text-center">
                <h3 className="text-xl font-black text-slate-800 truncate">{course.title}</h3>
                <button className="mt-4 bg-orange-400 text-white px-6 py-2 rounded-full font-black text-sm w-full shadow-md hover:bg-orange-500 transition-colors">
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