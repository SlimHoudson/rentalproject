import React, { useState, useEffect } from 'react';
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-overlay backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in border border-border" onClick={(e) => e.stopPropagation()}>
        {/* Receipt Header */}
        <div className="bg-primary p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,1),transparent)]"></div>
          <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20 shadow-xl">
            <span className="material-symbols-outlined text-white text-3xl">receipt_long</span>
          </div>
          <h2 className="font-black text-xl tracking-tight uppercase">Luxury Receipt</h2>
          <p className="text-white/60 text-[10px] font-black tracking-[0.2em] uppercase mt-1">Transaction Verified</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex justify-between items-end border-b border-border pb-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Receipt ID</p>
              <p className="text-sm font-bold text-foreground font-mono">#{booking._id?.slice(-8).toUpperCase() || 'N/A'}</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Date Issued</p>
              <p className="text-sm font-bold text-foreground">{formatDate(new Date())}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
              <img src={booking.car?.imageUrl} alt="" className="w-20 h-12 object-cover rounded-lg shadow-sm" />
              <div>
                <p className="text-sm font-black text-foreground">{booking.car?.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{booking.car?.brand} • {booking.car?.year}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Customer</p>
                <p className="text-xs font-bold text-foreground">{booking.user?.name || user?.name || 'User'}</p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Duration</p>
                <p className="text-xs font-bold text-primary">{getDuration()}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground italic">Base Rental Fee</span>
                <span className="text-foreground font-bold">Rp {(booking.totalPrice - 150000).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground italic">Premium Protection & Service</span>
                <span className="text-foreground font-bold">Rp {(150000).toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-4 mt-2 border-t border-border flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-widest text-foreground">Total Paid</span>
                <span className="text-xl font-black text-primary">Rp {(booking.totalPrice || 0).toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <div className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-center ${
              booking.status === 'Selesai' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 
              booking.status === 'Dibatalkan' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
              'bg-primary/10 text-primary border border-primary/20 animate-pulse'
            }`}>
              Status: {booking.status || 'Pending'}
            </div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full p-6 bg-muted/30 text-xs font-black uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors border-t border-border"
        >
          Close Receipt
        </button>
      </div>
    </div>
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
      showToast('Reservation Cancelled Successfully');
      
      // Re-fetch
      const isAdminView = window.location.pathname.includes('/admin/');
      const endpoint = isAdminView ? '/bookings' : '/bookings/my-bookings';
      const res = await api.get(endpoint);
      const data = res.data;
      setBookings(Array.isArray(data) ? data : (data.data || []));
    } catch (err) {
      showToast(err.message || 'Failed to cancel', 'error');
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
          <h2 className="text-4xl font-black tracking-tight text-foreground">Transaction History</h2>
          <p className="text-muted-foreground mt-2">Manage and monitor your premium car reservations.</p>
        </div>
        
        <div className="flex gap-2 p-1.5 bg-muted/30 border border-border rounded-2xl overflow-x-auto no-scrollbar">
          {['Semua', 'Selesai', 'Berjalan', 'Pending Payment', 'Dibatalkan'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-xl text-xs font-black tracking-widest uppercase whitespace-nowrap transition-all ${filter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {f}
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
                <p className="text-foreground font-black uppercase tracking-widest">No Records Found</p>
                <p className="text-muted-foreground text-sm">You haven't made any reservations yet.</p>
              </div>
              <button onClick={() => navigate('/cars')} className="btn btn-primary px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest">Explore Fleet</button>
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
                        {booking.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>{formatDate(booking.startDate)} — {formatDate(booking.endDate)}</span>
                      <span className="text-primary/60">({booking.days || 1} Days)</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                    <div className="text-left md:text-right">
                      <p className="text-sm font-black text-primary leading-none">Rp {(booking.totalPrice || booking.total || 0).toLocaleString('id-ID')}</p>
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter mt-1">Total Payment</p>
                    </div>
                    {booking.status !== 'Dibatalkan' && booking.status !== 'Selesai' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setBookingToCancel(booking); }}
                        className="p-2.5 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
                        title="Cancel Booking"
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
      {bookingToCancel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-overlay backdrop-blur-md animate-fade-in">
          <div className="bg-card rounded-[2.5rem] p-10 max-w-sm w-full border border-border shadow-2xl animate-zoom-in text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto shadow-inner text-destructive">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground">Cancel Booking?</h3>
              <p className="text-sm text-muted-foreground">Are you sure you want to cancel this reservation? This action cannot be undone.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={() => handleCancel(bookingToCancel)} className="w-full py-4 rounded-2xl bg-destructive text-white font-black hover:opacity-90 transition-all shadow-xl shadow-destructive/20">Yes, Cancel Reservation</button>
              <button onClick={() => setBookingToCancel(null)} className="w-full py-4 rounded-2xl bg-muted text-foreground font-black hover:bg-muted transition-all">Keep Reservation</button>
            </div>
          </div>
        </div>
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