import React, { useState, useEffect } from 'react';
import { X, Megaphone, Clock, AlertTriangle, FileText, ThumbsUp, Heart, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext'; 

const ReadNotificationModal = ({ isOpen, onClose, notification, onReactionUpdate }) => {
  const { API_BASE_URL, user } = useAuth();
  
  const [reaction, setReaction] = useState(null); 
  // 🟢 BAGONG STATE: Para hawakan ang summary galing sa get_reactions.php
  const [reactionSummary, setReactionSummary] = useState(null); 

  useEffect(() => {
    if (notification && isOpen) {
      // I-set ang sariling reaction ng user para sa kahit anong type
      setReaction(notification.reaction || null);

      // 🟢 FETCH SUMMARY: Para sa 'Announcement' at 'Urgent Alert'
      // (Kung gusto mo ring makita kung ilan ang nag-acknowledge sa Urgent Alert)
      if (notification.type === 'Announcement' || notification.type === 'Urgent Alert') {
        const fetchReactions = async () => {
          try {
            const res = await axios.get(`${API_BASE_URL}/notifications/get_reactions.php?notification_id=${notification.id}`);
            if (res.data.success) {
              setReactionSummary(res.data.summary);
            }
          } catch (error) {
            console.error("Error fetching reaction summary:", error);
          }
        };
        fetchReactions();
      } else {
        setReactionSummary(null);
      }
    }
  }, [notification, isOpen, API_BASE_URL]);

  if (!isOpen || !notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'Urgent Alert': return <AlertTriangle size={24} className="text-red-500" />;
      case 'Task Reminder': return <Clock size={24} className="text-amber-500" />;
      case 'System Message': return <FileText size={24} className="text-blue-500" />;
      default: return <Megaphone size={24} className="text-blue-600" />;
    }
  };

  const handleReact = async (type) => {
    const currentId = user.role === 'student' ? user.student_id : user.id;
    const newReaction = reaction === type ? null : type;
    
    // 1. Update ang local state ng user
    setReaction(newReaction);

    // 2. Optimistic UI: I-update din agad ang bilang (summary) bago pa mag-reply ang server
    setReactionSummary(prev => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (reaction) updated[reaction] = Math.max(0, updated[reaction] - 1); // Bawasan yung dati
      if (newReaction) updated[newReaction] += 1; // Idagdag yung bago
      return updated;
    });

    // 3. I-update ang parent component
    if (onReactionUpdate) {
      onReactionUpdate(notification.id, newReaction);
    }

    try {
      // 4. I-save sa database (notifications_reaction table)
      await axios.post(`${API_BASE_URL}/notifications/react_to_notif.php`, {
        notification_id: notification.id,
        user_id: currentId,
        role: user.role,
        reaction: newReaction
      });
    } catch (error) {
      console.error("Reaction error:", error);
      // Revert kung nag-fail
      setReaction(notification.reaction || null); 
      if (onReactionUpdate) onReactionUpdate(notification.id, notification.reaction || null);
    }
  };

// 🟢 FIX: Idinagdag ang 'Urgent Alert' sa listahan ng may buttons
const showReactions = 
  (notification.sender_role === 'registrar' || notification.sender_role === 'cashier') && 
  ['Announcement', 'Task Reminder', 'Urgent Alert'].includes(notification.type);
  
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        
        {/* MODAL HEADER */}
        <div className="px-6 py-4 flex justify-between items-start pt-6 shrink-0 border-b border-slate-100 bg-slate-50/50">
          <div className="flex gap-4 items-start">
            <div className={`p-3 rounded-2xl shrink-0 ${notification.type === 'Urgent Alert' ? 'bg-red-100' : notification.type === 'Task Reminder' ? 'bg-amber-100' : 'bg-blue-100'}`}>
              {getIcon()}
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 leading-tight mb-1 tracking-tight">{notification.title}</h2>
              <p className="text-xs text-slate-500 font-medium">
                Sent by <span className="font-bold text-slate-700">{notification.sender}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 pt-2 overflow-y-auto custom-scrollbar flex-1">
          {notification.dueDate && (
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700">
               <Clock size={14} /> Due: {notification.dueDate}
            </div>
          )}
          
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
            {notification.message}
          </div>

          {notification.attachment && (
            <div className="mt-4 rounded-2xl overflow-hidden border-4 border-white shadow-lg ring-1 ring-slate-200">
              <img 
                src={`${API_BASE_URL}/uploads/notifications/${notification.attachment}`} 
                alt="Announcement Attachment" 
                className="w-full h-auto object-cover animate-in fade-in" 
              />
            </div>
          )}
        </div>
{/* 🟢 REACTION SUMMARY DISPLAY */}
{/* STRICT CHECK: Lalabas LANG ang summary/count kung Announcement ang type */}
{notification.type === 'Announcement' && reactionSummary && (reactionSummary.like > 0 || reactionSummary.heart > 0 || reactionSummary.noted > 0) && (
  <div className="px-6 py-2.5 bg-white border-t border-slate-100 flex items-center gap-4 text-[13px] font-semibold text-slate-500 shrink-0">
    {reactionSummary.like > 0 && (
      <span className="flex items-center gap-1.5"><ThumbsUp size={14} className="text-blue-500 fill-blue-500" /> {reactionSummary.like}</span>
    )}
    {reactionSummary.heart > 0 && (
      <span className="flex items-center gap-1.5"><Heart size={14} className="text-red-500 fill-red-500" /> {reactionSummary.heart}</span>
    )}
    {reactionSummary.noted > 0 && (
      <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> {reactionSummary.noted}</span>
    )}
  </div>
)}

        {/* REACTIONS ACTIONS & FOOTER */}
        {showReactions && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <div className="flex gap-2">
              <button 
                onClick={() => handleReact('like')}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${reaction === 'like' ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500 ring-offset-1' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
              >
                <ThumbsUp size={14} className={reaction === 'like' ? 'fill-blue-600' : ''} /> 
                {reaction === 'like' ? 'Liked' : 'Like'}
              </button>
              <button 
                onClick={() => handleReact('heart')}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${reaction === 'heart' ? 'bg-red-100 text-red-600 ring-2 ring-red-500 ring-offset-1' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
              >
                <Heart size={14} className={reaction === 'heart' ? 'fill-red-600' : ''} />
                {reaction === 'heart' ? 'Loved' : 'Love'}
              </button>
              <button 
                onClick={() => handleReact('noted')}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${reaction === 'noted' ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 ring-offset-1' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100'}`}
              >
                <CheckCircle2 size={14} className={reaction === 'noted' ? 'text-emerald-700' : ''} /> 
                {reaction === 'noted' ? 'Noted' : 'Acknowledge'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ReadNotificationModal;