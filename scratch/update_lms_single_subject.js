import fs from 'fs';

let content = fs.readFileSync('sms-frontend/src/pages/lms/LmsSingleSubject.jsx', 'utf8');

const oldBlock = `                                        {/* KUNG CLOSED AT NAKA-TAKE NA */}
                                        {post.is_closed && (post.attempts > 0 || post.status === 'Graded') && (
                                          <div className="flex flex-wrap items-center gap-2">
                                            <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                              <CheckCircle size={15} /> Score: {post.score ?? 0}/{post.total ?? 0} (Deadline Passed)
                                            </div>
                                            <button
                                              onClick={() => navigate(\`/lms/exam/\${post.id.replace('act_', '')}\`)}
                                              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            >
                                              <Award size={15} /> View Result
                                            </button>
                                          </div>
                                        )}

                                        {/* KUNG CLOSED AT HINDI NAKA-TAKE */}
                                        {post.is_closed && (!post.attempts || post.attempts === 0) && post.status !== 'Graded' && (
                                          <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black flex items-center gap-2 border border-rose-200 dark:border-rose-500/30">
                                            <Lock size={15} /> Closed • Deadline Expired
                                          </div>
                                        )}

                                        {/* KUNG OPEN AT PWEDE PANG I-TAKE O RETAKE */}
                                        {!post.is_closed && (post.attempts < post.max_attempts || !post.status || post.status === 'Pending') && (
                                          <button 
                                             onClick={() => navigate(\`/lms/exam/\${post.id.replace('act_', '')}\`)} 
                                             className="px-5 py-2.5 bg-[var(--primary-color)] text-white rounded-xl text-xs font-black flex items-center gap-2 hover:brightness-110 shadow-md transition-all group"
                                          >
                                             <Award size={16} className="group-hover:scale-110 transition-transform" /> 
                                             {post.attempts > 0 ? \`Retake Exam (\${post.attempts}/\${post.max_attempts} Tries)\` : 'Take Assessment'}
                                          </button>
                                        )}

                                        {/* KUNG GRADED NA AT NAUBOS NA ANG ATTEMPTS PERO HINDI CLOSED */}
                                        {!post.is_closed && post.status === 'Graded' && post.attempts >= post.max_attempts && (
                                          <div className="flex flex-wrap items-center gap-2">
                                            <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                               <CheckCircle size={16} /> 
                                               Graded: {post.score}/{post.total}
                                            </div>
                                            <button
                                              onClick={() => navigate(\`/lms/exam/\${post.id.replace('act_', '')}\`)}
                                              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                            >
                                              <Award size={15} /> View Result
                                            </button>
                                          </div>
                                        )}`;

const newBlock = `                                        {/* KUNG CLOSED AT NAKA-TAKE NA (BAWAL NA RETAKE KAHIT MAY TRIES PA) */}
                                        {post.is_closed && (post.attempts > 0 || post.status === 'Graded') && (
                                          <div className="flex flex-wrap items-center gap-2">
                                            <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                              <CheckCircle size={15} /> Final Score: {post.score ?? 0}/{post.total ?? 0} (Activity Closed)
                                            </div>
                                            <button
                                              onClick={() => navigate(\`/lms/exam/\${post.id.replace('act_', '')}\`)}
                                              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                                            >
                                              <Award size={15} /> View Result
                                            </button>
                                          </div>
                                        )}

                                        {/* KUNG CLOSED AT HINDI NAKA-TAKE */}
                                        {post.is_closed && (!post.attempts || post.attempts === 0) && post.status !== 'Graded' && (
                                          <div className="px-4 py-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-black flex items-center gap-2 border border-rose-200 dark:border-rose-500/30">
                                            <Lock size={15} /> Closed • Deadline Expired
                                          </div>
                                        )}

                                        {/* KUNG OPEN AT PWEDE PANG I-TAKE O RETAKE */}
                                        {!post.is_closed && (post.attempts < post.max_attempts || !post.status || post.status === 'Pending') && (
                                          <div className="flex flex-wrap items-center gap-2">
                                            {post.status === 'Graded' && (
                                              <div className="px-4 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                                <CheckCircle size={15} /> Best Score: {post.score ?? 0}/{post.total ?? 0}
                                              </div>
                                            )}
                                            <button 
                                               onClick={() => navigate(\`/lms/exam/\${post.id.replace('act_', '')}\`)} 
                                               className="px-5 py-2.5 bg-[var(--primary-color)] text-white rounded-xl text-xs font-black flex items-center gap-2 hover:brightness-110 shadow-md transition-all group cursor-pointer"
                                            >
                                               <Award size={16} className="group-hover:scale-110 transition-transform" /> 
                                               {post.attempts > 0 ? \`Retake (\${post.attempts}/\${post.max_attempts} Tries • Keeps Highest)\` : 'Take Assessment'}
                                            </button>
                                          </div>
                                        )}

                                        {/* KUNG GRADED NA AT NAUBOS NA ANG ATTEMPTS PERO HINDI CLOSED */}
                                        {!post.is_closed && post.status === 'Graded' && post.attempts >= post.max_attempts && (
                                          <div className="flex flex-wrap items-center gap-2">
                                            <div className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-2">
                                               <CheckCircle size={16} /> 
                                               Final Score: {post.score}/{post.total} (Attempts Exhausted)
                                            </div>
                                            <button
                                              onClick={() => navigate(\`/lms/exam/\${post.id.replace('act_', '')}\`)}
                                              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                                            >
                                              <Award size={15} /> View Result
                                            </button>
                                          </div>
                                        )}`;

content = content.replace(oldBlock, newBlock);
fs.writeFileSync('sms-frontend/src/pages/lms/LmsSingleSubject.jsx', content, 'utf8');
console.log('LmsSingleSubject.jsx updated successfully!');

