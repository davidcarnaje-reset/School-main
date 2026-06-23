import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff, KeyRound, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { branding, API_BASE_URL } = useAuth();
  
  // Kunin ang token at email mula sa URL
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Kung walang token o email sa URL
  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Invalid Link</h2>
          <p className="text-slate-500 text-sm mb-6">Ang password reset link na ito ay sira o hindi kumpleto. Mangyaring mag-request ulit ng panibagong link.</p>
          <button onClick={() => navigate('/forgot-password')} className="bg-slate-100 text-slate-600 font-bold py-3 px-6 rounded-xl text-sm hover:bg-slate-200">Request New Link</button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError("Ang password ay dapat may hindi bababa sa 6 na characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Hindi magkapareho ang passwords. Subukan muli.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/reset_password.php`, {
        token: token,
        password: password
      });

      if (response.data.success) {
        setSuccess(true);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Hindi makakonekta sa server. Subukan ulit mamaya.");
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS UI
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-slate-100 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Password Reset Successful!</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Ang iyong password ay matagumpay na nabago. Maaari mo na itong magamit sa pag-login.
          </p>
          <button 
            onClick={() => navigate('/login')} 
            className="w-full py-4 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95"
            style={{ backgroundColor: branding.theme_color || '#2563eb' }}
          >
            Pumunta sa Login
          </button>
        </div>
      </div>
    );
  }

  // MAIN FORM UI
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl"
            style={{ backgroundColor: branding.theme_color || '#2563eb' }}
          >
            <KeyRound size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Create New Password</h2>
          <p className="text-slate-500 text-sm mt-2">I-reset ang password para sa <b>{email}</b></p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">New Password</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300">
                  <Lock size={18} />
                </span>
                <input 
                  type={showPassword ? "text" : "password"} required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                  placeholder="Minimum 6 characters"
                />
                <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-blue-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Confirm New Password</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300">
                  <Lock size={18} />
                </span>
                <input 
                  type={showPassword ? "text" : "password"} required
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all text-sm font-bold"
                  placeholder="Ulitin ang password"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl animate-in fade-in zoom-in duration-300">
                <p className="text-xs text-red-600 font-bold flex items-center justify-center text-center">
                   ⚠️ {error}
                </p>
              </div>
            )}

            <button 
              type="submit" disabled={loading}
              className="shine-effect w-full text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
              style={{ backgroundColor: branding.theme_color || '#2563eb' }}
            >
              {loading ? <><Loader2 size={18} className="animate-spin" /><span>Saving...</span></> : <span>Change Password</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;