import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);
  
  const navigate = useNavigate();
  const { branding, API_BASE_URL } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot_password.php`, { email });
      
      if (response.data.success) {
        setIsSent(true);
        setMessage(response.data.message);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      
      <button 
        onClick={() => navigate('/login')}
        className="mb-8 flex items-center space-x-2 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all"
      >
        <ArrowLeft size={14} />
        <span>Back to Login</span>
      </button>

      <div className="max-w-md w-full">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-4 shadow-xl transition-all"
               style={{ backgroundColor: branding.theme_color || '#2563eb' }}>
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Forgot Password?</h2>
          <p className="text-slate-500 text-sm mt-2">Enter your registered email to reset your password.</p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8">
          {isSent ? (
            <div className="text-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Check your Inbox</h3>
              <p className="text-slate-500 text-sm mb-6">{message}</p>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all text-sm"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Email Address</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} />
                  </span>
                  <input 
                    type="email" required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                    placeholder="e.g. juan@school.edu"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl animate-in fade-in zoom-in duration-300">
                  <p className="text-xs text-red-600 font-bold text-center">⚠️ {error}</p>
                </div>
              )}

              <button 
                type="submit" disabled={loading}
                className="shine-effect w-full text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
                style={{ backgroundColor: branding.theme_color || '#2563eb' }}
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /><span>Sending...</span></> : <span>Send Reset Link</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;