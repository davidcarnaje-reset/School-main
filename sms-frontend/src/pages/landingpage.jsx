import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, Users, ShieldCheck, ArrowRight, Menu, X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { branding, API_BASE_URL } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ==========================================
  // 1. STATES
  // ==========================================
  const [promotions, setPromotions] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0); // 👈 ITO YUNG NAWALA KANINA

  // ==========================================
  // 2. FETCH DATA FROM PHP API
  // ==========================================
  const fetchPromotions = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/public/get_promotions.php`);
      if (res.data.success) {
        // I-format ang data para madaling gamitin sa UI
        const formattedPromos = res.data.promotions.map(promo => ({
          id: promo.id,
          image: `${API_BASE_URL}/uploads/promotions/${promo.image_file}`,
          title: promo.title,
          subtitle: promo.subtitle,
          buttonText: promo.button_text,
          buttonLink: promo.button_link || '/login'
        }));
        setPromotions(formattedPromos);
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // ==========================================
  // 3. CAROUSEL LOGIC
  // ==========================================
  useEffect(() => {
    // Kapag 1 lang o walang picture, wag na mag-auto-play
    if (promotions.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === promotions.length - 1 ? 0 : prev + 1));
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, [promotions.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === promotions.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? promotions.length - 1 : prev - 1));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-[100] shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {branding.school_logo && (
              <img 
                src={`${API_BASE_URL}/uploads/branding/${branding.school_logo}`} 
                className="h-9 w-9 object-contain" 
                alt="Logo" 
              />
            )}
            <span className="font-black text-xl text-slate-800 tracking-tighter uppercase">
              {branding.school_name}
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Home</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Admissions</a>
            <a href="#" className="hover:text-blue-600 transition-colors">About Us</a>
          </div>

          <button 
            className="md:hidden p-2 text-slate-600" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-slate-200 p-6 space-y-4 md:hidden animate-in slide-in-from-top-2 duration-200">
            <a href="#" className="block text-sm font-bold text-slate-600 py-2">Home</a>
            <a href="#" className="block text-sm font-bold text-slate-600 py-2">Admissions</a>
            <a href="#" className="block text-sm font-bold text-slate-600 py-2">About Us</a>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <main className="flex-grow flex items-center justify-center p-6 md:p-12 overflow-hidden">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* LEFT SIDE: DYNAMIC CONDITIONAL RENDERING */}
          <div className="w-full flex flex-col justify-center min-h-[400px] lg:min-h-[500px] animate-in fade-in slide-in-from-left-8 duration-700">
            
            {promotions.length > 0 ? (
              // 🟢 MAY LAMAN SA DATABASE: Ipakita ang Carousel
              <div className="relative w-full h-[400px] lg:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl group border border-slate-100">
                
                {promotions.map((promo, index) => (
                  <div 
                    key={promo.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-end p-10">
                      <h2 className="text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">{promo.title}</h2>
                      <p className="text-slate-200 font-medium mb-6 max-w-sm">{promo.subtitle}</p>
                      {promo.buttonText && (
                        <button 
                          onClick={() => navigate(promo.buttonLink)} 
                          className="w-max px-6 py-3 bg-white text-slate-900 font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg text-sm"
                          style={{ color: branding.theme_color || '#2563eb' }}
                        >
                          {promo.buttonText}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Mga Arrow at Dots (Lalabas lang kung 2+ ang pictures) */}
                {promotions.length > 1 && (
                  <>
                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                      {promotions.map((_, index) => (
                        <button 
                          key={index} 
                          onClick={() => setCurrentSlide(index)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${index === currentSlide ? 'bg-white w-6 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              // 🔴 WALANG LAMAN SA DATABASE: Ipakita ang Default Text
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Official School Portal</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter text-slate-800">
                  Your Future <br/>Starts <span style={{ color: branding.theme_color || '#2563eb' }}>Here.</span>
                </h2>
                <p className="text-slate-500 text-lg max-w-md leading-relaxed">
                  Experience a modern way of learning. Access your student records and school resources anywhere, anytime.
                </p>
              </div>
            )}
          </div>

          {/* RIGHT SIDE: PORTAL SELECTION CARD */}
          <div className="animate-in fade-in slide-in-from-right-8 duration-700 flex justify-center lg:justify-end w-full">
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100 w-full max-w-md">
              <div className="mb-8 text-center lg:text-left">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Access Your Portal</h3>
                <p className="text-slate-400 text-sm font-medium">Select your account type to continue.</p>
              </div>

              <div className="space-y-4">
                <button onClick={() => navigate('/login')} className="group w-full p-6 bg-blue-50 hover:bg-blue-600 border border-blue-100 rounded-[2rem] flex items-center justify-between transition-all duration-300 active:scale-[0.98]">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform"><GraduationCap size={24} /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 group-hover:text-blue-100">Portal Access</p>
                      <p className="text-lg font-black text-slate-800 group-hover:text-white leading-none">Student Portal</p>
                    </div>
                  </div>
                  <ArrowRight className="text-blue-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>

                <button onClick={() => navigate('/staff/login')} className="group w-full p-6 bg-slate-50 hover:bg-slate-800 border border-slate-200 rounded-[2rem] flex items-center justify-between transition-all duration-300 active:scale-[0.98]">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-600 shadow-sm group-hover:scale-110 transition-transform"><Users size={24} /></div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-300">Staff Access</p>
                      <p className="text-lg font-black text-slate-800 group-hover:text-white leading-none">Staff Portal</p>
                    </div>
                  </div>
                  <ArrowRight className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="p-8 text-center border-t border-slate-100 bg-white">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          &copy; {new Date().getFullYear()} {branding.school_name}. Powered by SMS Technology.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;