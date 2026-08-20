import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = isAdmin ? [
    { to: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/admin/cars', icon: 'directions_car', label: 'Armada' },
    { to: '/admin/bookings', icon: 'calendar_today', label: 'Transaksi' },
    { to: '/admin/return', icon: 'assignment_return', label: 'Pengembalian' },
    { to: '/admin/chat', icon: 'forum', label: 'Pesan & Bantuan' },
    { to: '/admin/users', icon: 'group', label: 'Pelanggan' },
  ] : [
    { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { to: '/cars', icon: 'directions_car', label: 'Katalog Mobil' },
    { to: '/history', icon: 'receipt_long', label: 'Riwayat Pesanan' },
    { to: '/checkout', icon: 'shopping_cart', label: 'Pembayaran' },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-sidebar-width z-[60] flex flex-col bg-card border-r border-border transition-transform duration-300 transform 
        ${isOpen ? 'translate-x-0 shadow-2xl shadow-black/20' : '-translate-x-full lg:translate-x-0'}`}
    >
      {/* Brand area */}
      <div className="p-8">
        <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-white text-xl">directions_car</span>
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-foreground uppercase">LuxeDrive</h2>
            <p className="text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase opacity-70">Rental Mobil</p>
          </div>
        </Link>
      </div>

      {/* Profile summary */}
      <div className="px-6 mb-8">
        <div className="p-4 rounded-2xl bg-muted/30 border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs border border-primary/20 shadow-inner">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-foreground truncate">{user?.name || 'Tamu'}</p>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{isAdmin ? '👑 Administrator' : '👤 Member'}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <p className="px-4 py-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em]">Menu Utama</p>
        {menuItems.map((item) => {
          const active = isActive(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative overflow-hidden ${
                active 
                  ? 'bg-primary/10 text-primary font-bold' 
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              {active && <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-full"></div>}
              <span className={`material-symbols-outlined text-xl ${active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                {item.icon}
              </span>
              <span className="text-sm tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Account */}
      <div className="p-4 mt-auto border-t border-border space-y-1">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all"
        >
          <span className="material-symbols-outlined text-xl">manage_accounts</span>
          <span className="text-sm font-medium">Pengaturan</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all text-left"
        >
          <span className="material-symbols-outlined text-xl">logout</span>
          <span className="text-sm font-bold">Keluar</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
