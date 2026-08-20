import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const ReceiptModal = ({ booking, onClose, user }) => {
  if (!booking) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDuration = () => {
    if (!booking.startDate || !booking.endDate) return `${booking.days || 1} Hari`;
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
    return `${diffDays} Hari`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto" onClick={onClose}>
      <div 
        className="bg-card rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md my-auto overflow-hidden animate-zoom-in border border-border flex flex-col max-h-[90vh] relative z-10" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Receipt Header */}
        <header className="bg-primary px-6 py-5 sm:p-6 text-center text-white relative flex-shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all border border-white/20"
            title="Tutup"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2.5 border border-white/20 shadow-md">
            <span className="material-symbols-outlined text-white text-2xl">receipt_long</span>
          </div>
          <h2 className="font-black text-lg sm:text-xl tracking-tight uppercase">Bukti Transaksi</h2>
          <p className="text-white/70 text-[9px] sm:text-[10px] font-black tracking-[0.2em] uppercase mt-0.5">Transaksi Terverifikasi • Bahrayyan Rental</p>
        </header>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-4 sm:space-y-5 no-scrollbar">
          <div className="flex justify-between items-end border-b border-border pb-4">
            <div className="space-y-0.5">
              <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">No. Pesanan</p>
              <p className="text-xs sm:text-sm font-bold text-foreground font-mono">#{booking.orderId || booking._id?.slice(-8).toUpperCase() || 'N/A'}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Tanggal Terbit</p>
              <p className="text-xs sm:text-sm font-bold text-foreground">{formatDate(booking.createdAt || new Date())}</p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-center gap-3.5 bg-muted/30 p-3 sm:p-4 rounded-2xl border border-border/50">
              <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/40">
                <img 
                  src={booking.car?.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-black text-foreground truncate">{booking.car?.name}</p>
                <p className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">{booking.car?.brand} • {booking.car?.year || '2024'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-1 text-xs">
              <div className="space-y-0.5">
                <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pelanggan</p>
                <p className="text-xs sm:text-sm font-bold text-foreground truncate">{booking.user?.name || user?.name || 'Pelanggan'}</p>
              </div>
              <div className="space-y-0.5 text-right">
                <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Durasi Sewa</p>
                <p className="text-xs sm:text-sm font-bold text-primary">{getDuration()}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Biaya Sewa Pokok</span>
                <span className="text-foreground font-bold">Rp {(Math.max(0, (booking.totalPrice || 0) - 150000)).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Asuransi & Proteksi Layanan</span>
                <span className="text-foreground font-bold">Rp 150.000</span>
              </div>
              <div className="pt-3 border-t border-border flex justify-between items-center">
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-foreground">Total Dibayar</span>
                <span className="text-lg sm:text-xl font-black text-primary">Rp {(booking.totalPrice || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div>
            <div className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] text-center border ${
              booking.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
              booking.status === 'Dibatalkan' || booking.status === 'Payment Failed' ? 'bg-destructive/10 text-destructive border-destructive/20' :
              booking.status === 'Pending Payment' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
              'bg-primary/10 text-primary border-primary/20'
            }`}>
              Status: {booking.status === 'Pending Payment' ? 'Menunggu Bayar' : booking.status || 'Aktif'}
            </div>
          </div>
        </div>

        {/* Sticky Footer Action */}
        <footer className="p-4 sm:p-5 bg-muted/20 border-t border-border flex gap-3 flex-shrink-0">
          <button 
            onClick={() => window.print()} 
            className="flex-1 py-3 px-4 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base">print</span>
            Cetak
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 py-3 px-4 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-primary/20"
          >
            Tutup
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
};

const BookingHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('Semua');
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const isAdminView = window.location.pathname.includes('/admin/');
        const endpoint = isAdminView ? '/bookings' : '/bookings/my-bookings';
        
        const res = await api.get(endpoint, { signal: controller.signal });
        const data = res.data;
        const bookingsArray = Array.isArray(data) ? data : (data.data || []);
        setBookings(bookingsArray);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error('Fetch history error:', err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    return () => controller.abort();
  }, []);

  const handleCancel = async (booking) => {
    try {
      await api.post(`/bookings/${booking._id}/cancel`);
      showToast('Pemesanan Berhasil Dibatalkan');
      
      // Re-fetch
      const isAdminView = window.location.pathname.includes('/admin/');
      const endpoint = isAdminView ? '/bookings' : '/bookings/my-bookings';
      const res = await api.get(endpoint);
      const data = res.data;
      setBookings(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      showToast(err.message || 'Gagal membatalkan pesanan', 'error');
    }
    setBookingToCancel(null);
  };

  const filtered = bookings.filter(b => {
    if (!b) return false;
    if (filter === 'Semua') return true;
    if (filter === 'Berjalan') return b.status === 'Aktif' || b.status === 'Berjalan';
    return b.status === filter;
  });

  return (
    <div className="p-6 lg:p-12 space-y-10 animate-fade-in max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-foreground">Riwayat Transaksi</h2>
          <p className="text-muted-foreground mt-2">Pantau dan kelola riwayat pemesanan mobil Anda.</p>
        </div>
        
        <div className="flex gap-2 p-1.5 bg-muted/30 border border-border rounded-2xl overflow-x-auto no-scrollbar">
          {['Semua', 'Selesai', 'Berjalan', 'Pending Payment', 'Dibatalkan'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest uppercase whitespace-nowrap transition-all ${filter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {f === 'Pending Payment' ? 'Menunggu Bayar' : f}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 w-full bg-muted animate-pulse rounded-2xl border border-border"></div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-[2.5rem] border border-border shadow-sm space-y-6">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl opacity-20">receipt_long</span>
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-black uppercase tracking-widest">Tidak Ada Riwayat</p>
                <p className="text-muted-foreground text-sm">Anda belum memiliki riwayat pemesanan rental mobil.</p>
              </div>
              <button onClick={() => navigate('/cars')} className="btn btn-primary px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest">Jelajahi Armada</button>
            </div>
          ) : (
            filtered.map((booking, idx) => (
              <div 
                key={booking._id || idx} 
                className="group bg-card border border-border rounded-2xl p-4 lg:p-6 hover:border-primary/40 transition-all cursor-pointer shadow-sm relative overflow-hidden"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="relative w-24 h-16 flex-shrink-0">
                    <img src={booking.car?.imageUrl} alt="" className="w-full h-full object-cover rounded-xl shadow-inner border border-border/50" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-black text-foreground truncate">{booking.car?.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        booking.status === 'Selesai' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        booking.status === 'Dibatalkan' || booking.status === 'Payment Failed' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                        booking.status === 'Pending Payment' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {booking.status === 'Pending Payment' ? 'Menunggu Bayar' : booking.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>{formatDate(booking.startDate)} — {formatDate(booking.endDate)}</span>
                      <span className="text-primary/60">({booking.days || 1} Hari)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                    <div className="text-left md:text-right">
                      <p className="text-sm font-black text-primary leading-none">Rp {(booking.totalPrice || booking.total || 0).toLocaleString('id-ID')}</p>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mt-1">Total Pembayaran</p>
                    </div>
                    {booking.status !== 'Dibatalkan' && booking.status !== 'Selesai' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setBookingToCancel(booking); }}
                        className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
                        title="Batalkan Pesanan"
                      >
                        <span className="material-symbols-outlined text-xl">cancel</span>
                      </button>
                    )}
                    <span className="material-symbols-outlined text-muted-foreground/30 group-hover:translate-x-1 transition-transform hidden md:block">chevron_right</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Cancel Confirmation */}
      {bookingToCancel && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setBookingToCancel(null)}>
          <div className="bg-card rounded-[2.5rem] p-10 max-w-sm w-full border border-border shadow-2xl animate-zoom-in text-center space-y-6 relative z-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto shadow-inner text-destructive">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground">Batalkan Pesanan?</h3>
              <p className="text-sm text-muted-foreground">Apakah Anda yakin ingin membatalkan pemesanan ini? Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleCancel(bookingToCancel)} className="w-full py-4 rounded-2xl bg-destructive text-white font-black hover:opacity-90 transition-all shadow-xl shadow-destructive/20">Ya, Batalkan Pesanan</button>
              <button onClick={() => setBookingToCancel(null)} className="w-full py-4 rounded-2xl bg-muted text-foreground font-black hover:bg-muted transition-all">Pertahankan Pesanan</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedBooking && (
        <ReceiptModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)}
          user={user}
        />
      )}

      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-4 px-8 py-5 rounded-[2rem] shadow-2xl bg-zinc-900 text-white animate-slide-up border border-zinc-800">
          <span className={`material-symbols-outlined ${toast.type === 'error' ? 'text-destructive' : 'text-primary'}`}>
            {toast.type === 'error' ? 'error' : 'verified_user'}
          </span>
          <span className="text-sm font-black uppercase tracking-widest">{toast.msg}</span>
        </div>
      )}
    </div>
  );
};

export default BookingHistory;