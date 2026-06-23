import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, User, Eye, EyeOff, ShieldCheck, Loader2, GraduationCap, Users, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Login = ({ portal }) => {
  const navigate = useNavigate();
  
  // ARCHITECT UPDATE 1: Kinuha na natin ang API_BASE_URL mula sa .env config natin
  const { setUser, branding, API_BASE_URL } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const portalConfig = {
    admin: {
      title: 'Admin Portal',
      label: 'Admin Username',
      icon: <ShieldCheck size={40} />,
      bgColor: 'bg-slate-900',
      description: 'System-wide configuration & oversight'
    },
    staff: {
      title: 'Staff Portal',
      label: 'Staff Username',
      icon: <Users size={40} />,
      bgColor: branding.theme_color || '#2563eb',
      description: 'Registrar, Cashier, & Personnel access'
    },
    student: {
      title: 'Student Portal',
      label: 'Student ID Number',
      icon: <GraduationCap size={40} />,
      bgColor: '#059669',
      description: 'Access your grades and school records'
    }
  };

  const current = portalConfig[portal] || portalConfig.staff;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // ARCHITECT UPDATE 2: Hindi na hardcoded ang localhost! Nakaturo na rin sa /auth folder
      const response = await axios.post(`${API_BASE_URL}/auth/login.php`, {
        username: identifier,
        password: password,
        portal: portal
      });

      if (response.data.success) {
        // ARCHITECT UPDATE 3: I-save natin ang SECURE TOKEN sa browser!
        localStorage.setItem('sms_token', response.data.token);
        
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user); 
        
        const role = response.data.user.role;
        // Gawing lowercase ang role para saktong mag-match sa routes mo (e.g. /admin/dashboard)
        navigate(`/${role.toLowerCase()}/dashboard`);
      } else {
        setError(response.data.message); 
      }
    } catch (err) {
      console.error(err);
      setError("Connection failed. Server might be down.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      
      <button 
        onClick={() => navigate('/')}
        className="mb-8 flex items-center space-x-2 text-slate-400 hover:text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all"
      >
        <ArrowLeft size={14} />
        <span>Back to Website</span>
      </button>

      <div className="max-w-md w-full">
        
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center mb-4">
            <div 
              className="w-20 h-20 rounded-[2rem] flex items-center justify-center text-white shadow-2xl transition-all duration-500"
              style={{ backgroundColor: portal === 'admin' ? '#1e293b' : (portal === 'student' ? '#059669' : (branding.theme_color || '#2563eb')) }}
            >
              {current.icon}
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {current.title}
          </h2>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 opacity-60">
            {branding.school_name}
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 p-8 md:p-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: portal === 'admin' ? '#1e293b' : (portal === 'student' ? '#059669' : (branding.theme_color || '#2563eb')) }}></div>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{current.label}</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300 group-focus-within:text-blue-500 transition-colors">
                  <User size={18} />
                </span>
                <input 
                  type="text" required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold"
                  placeholder={portal === 'student' ? "e.g. 2026-0001" : "Enter username"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Password</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-300 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </span>
                <input 
                  type={showPassword ? "text" : "password"} required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-11 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-bold"
                  placeholder="••••••••"
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

            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl animate-in fade-in zoom-in duration-300">
                <p className="text-xs text-red-600 font-bold flex items-center justify-center italic text-center leading-relaxed">
                    ⚠️ {error}
                </p>
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="shine-effect w-full text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2 uppercase tracking-widest text-xs"
              style={{ 
                backgroundColor: portal === 'admin' ? '#1e293b' : (portal === 'student' ? '#059669' : (branding.theme_color || '#2563eb')),
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Verifying Account...</span>
                </>
              ) : (
                <span>Authorize & Login</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center animate-in fade-in duration-500">
            <button 
              type="button" 
              onClick={() => navigate('/forgot-password')}
              className="text-[10px] font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-widest relative group inline-flex flex-col items-center"
            >
              <span>Forgot Password?</span>
              <span className="w-0 h-[1px] bg-blue-600 group-hover:w-full transition-all duration-300 mt-0.5"></span>
            </button>
          </div>

        </div>

        <p className="text-center mt-10 text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] opacity-40">
          SECURED BY SMS TECHNOLOGY
        </p>
      </div>
    </div>
  );
};

export default Login;