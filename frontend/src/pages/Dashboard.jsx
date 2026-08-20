import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, Line, PieChart, Pie, Cell, Legend } from 'recharts';

// ========== ADMIN DASHBOARD ==========
export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const carRes = await api.get('/cars');
        const carData = carRes.data;
        setCars(Array.isArray(carData) ? carData : carData.data || []);

        const bookingRes = await api.get('/bookings');
        const bookingData = bookingRes.data;
        setBookings(Array.isArray(bookingData) ? bookingData : bookingData.data || []);
      } catch (err) {
        console.error('Failed to fetch admin dashboard data:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const totalRevenue = bookings.filter(b => b && b.status !== 'Dibatalkan' && b.status !== 'Ditolak').reduce((sum, b) => sum + ((b.totalPrice || b.total || 0)), 0);
  const maintenanceCount = cars.filter(c => c && c.status === 'Perawatan').length;
  const activeBookingsCount = bookings.filter(b => b && (b.status === 'Berjalan' || b.status === 'Aktif' || b.status === 'Terlambat')).length;
  const pendingValidationCount = bookings.filter(b => b && b.status === 'Menunggu Konfirmasi').length;

  const getMonthlyRevenueData = () => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const now = new Date();
    const revenueByMonth = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[key] = { month: months[d.getMonth()], total: 0, count: 0 };
    }
    bookings.forEach(b => {
      if (b && b.status !== 'Dibatalkan' && b.status !== 'Ditolak') {
        const dateRaw = b.createdAt || b.startDate;
        if (!dateRaw) return;
        const created = new Date(dateRaw);
        if (isNaN(created.getTime())) return;
        const year = created.getUTCFullYear();
        const month = created.getUTCMonth();
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;
        if (revenueByMonth[key]) {
          revenueByMonth[key].total += (b.totalPrice || b.total || 0);
          revenueByMonth[key].count += 1;
        }
      }
    });
    return Object.values(revenueByMonth);
  };

  const monthlyRevenueData = getMonthlyRevenueData();
  const statusCounts = bookings.reduce((acc, b) => {
    if (!b) return acc;
    const s = b.status || 'Unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Memuat Data Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12 space-y-12 animate-fade-in max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground">Ringkasan Sistem</h2>
          <p className="text-muted-foreground font-medium">Metrik performa, validasi pesanan, dan logistik armada rental secara real-time.</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-success/5 border border-success/20 text-[10px] font-black uppercase tracking-widest text-success">
          <span className="w-2 h-2 rounded-full bg-success"></span>
          Sistem Berjalan Optimal
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[ 
          { label: 'Perlu Validasi', value: `${pendingValidationCount}`, suffix: 'Pesanan', icon: 'pending_actions', color: 'text-amber-500', bg: 'bg-amber-500/10', path: '/admin/bookings' },
          { label: 'Total Armada', value: `${cars.length}`, suffix: 'Unit', icon: 'directions_car', color: 'text-primary', bg: 'bg-primary/10', path: '/admin/cars' },
          { label: 'Rental Aktif', value: `${activeBookingsCount}`, suffix: 'Mobil', icon: 'key', color: 'text-blue-500', bg: 'bg-blue-500/10', path: '/admin/return' },
          { label: 'Total Pendapatan', value: `Rp ${(totalRevenue / 1000000).toFixed(1)}`, suffix: 'Juta', icon: 'payments', color: 'text-success', bg: 'bg-success/10', path: '/admin/bookings' },
          { label: 'Mobil Perawatan', value: `${maintenanceCount}`, suffix: 'Unit', icon: 'build', color: 'text-destructive', bg: 'bg-destructive/10', path: '/admin/cars' },
        ].map((stat) => (
          <button key={stat.label} onClick={() => navigate(stat.path)} className="group card p-6 text-left hover:border-primary/40 transition-colors">
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-5`}>
              <span className={`material-symbols-outlined text-2xl ${stat.color}`}>{stat.icon}</span>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black tracking-tighter text-foreground">{stat.value}</p>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{stat.suffix}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card p-8 space-y-8">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">show_chart</span>
              </div>
              <h3 className="text-lg font-black tracking-tight">Grafik Pendapatan</h3>
            </div>
            <select className="bg-muted/50 border-none rounded-lg text-[10px] font-black uppercase tracking-widest px-3 py-1.5 outline-none cursor-pointer">
              <option>6 Bulan Terakhir</option>
              <option>Tahun Ini</option>
            </select>
          </header>
          
          <div className="h-[350px] w-full">
            {monthlyRevenueData && monthlyRevenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyRevenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={10} fontVariant="bold" tickMargin={15} />
                  <YAxis axisLine={false} tickLine={false} stroke="var(--text-muted)" fontSize={10} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                  <Tooltip 
                    cursor={{fill: 'var(--muted)', opacity: 0.2}}
                    contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', padding: '12px' }}
                  />
                  <Bar dataKey="total" fill="var(--primary)" radius={[6,6,0,0]} barSize={32} />
                  <Line type="monotone" dataKey="total" stroke="var(--foreground)" strokeWidth={4} dot={{ r: 6, fill: 'var(--foreground)', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse text-xs font-black uppercase tracking-widest">Menunggu Data...</div>}
          </div>
        </div>

        <div className="card p-8 space-y-8">
          <h3 className="text-lg font-black tracking-tight">Status Pesanan</h3>
          <div className="h-[350px] flex items-center justify-center relative">
            {statusCounts && Object.keys(statusCounts).length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(statusCounts).map(([name, value]) => ({ 
                      name: name === 'Pending Payment' ? 'Menunggu Bayar' : name === 'Payment Failed' ? 'Gagal' : name === 'Expired' ? 'Kedaluwarsa' : name, 
                      value 
                    }))}
                    innerRadius={85}
                    outerRadius={115}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {Object.entries(statusCounts).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 5]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px' }} />
                  <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '10px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.1em' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total</p>
              <p className="text-3xl font-black tracking-tighter">{bookings.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden content-auto">
        <header className="p-8 border-b border-border flex justify-between items-center bg-muted/10">
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight">Transaksi Terkini</h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pemantauan transaksi rental langsung</p>
          </div>
          <button onClick={() => navigate('/admin/bookings')} className="btn btn-secondary px-6 py-2.5 text-[10px] font-black uppercase tracking-widest">Lihat Semua Transaksi</button>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/5 border-b border-border">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Pelanggan</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Kendaraan</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Jadwal Sewa</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Biaya</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.length === 0 ? (
                <tr><td colSpan="5" className="py-20 text-center text-muted-foreground font-black uppercase tracking-widest text-xs opacity-30">Belum ada transaksi transaksi baru...</td></tr>
              ) : (
                bookings.slice(0, 10).map((b, idx) => (
                  <tr key={b._id || idx} className="hover:bg-muted/10 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-black text-primary">
                          {b.user?.name ? b.user.name[0] : '?'}  
                        </div>
                        <div className="space-y-0.5">
                          <p className="font-black text-sm text-foreground uppercase tracking-tight">{b.user?.name || 'Anonim'}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{b.user?.email || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-0.5">
                        <p className="font-black text-sm text-foreground uppercase tracking-tight">{b.car?.name || 'Mobil'}</p>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{b.car?.plateNumber || '-'}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-xs text-muted-foreground">calendar_month</span>
                        <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{b.startDate ? new Date(b.startDate).toLocaleDateString('id-ID', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Tertunda'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-sm text-primary">Rp {(b.totalPrice || b.total || 0).toLocaleString('id-ID')}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border ${
                        b.status === 'Menunggu Konfirmasi' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse' :
                        b.status === 'Aktif' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                        b.status === 'Selesai' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                        b.status === 'Dibatalkan' || b.status === 'Ditolak' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                        'bg-muted text-muted-foreground border-border'
                      }`}>
                        {b.status === 'Menunggu Konfirmasi' ? 'Perlu Validasi' : (b.status || 'Berjalan')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ========== USER DASHBOARD ==========
export const UserDashboard = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        await refreshUser();
        const carRes = await api.get('/cars');
        const carJson = carRes.data;
        setCars(Array.isArray(carJson) ? carJson : carJson.data || []);

        const bookingRes = await api.get('/bookings/my-bookings');
        const bookingData = bookingRes.data;
        setBookings(Array.isArray(bookingData) ? bookingData : []);
      } catch (err) {
        console.error('Dashboard Fetch Error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const bookingCount = bookings.length;
  const activeCount = bookings.filter(b => b && (b.status === 'Berjalan' || b.status === 'Aktif')).length;
  const currentPoints = user?.points || 0;

  const handleCheckPoints = () => {
    if (currentPoints < 1000) {
      setToast({ type: 'info', title: 'Status Poin Loyalitas', message: `Tingkatkan transaksi. Butuh ${1000 - currentPoints} poin lagi untuk mendapatkan diskon khusus.` });
    } else {
      setToast({ type: 'success', title: 'Diskon Tersedia', message: 'Poin Anda mencukupi untuk potongan harga langsung di halaman checkout.' });
    }
    setTimeout(() => setToast(null), 4000);
  };

  const recentBookings = bookings.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12 space-y-12 animate-fade-in max-w-7xl mx-auto">
      {/* Premium Member Hero */}
      <section className="relative p-10 lg:p-14 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-lg">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">Akses Member Terverifikasi</span>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                Selamat datang kembali,<br /> <span className="text-primary italic">{user?.name?.split(' ')[0]}</span>.
              </h2>
              <p className="text-zinc-400 text-base leading-relaxed font-medium">
                Pilihan armada mobil terbaik siap menemani setiap perjalanan dan momen istimewa Anda.
              </p>
            </div>
            <button onClick={() => navigate('/cars')} className="btn btn-primary px-8 py-4 rounded-xl shadow-lg shadow-primary/20 text-xs font-black uppercase tracking-[0.2em]">
              Jelajahi Armada
              <span className="material-symbols-outlined">arrow_right_alt</span>
            </button>
          </div>

          <div className="hidden lg:flex flex-col gap-6 p-8 bg-zinc-950/60 border border-zinc-800 rounded-2xl">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">ID Member</p>
              <p className="text-xs font-black text-white tracking-widest uppercase">{user?._id?.slice(-8).toUpperCase()}</p>
            </div>
            <div className="h-px bg-zinc-800"></div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</p>
              <p className="text-xs font-black text-primary tracking-widest uppercase">Member Prioritas</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { id: 'ledger', label: 'Riwayat Transaksi', value: bookingCount, unit: 'Pesanan', icon: 'history_edu', action: () => navigate('/history') },
          { id: 'active', label: 'Rental Berjalan', value: activeCount, unit: 'Mobil', icon: 'key', color: 'text-blue-500', bg: 'bg-blue-500/10', action: () => navigate('/history') },
          { id: 'loyalty', label: 'Poin Loyalitas', value: currentPoints.toLocaleString(), unit: 'Poin', icon: 'stars', color: 'text-amber-500', bg: 'bg-amber-500/10', action: handleCheckPoints, sub: currentPoints >= 1000 ? 'Diskon Tersedia' : null }
        ].map(item => (
          <button key={item.id} onClick={item.action} className="card p-8 flex items-center gap-6 text-left hover:border-primary/40 transition-colors">
            <div className={`w-14 h-14 rounded-2xl ${item.bg || 'bg-muted/50'} flex items-center justify-center`}>
              <span className={`material-symbols-outlined text-2xl ${item.color || 'text-primary'}`}>{item.icon}</span>
            </div>
            <div className="space-y-1 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-black tracking-tighter text-foreground">{item.value}</p>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{item.unit}</span>
              </div>
              {item.sub && <p className="text-[9px] font-black uppercase tracking-widest text-primary">{item.sub}</p>}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Recent Activity Ledger */}
        <div className="lg:col-span-7 space-y-8">
          <header className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tight">Aktivitas Terkini</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Riwayat sewa mobil Anda</p>
            </div>
            <button onClick={() => navigate('/history')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">Lihat Semua</button>
          </header>
          
          <div className="card divide-y divide-border overflow-hidden content-auto">
            {recentBookings.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-muted/30 flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-3xl opacity-20">history</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Belum ada riwayat pesanan</p>
              </div>
            ) : (
              recentBookings.map((b, i) => (
                <div key={b._id || i} className="p-6 flex items-center gap-6 hover:bg-muted/10 transition-colors">
                  <div className="w-24 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden border border-border">
                    <img src={b.car?.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-black text-sm uppercase tracking-tight truncate">{b.car?.name || 'Kendaraan'}</p>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <span>{new Date(b.startDate).toLocaleDateString('id-ID', { month: 'short', day: '2-digit' })}</span>
                      <span className="w-1 h-1 rounded-full bg-border"></span>
                      <span>{b.totalDays} Hari</span>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <p className="text-sm font-black text-primary tracking-tight">Rp {(b.totalPrice || 0).toLocaleString('id-ID')}</p>
                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                      b.status === 'Selesai' ? 'bg-success/5 text-success border-success/20' : 'bg-primary/5 text-primary border-primary/20'
                    }`}>{b.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Curated Recommendations */}
        <div className="lg:col-span-5 space-y-8">
          <header className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-2xl font-black tracking-tight">Rekomendasi Mobil</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pilihan kendaraan untuk perjalanan Anda</p>
            </div>
            <button onClick={() => navigate('/cars')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-70 transition-opacity">Lihat Semua</button>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {cars.filter(c => c.status === 'Tersedia').slice(0, 4).map(car => (
              <div key={car._id} onClick={() => navigate('/cars')} className="card p-5 space-y-5 cursor-pointer hover:border-primary/40 transition-colors">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted relative border border-border">
                  <img src={car.imageUrl} alt={car.name} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-background/90 rounded-lg text-[8px] font-black uppercase tracking-widest border border-border">Tersedia</div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-black text-sm uppercase tracking-tight truncate">{car.name}</h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Tarif / Hari</p>
                      <p className="text-xs font-black text-foreground tracking-tight">Rp {car.pricePerDay?.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-muted-foreground">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Synchronized Protocol Notifications */}
      {toast && (
        <div className="fixed bottom-12 right-12 z-[100] animate-slide-up">
          <div className="bg-card border border-border shadow-xl p-6 rounded-2xl flex items-center gap-6 min-w-[340px]">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              toast.type === 'success' ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'
            }`}>
              <span className="material-symbols-outlined text-2xl">{toast.type === 'success' ? 'verified' : 'info'}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black uppercase tracking-widest text-foreground">{toast.title}</p>
              <p className="text-[11px] font-medium text-muted-foreground leading-relaxed max-w-[220px]">{toast.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
