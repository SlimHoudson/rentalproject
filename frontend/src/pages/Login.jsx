import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email dan kata sandi tidak boleh kosong');
      return;
    }
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      if (from) {
        navigate(from, { replace: true });
      } else if (result.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError(result.message || 'Email atau password salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-zinc-950">
      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black/75"></div>
        <img 
          src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=2070&auto=format&fit=crop" 
          alt="" 
          className="w-full h-full object-cover opacity-20" 
          loading="eager"
        />
      </div>

      <main className="relative z-10 w-full max-w-6xl grid md:grid-cols-2 gap-20 items-center">
        {/* Left: Brand Context */}
        <div className="hidden md:block space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-3xl text-primary">auto_awesome</span>
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tighter">Bahrayyan</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Rental Mobil Premium</p>
              </div>
            </div>
            <h2 className="text-6xl font-black text-white tracking-tighter leading-none">
              Kemewahan <br />
              <span className="text-primary italic">Tanpa Batas.</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-sm leading-relaxed font-medium">
              Akses armada mobil mewah paling prestisius dengan kenyamanan dan layanan terbaik.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { icon: 'speed', label: 'Pemesanan Instan' },
              { icon: 'security', label: 'Proteksi Premium' },
              { icon: 'support_agent', label: 'Layanan 24/7' },
              { icon: 'diamond', label: 'Armada Eksklusif' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                  <span className="material-symbols-outlined text-primary text-xl">{item.icon}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login Interface */}
        <div className="w-full max-w-md mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-10 shadow-2xl space-y-10">
            <header className="space-y-2">
              <h3 className="text-3xl font-black text-white tracking-tight">Selamat Datang</h3>
              <p className="text-zinc-500 text-sm font-medium">Masuk untuk mengakses layanan rental mobil.</p>
            </header>

            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Alamat Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600">mail</span>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white outline-none focus:border-primary/50 transition-all font-bold text-sm"
                    placeholder="nama@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Kata Sandi</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600">lock</span>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-14 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white outline-none focus:border-primary/50 transition-all font-bold text-sm"
                    placeholder="••••••••"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                  >
                    <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-500 hover:text-zinc-300">
                  <input type="checkbox" className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 accent-primary" />
                  <span>Ingat Saya</span>
                </label>
                <a href="#" className="text-primary hover:opacity-80">Lupa Password?</a>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-4 text-destructive animate-shake">
                  <span className="material-symbols-outlined">report</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-5 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Masuk Sekarang</span>
                    <span className="material-symbols-outlined text-base">arrow_right_alt</span>
                  </>
                )}
              </button>
            </form>

            <footer className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                Belum punya akun? {' '}
                <button onClick={() => navigate('/register')} className="text-primary hover:opacity-80">Daftar Akun Baru</button>
              </p>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
