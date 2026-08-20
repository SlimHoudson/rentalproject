import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Header = ({ title }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const menuItems = isAdmin ? [
    { to: '/admin/dashboard', label: 'Ringkasan' },
    { to: '/admin/cars', label: 'Armada' },
    { to: '/admin/bookings', label: 'Transaksi' },
    { to: '/admin/users', label: 'Pelanggan' },
    { to: '/admin/chat', label: 'Pesan & Bantuan' },
  ] : [
    { to: '/dashboard', label: 'Ringkasan' },
    { to: '/cars', label: 'Katalog Mobil' },
    { to: '/history', label: 'Pesanan Saya' },
  ];

  useEffect(() => {
    const loadNotifs = () => {
      const allNotifs = JSON.parse(localStorage.getItem('app_notifications') || '[]');
      const myNotifs = allNotifs
        .filter(n => n && (isAdmin ? n.target === 'admin' : n.target === user?.email))
        .sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));
      setNotifications(myNotifs);
    };
    
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAdmin, user?.email]);

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  const markAllRead = () => {
    const allNotifs = JSON.parse(localStorage.getItem('app_notifications') || '[]');
    const updated = allNotifs.map(n => {
      if ((isAdmin && n.target === 'admin') || (!isAdmin && n.target === user?.email)) {
        return { ...n, read: true };
      }
      return n;
    });
    localStorage.setItem('app_notifications', JSON.stringify(updated));
    setNotifications(notifications.map(n => ({...n, read: true})));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-[50] w-full bg-card/95 border-b border-border">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Branding & Nav */}
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
          >
            <span className="material-symbols-outlined">{isMobileMenuOpen ? 'close' : 'menu'}</span>
          </button>
          
          <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-white text-base">directions_car</span>
            </div>
            <span className="text-sm font-black tracking-tight text-foreground uppercase hidden sm:block">Bahrayyan Rental</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive(item.to)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-muted/30 rounded-full p-1 border border-border">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all"
              title="Ganti Tema"
            >
              <span className="material-symbols-outlined text-[20px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            
            <div className="w-px h-4 bg-border mx-1"></div>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground transition-all relative"
                title="Notifikasi"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-[-40px] top-12 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                  <div className="px-5 py-4 border-b border-border flex justify-between items-center bg-muted/20">
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Notifikasi</span>
                    {unreadCount > 0 && <button onClick={markAllRead} className="text-[10px] text-primary font-bold hover:underline">Tandai dibaca</button>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center space-y-2">
                        <span className="material-symbols-outlined text-4xl opacity-10">notifications_off</span>
                        <p className="text-xs text-muted-foreground">Semua sudah terbaca!</p>
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}>
                          <p className="text-xs font-bold text-foreground mb-1">{n.title}</p>
                          <p className="text-[10px] text-muted-foreground leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 ml-2">
            <div className="hidden md:block text-right">
              <p className="text-xs font-black text-foreground leading-none">{user?.name?.split(' ')[0]}</p>
              <p className="text-[9px] font-black text-primary uppercase tracking-[0.1em] mt-1">{isAdmin ? 'Admin' : 'Member'}</p>
            </div>
            
            <button
              onClick={() => navigate('/profile')}
              className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
              title="Profil Pengguna"
            >
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </button>

            <button
              onClick={() => setShowLogoutModal(true)}
              className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
              title="Keluar"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-card border-b border-border shadow-2xl animate-fade-in">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center px-5 py-4 rounded-xl text-sm font-bold ${
                  isActive(item.to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 animate-fade-in">
          <div className="bg-card rounded-[2.5rem] p-10 max-w-sm w-full border border-border shadow-2xl animate-zoom-in text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto shadow-inner text-destructive animate-bounce-subtle">
              <span className="material-symbols-outlined text-4xl">logout</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground">Keluar Akun</h3>
              <p className="text-sm text-muted-foreground">Apakah Anda yakin ingin mengakhiri sesi di <span className="text-primary font-bold">Bahrayyan Rental</span>?</p>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={confirmLogout}
                className="w-full py-4 rounded-2xl bg-destructive text-white font-black hover:opacity-90 transition-all shadow-xl shadow-destructive/20"
              >
                Ya, Keluar Akun
              </button>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-4 rounded-2xl bg-muted/50 text-foreground font-black hover:bg-muted transition-all"
              >
                Tetap Masuk
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
