import fs from 'fs';

let content = fs.readFileSync('sms-frontend/src/pages/lms/LmsTakeExam.jsx', 'utf8');

// 1. Add Award to imports
if (!content.includes('Award,')) {
  content = content.replace(
    'Maximize2, AlertTriangle, Lock, EyeOff, FileCheck, Upload, Send, ExternalLink, FileText, Image, Paperclip, Video',
    'Maximize2, AlertTriangle, Lock, EyeOff, FileCheck, Upload, Send, ExternalLink, FileText, Image, Paperclip, Video, Award'
  );
}

// 2. Add handleStartRetake
const handleRetakeFunc = `  const handleStartRetake = () => {
    if (examData?.is_closed) {
      showAlert('error', 'Activity Closed', 'This activity is already closed. Retakes are not allowed after the due date.');
      return;
    }
    setResult(null);
    setAnswers({});
    setViolationCount(0);
    setViolationLog([]);
    violationCountRef.current = 0;
    violationLogRef.current = [];
    setHasStarted(false);
    if (examData?.time_limit_minutes || examData?.seconds_until_due != null) {
      const limitSecs = examData?.time_limit_minutes ? examData.time_limit_minutes * 60 : Infinity;
      const dueSecs = examData?.seconds_until_due != null ? examData.seconds_until_due : Infinity;
      setTimeLeft(Math.min(limitSecs, dueSecs));
    }
  };

  const handleStartExam = () => {`;

content = content.replace('const handleStartExam = () => {', handleRetakeFunc);

// 3. Update Result Screen Actions
const oldResultButtons = `            <div>
              <button
                onClick={() => navigate(-1)}
                className="px-8 py-3.5 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 shadow-md transition-all"
              >
                Return to Classroom
              </button>
            </div>`;

const newResultButtons = `            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {result.can_retake && !examData?.is_closed && (
                <button
                  type="button"
                  onClick={handleStartRetake}
                  className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Award size={18} /> Retake Assessment ({attemptsInfo.current}/{attemptsInfo.max} Used • Keeps Highest Score)
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white font-black text-sm rounded-xl hover:bg-indigo-700 shadow-md transition-all cursor-pointer"
              >
                Return to Classroom
              </button>
            </div>

            {examData?.is_closed && (
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-4 flex items-center justify-center gap-1.5">
                <Lock size={14} className="text-rose-500" /> Activity is now closed. Retakes are not allowed after the due date.
              </p>
            )}

            {!examData?.is_closed && attemptsInfo.current >= attemptsInfo.max && attemptsInfo.max > 1 && (
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-4 flex items-center justify-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-500" /> All {attemptsInfo.max} allowed attempts have been completed.
              </p>
            )}`;

content = content.replace(oldResultButtons, newResultButtons);

fs.writeFileSync('sms-frontend/src/pages/lms/LmsTakeExam.jsx', content, 'utf8');
console.log('LmsTakeExam.jsx updated successfully!');

