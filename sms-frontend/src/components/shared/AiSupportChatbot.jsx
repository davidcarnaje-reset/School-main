import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, X, Send, HelpCircle, ChevronRight, RefreshCw, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

const AiSupportChatbot = ({ themeColor = '#2563eb' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Magandang araw! Ako ang iyong AI Assistant. Pumili ng katanungan sa mga popular na paksa sa ibaba o mag-type ng iyong concern para matulungan kita agad.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  // Frequently Asked Questions & Preset Error Solutions
  const faqCategories = [
    {
      category: '⏱️ DTR & Attendance Concerns',
      issues: [
        {
          q: 'Bakit ayaw mag-Time In / GPS Location Error?',
          a: 'Siguraduhing naka-ON ang Location/GPS ng iyong browser o CP at naka-Allow ang location permission sa browser site settings. Kung nakapag-Time In ka na ngayong umaga, awtomatikong TIME OUT button na lamang ang magiging active.'
        },
        {
          q: 'Paano kinukwenta ang Late & Early Time-Out?',
          a: 'Awtomatikong inihahambing ng system ang oras ng iyong Time In laban sa iyong Shift Schedule (halimbawa 8:00 AM - 5:00 PM). Kapag lumagpas ka sa shift start time, magre-reflect ang eksaktong minuto kung ilang minutes ka late.'
        },
        {
          q: 'Nakalimutan mag-Time Out sa hapon?',
          a: 'Maaari kang mag-submit ng Time Adjustment request sa "File A Request" tab o direkta sa DTR & Timesheet tab para maayos ng HR Director ang iyong clock log.'
        }
      ]
    },
    {
      category: '💵 Payroll & Payslip Queries',
      issues: [
        {
          q: 'Saan makikita at mai-download ang Payslip?',
          a: 'Pumunta sa "Payslip History" tab sa iyong Employee Portal. Makikita rito ang lahat ng iyong monthly payroll releases at maaari mo itong i-view o i-download.'
        },
        {
          q: 'May mali sa Gross Pay o Deductions?',
          a: 'Para sa anumang salary adjustment o statutory deduction concern (SSS, PhilHealth, Pag-IBIG), mag-file ng inquiry sa Cashier/Payroll Support tab.'
        }
      ]
    },
    {
      category: '📄 201 File & Personal Records',
      issues: [
        {
          q: 'Paano mag-download ng 201 File PDF?',
          a: 'Pumunta sa "My Personal Tab" sa Employee Portal o sa HR Personnel Folders, at i-click ang "Download 201 File" button upang mag-generate ng opisyal na Employment Application Form A.'
        },
        {
          q: 'Paano mag-update ng SSS, PhilHealth, o Contact Info?',
          a: 'Ipaalam sa HR Administrator sa pamamagitan ng pag-edit ng iyong profile sa Employee Information System (EIS) o mag-submit ng request sa Filing tab.'
        }
      ]
    },
    {
      category: '📝 Filings & Approvals',
      issues: [
        {
          q: 'Paano mag-file ng Leave o Overtime?',
          a: 'Pumunta sa "File A Request" tab, piliin ang Request Type (Leave, Overtime, Official Business), ilagay ang petsa at dahilan, tsaka i-click ang Submit.'
        },
        {
          q: 'Bakit Pending pa rin ang aking Request?',
          a: 'Ang mga requests ay dumadaan sa Approvals Queue ng iyong Department Head at HR Director. Pagka-approve nito, makakatanggap ka agad ng portal notification.'
        }
      ]
    }
  ];

  const handleSendMessage = (customText = null) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsTyping(true);

    // AI Response Logic based on keywords
    setTimeout(() => {
      let botResponse = getAiResponse(textToSend);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  };

  const getAiResponse = (query) => {
    const lower = query.toLowerCase();

    if (lower.includes('time in') || lower.includes('clock in') || lower.includes('gps') || lower.includes('location') || lower.includes('geofence')) {
      return 'Para sa Time In concerns: Siguraduhing naka-enable ang GPS/Location ng browser at naroroon sa loob ng campus radius. Kung nakapag-Time In ka na ngayong araw, ang TIME OUT button na ang lalabas.';
    }
    if (lower.includes('late') || lower.includes('early') || lower.includes('shift') || lower.includes('schedule')) {
      return 'Awtomatikong inihahambing ng DTR engine ang iyong clock time sa itinakdang Shift Schedule. Ang late minutes o early time-out minutes ay malinaw na ipinapakita sa iyong confirmation alert at attendance log history.';
    }
    if (lower.includes('payslip') || lower.includes('sweldo') || lower.includes('payroll') || lower.includes('salary')) {
      return 'Makikita ang iyong payslips sa "Payslip History" tab. Maaari mo ring suriin ang iyong statutory contributions (SSS, PhilHealth, Pag-IBIG) at net take-home pay.';
    }
    if (lower.includes('201') || lower.includes('form a') || lower.includes('download') || lower.includes('pdf')) {
      return 'I-click lamang ang "Download 201 File" button sa "My Personal Tab" upang makakuha ng kumpleto at printable na Employment Application Form A (201 File PDF).';
    }
    if (lower.includes('leave') || lower.includes('filing') || lower.includes('request') || lower.includes('overtime')) {
      return 'Pumunta sa "File A Request" tab upang mag-submit ng Leave Application, Overtime Claim, o Time Adjustment. Awtomatiko itong ipapadala sa Approvals Queue ng HR.';
    }

    return 'Salamat sa iyong mensahe! Maaari mong piliin ang alinman sa mga quick guide buttons sa itaas para sa mabilisang sagot, o makipag-ugnayan sa HR Administrator para sa iba pang mga tulong.';
  };

  return (
    <>
      {/* FLOATING CHATBOT BUTTON (Bottom-Right) */}
      <div className="fixed bottom-6 right-6 z-[999]">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group border-2 border-white/40 cursor-pointer relative"
            style={{ backgroundColor: themeColor }}
            title="AI Support Assistant & Help Desk"
          >
            <Bot size={28} className="group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
          </button>
        )}
      </div>

      {/* CHATBOT DRAWER MODAL */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[1000] w-[90vw] sm:w-[390px] h-[540px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-300 font-sans">
          
          {/* HEADER */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                <Sparkles size={20} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-wide leading-tight">AI Help Desk & Support</h3>
                <p className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online Assistant
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* MESSAGES CONTAINER */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            
            {/* MESSAGES */}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none font-bold'
                      : 'bg-white text-slate-800 border border-slate-150 rounded-bl-none'
                  }`}
                  style={m.sender === 'user' ? { backgroundColor: themeColor } : {}}
                >
                  {m.text}
                </div>
                <span className="text-[9px] text-slate-400 font-bold mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs font-bold bg-white p-3 rounded-2xl border border-slate-100 w-fit animate-pulse">
                <Bot size={14} className="text-blue-600" /> AI Assistant is typing...
              </div>
            )}

            {/* QUICK PRESET TROUBLESHOOTING CATEGORIES */}
            <div className="pt-2 space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <HelpCircle size={12} /> Popular Support Topics & Error Solutions:
              </p>
              {faqCategories.map((cat, cIdx) => (
                <div key={cIdx} className="bg-white rounded-2xl border border-slate-100 p-2.5 space-y-1.5 shadow-sm">
                  <p className="text-[11px] font-black text-slate-700">{cat.category}</p>
                  <div className="space-y-1">
                    {cat.issues.map((iss, iIdx) => (
                      <button
                        key={iIdx}
                        onClick={() => handleSendMessage(iss.q)}
                        className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-bold text-slate-600 transition-colors flex items-center justify-between group cursor-pointer border border-transparent hover:border-blue-200"
                      >
                        <span>{iss.q}</span>
                        <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT BAR */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
          >
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your concern or error here..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:border-blue-500 font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
              style={{ backgroundColor: themeColor }}
            >
              <Send size={16} />
            </button>
          </form>

        </div>
      )}
    </>
  );
};

export default AiSupportChatbot;
