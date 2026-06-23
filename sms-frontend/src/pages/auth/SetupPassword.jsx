import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff, ShieldCheck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SetupPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { branding, API_BASE_URL } = useAuth();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // STATE PARA SA EYE TOGGLE:
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);  

  // STATE PARA SA REDIRECT LOGIC
  const [portalType, setPortalType] = useState('student'); 

  if (!token || !email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-red-100">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Invalid Link</h2>
          <p className="text-slate-500 text-sm mb-6">Ang setup link na ito ay sira o hindi kumpleto.</p>
          <button onClick={() => navigate('/')} className="bg-slate-100 text-slate-600 font-bold py-3 px-6 rounded-xl text-sm">Bumalik sa Home</button>
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
      setError("Hindi magkapareho ang passwords.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/setup_password.php`, {
        email: email,
        token: token,
        password: password
      });

      if (response.data.success) {
        setPortalType(response.data.portal); 
        setSuccess(true);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Hindi makakonekta sa server.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-md w-full text-center border border-slate-100 animate-in zoom-in duration-500">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-100">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Setup Complete!</h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Ang iyong account ay <b>Verified</b> na bilang <b>{portalType.toUpperCase()}</b>. Maaari ka nang mag-login.
          </p>
          
          <button 
            onClick={() => navigate(portalType === 'student' ? '/login' : '/staff/login')} 
            className="w-full py-4 text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95"
            style={{ backgroundColor: branding.theme_color || '#2563eb' }}
          >
            Pumunta sa {portalType === 'student' ? 'Student' : 'Staff'} Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full">
         <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl" style={{ backgroundColor: branding.theme_color || '#2563eb' }}>
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Set Your Password</h2>
            <p className="text-slate-500 text-sm mt-2">I-secure ang iyong account para sa <b>{email}</b></p>
         </div>
         
         <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
               
               {/* NEW PASSWORD INPUT */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">New Password</label>
                  <div className="relative group">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      required 
                      className="block w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold" 
                      placeholder="Minimum 6 characters" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-blue-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
               </div>

               {/* CONFIRM PASSWORD INPUT */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Confirm Password</label>
                  <div className="relative group">
                    {/* Note: Inayos ko ang type dito para gumamit ng showConfirmPassword */}
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      required 
                      className="block w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-all text-sm font-bold" 
                      placeholder="Repeat password" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-blue-500 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
               </div>

               {error && <div className="text-red-500 text-xs font-bold text-center">⚠️ {error}</div>}
               
               <button 
                type="submit" 
                disabled={loading} 
                className="w-full text-white font-black py-4 rounded-2xl shadow-xl transition-all disabled:opacity-50" 
                style={{ backgroundColor: branding.theme_color || '#2563eb' }}
               >
                  {loading ? (
                    <span className="flex items-center justify-center space-x-2">
                      <Loader2 size={18} className="animate-spin" />
                      <span>Saving...</span>
                    </span>
                  ) : "Secure My Account"}
               </button>
            </form>
         </div>
      </div>
    </div>
  );
};

export default SetupPassword;