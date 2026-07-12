import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GraduationCap, Users, ShieldCheck, ArrowRight, ArrowLeft, Menu, X, ChevronLeft, ChevronRight, CheckCircle, Search, School, Compass, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { branding, API_BASE_URL, getLogoUrl, fetchBranding } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ==========================================
  // 1. STATES
  // ==========================================
  const [promotions, setPromotions] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Multi-Tenant States
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [selectedSchoolId, setSelectedSchoolId] = useState(localStorage.getItem('selected_school_id'));
  const [searchTerm, setSearchTerm] = useState('');

  // ==========================================
  // 2. FETCH ACTIVE SCHOOLS
  // ==========================================
  const fetchActiveSchools = async () => {
    try {
      setLoadingSchools(true);
      const res = await axios.get(`${API_BASE_URL}/schools/public`);
      if (res.data.success) {
        setSchools(res.data.schools);
      }
    } catch (error) {
      console.error("Error fetching public schools:", error);
    } finally {
      setLoadingSchools(false);
    }
  };

  // ==========================================
  // 3. FETCH PROMOTIONS
  // ==========================================
  const fetchPromotions = async (schoolId) => {
    try {
      const activeId = schoolId || selectedSchoolId || 1;
      const res = await axios.get(`${API_BASE_URL}/public/promotions?school_id=${activeId}`);
      if (res.data.success) {
        const formattedPromos = res.data.promotions.map(promo => ({
          id: promo.id,
          image: promo.image_file && promo.image_file.startsWith('http') ? promo.image_file : `${API_BASE_URL}/uploads/promotions/${promo.image_file}`,
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
    if (!selectedSchoolId) {
      fetchActiveSchools();
    } else {
      fetchPromotions(selectedSchoolId);
    }
  }, [selectedSchoolId]);

  // ==========================================
  // 4. CAROUSEL AUTO-PLAY
  // ==========================================
  useEffect(() => {
    if (promotions.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev === promotions.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [promotions.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === promotions.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? promotions.length - 1 : prev - 1));

  // ==========================================
  // 5. CAMPUS SELECTION HANDLERS
  // ==========================================
  const handleSelectCampus = (school) => {
    localStorage.setItem('selected_school_id', school.id);
    setSelectedSchoolId(school.id);
    fetchBranding(school.id);
    fetchPromotions(school.id);
  };

  const handleChangeCampus = () => {
    localStorage.removeItem('selected_school_id');
    setSelectedSchoolId(null);
    fetchActiveSchools();
  };

  // Filter schools based on search
  const filteredSchools = schools.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==========================================
  // RENDER CAMPUS SELECTOR (No Campus Selected)
  // ==========================================
  if (!selectedSchoolId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans">
        <div className="max-w-2xl w-full text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 text-blue-600 rounded-3xl mb-4">
            <School size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-none">
            Select Your Campus
          </h1>
          <p className="text-slate-500 font-medium mt-3 text-base">
            Maging bahagi ng aming lumalaking pamilya. Piliin ang iyong campus upang magpatuloy sa portal.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-md mx-auto relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-blue-600 transition-colors">
              <Search size={18} />
            </span>
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Maghanap ng School Campus..."
              className="block w-full pl-11 pr-4 py-4 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 shadow-xl shadow-slate-100/50 outline-none transition-all text-sm font-bold"
            />
          </div>
        </div>

        {loadingSchools ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="animate-spin mb-3" size={32} />
            <p className="text-xs font-bold uppercase tracking-widest">Hinahanap ang mga campus...</p>
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-100 shadow-xl max-w-md w-full">
            <Compass className="mx-auto text-slate-300 mb-4 animate-pulse" size={50} />
            <h3 className="text-lg font-bold text-slate-800">Walang Campus na Nahanap</h3>
            <p className="text-slate-500 text-sm mt-2">Pakisuri ang iyong search term o subukan ulit mamaya.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl w-full">
            {filteredSchools.map((school) => (
              <div 
                key={school.id}
                onClick={() => handleSelectCampus(school)}
                className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-xl shadow-slate-100/50 cursor-pointer hover:shadow-2xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 flex items-center gap-5 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100 shadow-inner group-hover:scale-105 transition-transform">
                  {school.logo ? (
                    <img src={getLogoUrl(school.logo)} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-black text-xl" style={{ backgroundColor: school.theme_color || '#2563eb' }}>
                      {school.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400" style={{ color: school.theme_color }}>Official Campus</p>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight mt-0.5 line-clamp-2">{school.name}</h3>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <ArrowRight size={18} className="text-slate-400 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-12 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} SMS Portal Network. Secure Platform.
        </p>
      </div>
    );
  }

  // ==========================================
  // RENDER LANDING PAGE (Campus Selected)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-[100] shadow-sm animate-in fade-in duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {branding.school_logo && (
              <img 
                src={getLogoUrl(branding.school_logo)} 
                className="h-9 w-9 object-contain" 
                alt="Logo" 
              />
            )}
            <div className="flex flex-col gap-1.5">
              <span className="font-black text-base md:text-xl text-slate-800 tracking-tighter uppercase leading-none">
                {branding.school_name}
              </span>
              <button 
                onClick={handleChangeCampus}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 hover:text-slate-800 border border-slate-200 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-wider transition-all outline-none cursor-pointer self-start shadow-sm"
              >
                <ArrowLeft size={10} strokeWidth={3} />
                <span>Change Campus</span>
              </button>
            </div>
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
            <button 
              onClick={handleChangeCampus}
              className="block w-full text-left text-sm font-black text-blue-600 py-2 border-t pt-4 mt-2"
            >
              Change Campus
            </button>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <main className="flex-grow flex items-center justify-center p-6 md:p-12 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          
          {/* LEFT SIDE: DYNAMIC CONDITIONAL RENDERING */}
          <div className="w-full flex flex-col justify-center min-h-[400px] lg:min-h-[500px]">
            
            {promotions.length > 0 ? (
              // Carousel
              <div className="relative w-full h-[400px] lg:h-[500px] rounded-[3rem] overflow-hidden shadow-2xl group border border-slate-100 bg-slate-900">
                
                {promotions.map((promo, index) => (
                  <div 
                    key={promo.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent flex flex-col justify-end p-10">
                      <h2 className="text-3xl lg:text-4xl font-black text-white mb-2 leading-tight">{promo.title}</h2>
                      <p className="text-slate-200 font-medium mb-6 max-w-sm">{promo.subtitle}</p>
                      {promo.buttonText && (
                        <button 
                          onClick={() => navigate(promo.buttonLink)} 
                          className="w-max px-6 py-3 bg-white font-black rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg text-sm"
                          style={{ color: branding.theme_color || '#2563eb' }}
                        >
                          {promo.buttonText}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Arrows and Dots */}
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
              // Default Text
              <div className="space-y-6">
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Official Campus Portal</span>
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
          <div className="flex justify-center lg:justify-end w-full">
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