// src/components/lms/ProfileMessages.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Search, Send, Paperclip, MoreVertical, Phone, Video, 
  Loader2, MessageSquare, Plus, X, FileText, Link as LinkIcon, 
  Image as ImageIcon, BellOff, ShieldAlert, Info, ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; 

const ProfileMessages = () => {
  const { user, API_BASE_URL } = useAuth();
  
  const userId = user?.id || user?.student_id || user?.username;
  const userRole = user?.role || 'student';

  // States
  const [contacts, setContacts] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showInfoPanel, setShowInfoPanel] = useState(false);

  const messagesEndRef = useRef(null);

  const fetchContacts = async () => {
    if (!userId) return;
    try {
      setLoadingContacts(true);
      const response = await axios.get(`${API_BASE_URL}/messages/get_contacts.php?user_id=${userId}&user_role=${userRole}`);
      if (response.data.status === 'success') {
        setContacts(response.data.contacts || []);
      }
    } catch (error) {
      console.error("Contacts Fetch Error:", error);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [userId, userRole, API_BASE_URL]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleContactClick = async (contact) => {
    setActiveContact(contact);
    setLoadingMessages(true);
    setShowInfoPanel(false); 
    try {
      const response = await axios.get(
        `${API_BASE_URL}/messages/get_messages.php?user_id=${userId}&user_role=${userRole}&contact_id=${contact.contact_id}&contact_role=${contact.contact_role}`
      );
      if (response.data.status === 'success') {
        setMessages(response.data.data || []);
      }
    } catch (error) {
      console.error("Messages Fetch Error:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleOpenNewChat = async () => {
    setShowNewChatModal(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/messages/get_available_contacts.php?user_id=${userId}&user_role=${userRole}`);
      if (res.data.status === 'success') {
        setAvailableContacts(res.data.contacts);
      }
    } catch (err) {
      console.error("Available Contacts Error:", err);
    }
  };

  const startNewChat = (contact) => {
    setActiveContact(contact);
    setMessages([]); 
    setShowNewChatModal(false);
    setShowInfoPanel(false);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeContact) return;

    const tempMsg = newMessage;
    setNewMessage("");

    try {
      const payload = {
        sender_id: userId,
        sender_role: userRole,
        receiver_id: activeContact.contact_id,
        receiver_role: activeContact.contact_role,
        message: tempMsg
      };

      const response = await axios.post(`${API_BASE_URL}/messages/send_message.php`, payload);

      if (response.data.status === 'error') {
        if (response.data.error_code === 'LIMIT_REACHED') {
          alert(`Staff Protection: ${response.data.message}`);
        }
        setNewMessage(tempMsg);
        return;
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        text: tempMsg,
        is_you: true,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      
      fetchContacts();

    } catch (error) {
      setNewMessage(tempMsg);
      console.error("Send Error:", error);
    }
  };

  const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : '??';

  return (
    <div className="h-[calc(100vh-140px)] min-h-[500px] bg-white dark:bg-slate-900 md:rounded-[2.5rem] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex relative animate-in zoom-in-95 duration-500 font-sans transition-colors">
      
      {/* 1. LEFT SIDEBAR (Hidden on mobile if a contact is selected) */}
      <div className={`border-r border-slate-100 dark:border-slate-800 flex-col bg-white dark:bg-slate-900 shrink-0 transition-all duration-300 ${activeContact ? 'hidden md:flex' : 'flex'} w-full md:w-80`}>
        <div className="p-5 md:p-6">
          <div className="flex justify-between items-center mb-5 md:mb-6">
            <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Messages</h2>
            <button 
              onClick={handleOpenNewChat}
              className="p-2 bg-[var(--primary-color)] text-white rounded-xl hover:brightness-110 transition-all shadow-md active:scale-90"
            >
              <Plus size={18} strokeWidth={3} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} strokeWidth={3} />
            <input 
               type="text" 
               placeholder="Search chats..." 
               className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold focus:ring-2 ring-[var(--primary-color)]/20 outline-none text-slate-800 dark:text-white transition-colors" 
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4 custom-scrollbar">
          {loadingContacts ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-[var(--primary-color)]" /></div>
          ) : contacts.map((c, i) => (
            <div 
              key={i} 
              onClick={() => handleContactClick(c)}
              className={`p-3 rounded-[1.5rem] flex items-center gap-3 cursor-pointer transition-all ${activeContact?.contact_id === c.contact_id ? 'bg-[var(--primary-color)]/10 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            >
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary-color)]/20 dark:bg-slate-800 flex items-center justify-center font-black text-[var(--primary-color)] dark:text-white shrink-0 text-sm">
                {c.profile_image ? <img src={`/assets/uploads/${c.profile_image}`} className="w-full h-full object-cover rounded-2xl" alt="profile" /> : getInitials(c.contact_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-0.5">
                  <h4 className={`text-sm font-black truncate ${activeContact?.contact_id === c.contact_id ? 'text-[var(--primary-color)] dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>{c.contact_name}</h4>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">{c.display_time}</span>
                </div>
                <p className={`text-xs truncate ${!c.is_read && !c.is_you ? 'text-[var(--primary-color)] font-black' : 'text-slate-500 dark:text-slate-400 font-bold'}`}>
                  {c.is_you && "You: "}{c.last_message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. MAIN CHAT WINDOW (Hidden on mobile if NO contact is selected) */}
      <div className={`flex-1 flex-col bg-slate-50/40 dark:bg-slate-900/50 relative ${!activeContact ? 'hidden md:flex' : 'flex'} w-full transition-colors`}>
        {activeContact ? (
          <>
            {/* Header */}
            <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0 transition-colors">
              <div className="flex items-center gap-3 md:gap-4">
                 {/* MOBILE BACK BUTTON */}
                 <button 
                   onClick={() => { setActiveContact(null); setShowInfoPanel(false); }} 
                   className="md:hidden p-2 -ml-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                 >
                   <ArrowLeft size={20} strokeWidth={2.5} />
                 </button>
                 
                 <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-[var(--primary-color)] text-white flex items-center justify-center font-black text-sm border-2 border-[var(--primary-color)]/20 shrink-0">
                   {getInitials(activeContact.contact_name)}
                 </div>
                 <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-800 dark:text-white truncate">{activeContact.contact_name}</h3>
                    <p className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0"></span> 
                      <span className="truncate">{activeContact.contact_role}</span>
                    </p>
                 </div>
              </div>
              <div className="flex gap-0 md:gap-1 shrink-0">
                <button className="hidden sm:block p-2.5 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[var(--primary-color)] dark:hover:text-[var(--primary-color)] rounded-xl transition-all"><Phone size={18} strokeWidth={2.5} /></button>
                <button className="hidden sm:block p-2.5 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[var(--primary-color)] dark:hover:text-[var(--primary-color)] rounded-xl transition-all"><Video size={18} strokeWidth={2.5} /></button>
                
                {/* INFO BUTTON */}
                <button 
                  onClick={() => setShowInfoPanel(!showInfoPanel)}
                  className={`p-2.5 rounded-xl transition-all ${showInfoPanel ? 'bg-[var(--primary-color)]/10 text-[var(--primary-color)] dark:bg-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[var(--primary-color)] dark:hover:text-[var(--primary-color)]'}`}
                >
                  <Info size={18} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* Bubbles */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 custom-scrollbar">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.is_you ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] p-3.5 md:p-4 shadow-sm ${m.is_you ? 'bg-[var(--primary-color)] text-white rounded-2xl rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-none'}`}>
                    <p className="text-sm font-bold leading-relaxed">{m.text}</p>
                    <p className={`text-[9px] font-black mt-2 uppercase ${m.is_you ? 'text-white/60 text-right' : 'text-slate-300 dark:text-slate-500 text-left'}`}>{m.time}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 transition-colors">
               {userRole === 'student' && ['teacher', 'registrar', 'cashier', 'admin'].includes(activeContact.contact_role) && (
                 <div className="mb-3 px-3 py-2 md:px-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-xl flex items-center gap-2 animate-in fade-in duration-300">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0"></div>
                   <p className="text-[9px] md:text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-tight">
                     Note: Daily message limit applies for staff.
                   </p>
                 </div>
               )}

               <div className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] p-1.5 md:p-2 flex items-center gap-1 md:gap-2 focus-within:ring-4 ring-[var(--primary-color)]/10 transition-all">
                  <button className="hidden sm:block p-2 md:p-3 text-slate-400 dark:text-slate-500 hover:text-[var(--primary-color)] dark:hover:text-white transition-colors"><Paperclip size={20} strokeWidth={2.5} /></button>
                  <input 
                    type="text" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..." 
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-700 dark:text-white px-3 md:px-2" 
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[var(--primary-color)] text-white flex items-center justify-center shadow-lg shadow-slate-500/20 dark:shadow-none hover:brightness-110 transition-all active:scale-90 disabled:opacity-50 shrink-0"
                  >
                    <Send size={16} strokeWidth={2.5} className="md:w-[18px] md:h-[18px]" />
                  </button>
               </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 gap-4">
            <MessageSquare size={48} strokeWidth={2.5} className="opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest text-center px-4">Select a conversation to start</p>
          </div>
        )}
      </div>

      {/* 3. RIGHT SIDEBAR / MOBILE OVERLAY: MESSAGE INFO PANEL */}
      {activeContact && showInfoPanel && (
        <div className="absolute md:relative inset-0 md:inset-auto z-20 md:z-auto border-l border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0 animate-in slide-in-from-right duration-300 w-full md:w-72 transition-colors">
          
          {/* Mobile Close Button inside Info Panel */}
          <button 
            onClick={() => setShowInfoPanel(false)} 
            className="md:hidden absolute top-4 right-4 p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors z-10"
          >
            <X size={18} strokeWidth={3} />
          </button>

          <div className="p-8 text-center border-b border-slate-50 dark:border-slate-800 pt-12 md:pt-8">
            <div className="w-20 h-20 rounded-[1.5rem] bg-[var(--primary-color)]/10 dark:bg-slate-800 mx-auto mb-4 flex items-center justify-center text-2xl font-black text-[var(--primary-color)] dark:text-white shadow-inner">
               {getInitials(activeContact.contact_name)}
            </div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{activeContact.contact_name}</h3>
            <p className="text-[10px] font-black text-[var(--primary-color)] dark:text-[var(--primary-color)] mt-1 uppercase tracking-widest">{activeContact.contact_role}</p>
          </div>

          <div className="p-4 space-y-1">
            <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all group">
              <div className="flex items-center gap-3">
                <BellOff size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-[var(--primary-color)] dark:group-hover:text-white" />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Mute Notifications</span>
              </div>
              <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full relative">
                <div className="absolute left-1 top-1 w-2 h-2 bg-white dark:bg-slate-400 rounded-full"></div>
              </div>
            </button>

            {userRole === 'student' && ['teacher', 'registrar', 'cashier', 'admin'].includes(activeContact.contact_role) && (
              <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert size={14} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Chat Policy</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed">
                  To prevent spam, students are limited to a specific number of messages per day when contacting school staff.
                </p>
                <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50 flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase">Status</span>
                  <span className="text-[9px] font-black text-emerald-500 dark:text-emerald-400 uppercase bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">Active</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 pb-6 custom-scrollbar">
            <h4 className="px-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Shared Content</h4>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400"><ImageIcon size={16} /></div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Media</span>
              <span className="ml-auto text-[10px] font-black text-slate-300 dark:text-slate-600">0</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400"><FileText size={16} /></div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Documents</span>
              <span className="ml-auto text-[10px] font-black text-slate-300 dark:text-slate-600">0</span>
            </button>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400"><LinkIcon size={16} /></div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Links</span>
              <span className="ml-auto text-[10px] font-black text-slate-300 dark:text-slate-600">0</span>
            </button>
          </div>

        </div>
      )}

      {/* 4. NEW CHAT MODAL */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 border border-slate-100 dark:border-slate-800">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs ml-2">New Message</h3>
              <button onClick={() => setShowNewChatModal(false)} className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {availableContacts.map((c, i) => (
                <div key={i} onClick={() => startNewChat(c)} className="flex items-center gap-4 p-3.5 hover:bg-[var(--primary-color)]/5 dark:hover:bg-slate-800 rounded-[1.5rem] cursor-pointer transition-all border border-transparent hover:border-[var(--primary-color)]/20 dark:hover:border-slate-700 group">
                  <div className="w-10 h-10 rounded-xl bg-[var(--primary-color)]/10 dark:bg-slate-700 flex items-center justify-center font-black text-[var(--primary-color)] dark:text-white text-xs group-hover:scale-110 transition-transform shrink-0">
                    {getInitials(c.contact_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 dark:text-white truncate">{c.contact_name}</p>
                    <p className="text-[10px] font-black text-[var(--primary-color)] dark:text-[var(--primary-color)] uppercase tracking-widest">{c.contact_role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMessages;