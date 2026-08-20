import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' });
  const [activeSection, setActiveSection] = useState('account'); 
  const [changePassword, setChangePassword] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setChangePassword({ ...changePassword, [e.target.name]: e.target.value });

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const result = await updateUser(formData);
      if (result.success) {
        showMessage('Profil berhasil diperbarui');
      } else {
        showMessage(result.message || 'Gagal memperbarui profil', 'error');
      }
    } catch (err) {
      showMessage('Terjadi kesalahan saat memperbarui profil', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (changePassword.new !== changePassword.confirm) {
      showMessage('Konfirmasi password baru tidak cocok', 'error');
      return;
    }
    setIsUpdating(true);
    try {
      await api.put('/auth/change-password', { 
        oldPassword: changePassword.current, 
        newPassword: changePassword.new 
      });
      showMessage('Password berhasil diperbarui');
      setChangePassword({ current: '', new: '', confirm: '' });
    } catch (err) {
      showMessage(err.message || 'Gagal mengubah password', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (user) {
      setFormData({ 
        name: user.name || '', 
        email: user.email || '', 
        phone: user.phone || '', 
        address: user.address || '' 
      });
    }
  }, [user]);

  return (
    <div className="p-6 lg:p-12 space-y-12 animate-fade-in max-w-4xl mx-auto">
      <header>
        <h2 className="text-4xl font-black tracking-tight text-foreground">Pengaturan Akun</h2>
        <p className="text-muted-foreground mt-2">Kelola profil pribadi dan keamanan akun Anda.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Loyalty Card & Navigation */}
        <div className="md:col-span-5 space-y-6">
          <div className="relative group overflow-hidden rounded-[2.5rem] p-8 text-white shadow-2xl transition-all hover:scale-[1.02]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-primary"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Status Keanggotaan</p>
                  <p className="text-xl font-black italic tracking-wider uppercase">Member Platinum</p>
                </div>
                <span className="material-symbols-outlined text-3xl opacity-50">hotel_class</span>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Poin Loyalitas Tersedia</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-5xl font-black tracking-tighter">{(user?.points || 0).toLocaleString('id-ID')}</h3>
                  <span className="text-xs font-black uppercase tracking-widest opacity-80">Poin</span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/20">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span>Keuntungan Eksklusif</span>
                  <span className="text-white/60">Terverifikasi</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="px-3 py-1.5 bg-white/10 rounded-lg text-[9px] font-black uppercase border border-white/10">Diskon Rental 10%</div>
                  <div className="px-3 py-1.5 bg-white/10 rounded-lg text-[9px] font-black uppercase border border-white/10">Layanan Prioritas</div>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-2 p-2 bg-muted/30 border border-border rounded-3xl">
            {[
              { id: 'account', label: 'Informasi Umum', icon: 'account_circle' },
              { id: 'security', label: 'Keamanan & Sandi', icon: 'shield_lock' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeSection === item.id ? 'bg-card text-primary shadow-lg border border-border' : 'text-muted-foreground hover:bg-muted/50'}`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-7">
          {message.text && (
            <div className={`p-5 rounded-2xl mb-8 flex items-center gap-4 animate-slide-down border ${
              message.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'
            }`}>
              <span className="material-symbols-outlined">{message.type === 'success' ? 'verified_user' : 'error'}</span>
              <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
            </div>
          )}

          <div className="card">
            {activeSection === 'account' ? (
              <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nama Lengkap</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" placeholder="Masukkan nama lengkap" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Alamat Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="input" placeholder="contoh@email.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">No. WhatsApp / HP</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="input" placeholder="+62 8..." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Alamat Tempat Tinggal</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="input" placeholder="Jalan, Kota, Kode Pos" />
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <button type="submit" disabled={isUpdating} className="btn btn-primary w-full py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3">
                    {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Simpan Profil'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-8 animate-fade-in">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password Saat Ini</label>
                    <input type="password" name="current" value={changePassword.current} onChange={handlePasswordChange} className="input" placeholder="••••••••" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password Baru</label>
                    <input type="password" name="new" value={changePassword.new} onChange={handlePasswordChange} className="input" placeholder="Minimal 8 karakter" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Konfirmasi Password Baru</label>
                    <input type="password" name="confirm" value={changePassword.confirm} onChange={handlePasswordChange} className="input" placeholder="Ulangi password baru" required />
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <button type="submit" disabled={isUpdating} className="btn btn-primary bg-destructive hover:bg-destructive/90 w-full py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 border-none">
                    {isUpdating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Perbarui Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;