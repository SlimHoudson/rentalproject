import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        if (!name || !email || !password || !confirmPassword) {
            setError('Semua kolom identitas wajib diisi');
            return;
        }
        if (password.length < 6) {
            setError('Password minimal harus terdiri dari 6 karakter');
            return;
        }
        if (password !== confirmPassword) {
            setError('Konfirmasi password tidak cocok');
            return;
        }

        setIsLoading(true);
        const result = await register(name, email, password);
        setIsLoading(false);

        if (result.success) {
            setSuccess('Akun berhasil dibuat! Mengalihkan ke halaman login...');
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 2500);
        } else {
            setError(result.message || 'Pendaftaran gagal. Silakan coba lagi.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-zinc-950">
            {/* Cinematic Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.15),transparent_50%)]"></div>
                <div className="absolute inset-0 bg-black/60"></div>
                <img 
                    src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2083&auto=format&fit=crop" 
                    alt="" 
                    className="w-full h-full object-cover mix-blend-overlay opacity-40 scale-110 animate-pulse-slow" 
                />
            </div>

            <main className="relative z-10 w-full max-w-6xl grid md:grid-cols-2 gap-20 items-center">
                {/* Left: Brand Context */}
                <div className="hidden md:block space-y-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-3xl bg-primary/20 backdrop-blur-2xl border border-primary/30 flex items-center justify-center shadow-2xl">
                                <span className="material-symbols-outlined text-3xl text-primary">auto_awesome</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tighter">Bahrayyan</h1>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Rental Mobil Premium</p>
                            </div>
                        </div>
                        <h2 className="text-6xl font-black text-white tracking-tighter leading-none">
                            Gabung Bersama <br />
                            <span className="text-primary italic">Kami.</span>
                        </h2>
                        <p className="text-zinc-400 text-lg max-w-sm leading-relaxed font-medium">
                            Daftarkan akun Anda dan nikmati akses eksklusif ke berbagai pilihan armada mobil mewah terbaik.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {[
                            { icon: 'verified', label: 'Terverifikasi' },
                            { icon: 'military_tech', label: 'Hak Istimewa' },
                            { icon: 'shield_moon', label: 'Aman & Terpercaya' },
                            { icon: 'auto_fix_high', label: 'Layanan Eksklusif' },
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

                {/* Right: Register Interface */}
                <div className="w-full max-w-md mx-auto">
                    <div className="bg-zinc-900/50 backdrop-blur-3xl border border-zinc-800 rounded-[3rem] p-10 shadow-2xl space-y-8">
                        <header className="space-y-2">
                            <h3 className="text-3xl font-black text-white tracking-tight">Daftar Akun</h3>
                            <p className="text-zinc-500 text-sm font-medium">Buat akun untuk memulai pemesanan armada.</p>
                        </header>

                        <form className="space-y-5" onSubmit={handleRegister}>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Nama Lengkap</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600">person</span>
                                    <input 
                                        type="text" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-14 pr-6 py-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                        placeholder="Nama Lengkap Anda"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Alamat Email</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600">mail</span>
                                    <input 
                                        type="email" 
                                        value={email} 
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-14 pr-6 py-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white outline-none focus:border-primary/50 transition-all font-bold text-sm"
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
                                        className="w-full pl-14 pr-14 py-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                        placeholder="Min. 6 karakter"
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

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Konfirmasi Kata Sandi</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600">lock_reset</span>
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        value={confirmPassword} 
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-14 pr-6 py-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white outline-none focus:border-primary/50 transition-all font-bold text-sm"
                                        placeholder="Ulangi kata sandi"
                                    />
                                </div>
                            </div>

                            {success && (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center gap-4 text-green-500 animate-slide-up">
                                    <span className="material-symbols-outlined">verified</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest">{success}</p>
                                </div>
                            )}

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
                                        <span>Daftar Sekarang</span>
                                        <span className="material-symbols-outlined text-base">arrow_right_alt</span>
                                    </>
                                )}
                            </button>
                        </form>

                        <footer className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                Sudah punya akun? {' '}
                                <button onClick={() => navigate('/login')} className="text-primary hover:opacity-80">Masuk di Sini</button>
                            </p>
                        </footer>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Register;
