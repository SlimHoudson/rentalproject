import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

// Shopee-style Order Timeline Component
const ShopeeTimeline = ({ booking }) => {
  const isPaid = booking.paymentStatus === 'paid' || booking.status === 'Menunggu Konfirmasi' || booking.status === 'Aktif' || booking.status === 'Selesai';
  const isValidated = booking.status === 'Aktif' || booking.status === 'Selesai';
  const isWaitingValidation = booking.status === 'Menunggu Konfirmasi';
  const isRejected = booking.status === 'Ditolak';
  const isCompleted = booking.status === 'Selesai';

  const steps = [
    { title: 'Pesanan Dibuat', done: true, icon: 'receipt' },
    { title: 'Pembayaran Lunas', done: isPaid, icon: 'credit_score' },
    { 
      title: isRejected ? 'Pesanan Ditolak' : 'Validasi Admin', 
      done: isValidated || isRejected, 
      pending: isWaitingValidation, 
      error: isRejected, 
      icon: isRejected ? 'cancel' : (isWaitingValidation ? 'pending_actions' : 'verified_user') 
    },
    { title: 'Siap Digunakan', done: isValidated, icon: 'key' },
    { title: 'Selesai', done: isCompleted, icon: 'task_alt' }
  ];

  return (
    <div className="py-4 px-2">
      <div className="flex items-center justify-between relative">
        {/* Background Connector Bar */}
        <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-muted -z-0"></div>
        
        {steps.map((step, idx) => {
          let circleClass = 'bg-muted border-border text-muted-foreground';
          if (step.done) circleClass = 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20';
          if (step.pending) circleClass = 'bg-amber-500 text-white border-amber-500 animate-pulse shadow-md shadow-amber-500/30';
          if (step.error) circleClass = 'bg-destructive text-white border-destructive shadow-md shadow-destructive/20';

          return (
            <div key={idx} className="flex flex-col items-center relative z-10 space-y-1.5 max-w-[70px] sm:max-w-[90px] text-center">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 transition-all ${circleClass}`}>
                <span className="material-symbols-outlined text-sm sm:text-base">{step.icon}</span>
              </div>
              <p className={`text-[8px] sm:text-[9px] font-black uppercase tracking-tight leading-tight ${
                step.pending ? 'text-amber-500 font-bold' : step.error ? 'text-destructive font-bold' : step.done ? 'text-foreground' : 'text-muted-foreground/60'
              }`}>
                {step.title}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Receipt & Full Details Modal
const ReceiptModal = ({ booking, onClose, user, isAdmin, onValidate }) => {
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
        className="bg-card rounded-3xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg my-auto overflow-hidden animate-zoom-in border border-border flex flex-col max-h-[90vh] relative z-10" 
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
          <p className="text-white/70 text-[9px] sm:text-[10px] font-black tracking-[0.2em] uppercase mt-0.5">Sistem Validasi Transaksi • Bahrayyan Rental</p>
        </header>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5 no-scrollbar">
          {/* Shopee-style Tracking Timeline */}
          <div className="bg-muted/20 p-4 rounded-2xl border border-border/60">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Pelacakan Pesanan</p>
            <ShopeeTimeline booking={booking} />
          </div>

          {/* Shopee Status Information Alert */}
          {booking.status === 'Menunggu Konfirmasi' && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3 text-amber-500">
              <span className="material-symbols-outlined text-xl flex-shrink-0 animate-spin">hourglass_top</span>
              <div className="text-xs space-y-0.5">
                <p className="font-black uppercase tracking-wider">Menunggu Validasi Admin</p>
                <p className="text-amber-500/80 text-[11px] leading-relaxed">
                  {isAdmin 
                    ? 'Pesanan ini telah dibayar oleh pembeli dan membutuhkan persetujuan/validasi Anda.' 
                    : 'Pembayaran Anda telah diterima. Tim admin sedang memverifikasi pesanan sebelum unit mobil siap digunakan.'}
                </p>
              </div>
            </div>
          )}

          {booking.status === 'Aktif' && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-start gap-3 text-emerald-500">
              <span className="material-symbols-outlined text-xl flex-shrink-0">verified</span>
              <div className="text-xs space-y-0.5">
                <p className="font-black uppercase tracking-wider">Pesanan Telah Divalidasi</p>
                <p className="text-emerald-500/80 text-[11px] leading-relaxed">
                  {booking.validationNotes || 'Pesanan telah disetujui oleh admin dan unit mobil siap digunakan sesuai jadwal.'}
                </p>
              </div>
            </div>
          )}

          {booking.status === 'Ditolak' && (
            <div className="bg-destructive/10 border border-destructive/30 p-4 rounded-2xl flex items-start gap-3 text-destructive">
              <span className="material-symbols-outlined text-xl flex-shrink-0">cancel</span>
              <div className="text-xs space-y-0.5">
                <p className="font-black uppercase tracking-wider">Pesanan Ditolak</p>
                <p className="text-destructive/80 text-[11px] leading-relaxed">
                  Alasan: {booking.rejectionReason || 'Pesanan tidak memenuhi kriteria verifikasi.'}
                </p>
              </div>
            </div>
          )}

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
                <p className="text-[10px] text-muted-foreground truncate">{booking.user?.email || user?.email || ''}</p>
              </div>
              <div className="space-y-0.5 text-right">
                <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Durasi Sewa</p>
                <p className="text-xs sm:text-sm font-bold text-primary">{getDuration()}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(booking.startDate)} — {formatDate(booking.endDate)}</p>
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
        </div>

        {/* Sticky Footer Action */}
        <footer className="p-4 sm:p-5 bg-muted/20 border-t border-border flex flex-wrap gap-3 flex-shrink-0">
          {isAdmin && booking.status === 'Menunggu Konfirmasi' ? (
            <>
              <button 
                onClick={() => onValidate(booking, 'reject')}
                className="flex-1 py-3 px-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-base">cancel</span>
                Tolak Pesanan
              </button>
              <button 
                onClick={() => onValidate(booking, 'approve')}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"
              >
                <span className="material-symbols-outlined text-base">check_circle</span>
                Validasi / Setujui
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => window.print()} 
                className="flex-1 py-3 px-4 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Cetak Bukti
              </button>
              <button 
                onClick={onClose} 
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white hover:bg-primary/90 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-primary/20"
              >
                Tutup
              </button>
            </>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
};

// Admin Action Dialog for Validation (Shopee Seller Style)
const ValidationDialog = ({ booking, action, onClose, onConfirm }) => {
  const isApprove = action === 'approve';
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const APPROVE_TAGS = ['Armada Siap Digunakan', 'KTP/SIM Terverifikasi ✓', 'Jadwal Armada Sesuai'];
  const REJECT_TAGS = ['Jadwal Armada Bentrok', 'Foto KTP/SIM Tidak Jelas', 'Stok Armada Perawatan', 'Permintaan Pembatalan'];

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm(booking._id, action, notes);
    setIsSubmitting(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-card rounded-[2.5rem] p-8 max-w-md w-full border border-border shadow-2xl animate-zoom-in space-y-6 relative z-10" onClick={(e) => e.stopPropagation()}>
        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto shadow-inner ${isApprove ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}`}>
          <span className="material-symbols-outlined text-3xl">{isApprove ? 'verified' : 'cancel'}</span>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-2xl font-black text-foreground">{isApprove ? 'Setujui & Validasi Pesanan' : 'Tolak Pesanan Ini?'}</h3>
          <p className="text-xs text-muted-foreground">
            {isApprove 
              ? `Konfirmasi pesanan #${booking.orderId || booking._id?.slice(-8).toUpperCase()} untuk ${booking.car?.name}. Mobil akan ditandai sebagai Disewa.`
              : `Pesanan #${booking.orderId || booking._id?.slice(-8).toUpperCase()} akan dibatalkan dan armada dikembalikan ke status Tersedia.`}
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
            {isApprove ? 'Catatan Validasi (Opsional)' : 'Alasan Penolakan (Wajib/Pilihan)'}
          </label>
          
          <div className="flex flex-wrap gap-1.5">
            {(isApprove ? APPROVE_TAGS : REJECT_TAGS).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setNotes(tag)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  notes === tag 
                    ? (isApprove ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-destructive text-white border-destructive') 
                    : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <textarea
            className="w-full bg-muted/30 border border-border rounded-2xl p-4 text-xs font-bold text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all min-h-[90px] resize-none"
            placeholder={isApprove ? 'Masukkan catatan untuk pembeli...' : 'Tuliskan alasan penolakan pesanan...'}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="flex-1 py-4 rounded-2xl bg-muted text-foreground font-black text-xs uppercase tracking-wider hover:bg-muted/70 transition-all"
          >
            Batal
          </button>
          <button 
            type="button" 
            onClick={handleConfirm} 
            disabled={isSubmitting}
            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-wider text-white shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
              isApprove ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-destructive hover:opacity-90 shadow-destructive/20'
            }`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              isApprove ? 'Setujui Pesanan' : 'Tolak Pesanan'
            )}
          </button>
        </div>
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
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [validationModal, setValidationModal] = useState(null); // { booking, action: 'approve'|'reject' }
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin' || window.location.pathname.includes('/admin/');

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const endpoint = isAdmin ? '/bookings' : '/bookings/my-bookings';
      const res = await api.get(`${endpoint}?_t=${Date.now()}`);
      const data = res.data;
      const bookingsArray = Array.isArray(data) ? data : (data.data || []);
      setBookings(bookingsArray);
    } catch (err) {
      console.error('Fetch history error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [isAdmin]);

  const handleCancel = async (booking) => {
    try {
      await api.post(`/bookings/${booking._id}/cancel`);
      showToast('Pemesanan Berhasil Dibatalkan');
      fetchHistory();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Gagal membatalkan pesanan', 'error');
    }
    setBookingToCancel(null);
  };

  const handleDeletePermanent = async (booking) => {
    try {
      const res = await api.delete(`/bookings/${booking._id}`);
      showToast(res.data?.message || 'Data transaksi berhasil dihapus');
      fetchHistory();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Gagal menghapus data transaksi', 'error');
    }
    setBookingToDelete(null);
  };

  const handleValidateOrder = async (bookingId, action, notes) => {
    try {
      const res = await api.post(`/bookings/${bookingId}/validate`, { action, notes });
      showToast(res.data?.message || `Pesanan berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`);
      setValidationModal(null);
      setSelectedBooking(null);
      fetchHistory();
    } catch (err) {
      showToast(err.response?.data?.error || err.message || 'Gagal memproses validasi', 'error');
    }
  };

  // Count pending validations
  const pendingValidationCount = bookings.filter(b => b && b.status === 'Menunggu Konfirmasi').length;

  const filterOptions = isAdmin 
    ? [
        { key: 'Semua', label: 'Semua' },
        { key: 'Menunggu Konfirmasi', label: 'Perlu Validasi', badge: pendingValidationCount },
        { key: 'Aktif', label: 'Aktif' },
        { key: 'Selesai', label: 'Selesai' },
        { key: 'Dibatalkan', label: 'Dibatalkan / Ditolak' }
      ]
    : [
        { key: 'Semua', label: 'Semua' },
        { key: 'Menunggu Konfirmasi', label: 'Menunggu Validasi', badge: pendingValidationCount },
        { key: 'Aktif', label: 'Aktif' },
        { key: 'Selesai', label: 'Selesai' },
        { key: 'Dibatalkan', label: 'Dibatalkan / Ditolak' }
      ];

  const filtered = bookings.filter(b => {
    if (!b) return false;
    if (filter === 'Semua') return true;
    if (filter === 'Menunggu Konfirmasi') return b.status === 'Menunggu Konfirmasi';
    if (filter === 'Aktif') return b.status === 'Aktif' || b.status === 'Berjalan';
    if (filter === 'Selesai') return b.status === 'Selesai';
    if (filter === 'Dibatalkan') return b.status === 'Dibatalkan' || b.status === 'Ditolak' || b.status === 'Payment Failed';
    return b.status === filter;
  });

  return (
    <div className="p-6 lg:p-12 space-y-10 animate-fade-in max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-foreground uppercase">
            {isAdmin ? 'Pusat Validasi Transaksi' : 'Riwayat Pesanan'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {isAdmin ? 'Validasi dan kelola pesanan sewa mobil pelanggan secara langsung.' : 'Pantau status pemesanan dan kuitansi rental mobil Anda secara real-time.'}
          </p>
        </div>
        
        <div className="flex gap-2 p-1.5 bg-muted/30 border border-border rounded-2xl overflow-x-auto no-scrollbar">
          {filterOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase whitespace-nowrap transition-all flex items-center gap-2 ${
                filter === opt.key 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{opt.label}</span>
              {opt.badge > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black animate-pulse">
                  {opt.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Shopee-style Admin Banner if pending orders exist */}
      {isAdmin && pendingValidationCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">pending_actions</span>
            </div>
            <div>
              <p className="font-black text-foreground text-sm uppercase tracking-wide">
                Ada {pendingValidationCount} Pesanan Baru Menunggu Validasi
              </p>
              <p className="text-muted-foreground text-xs">
                Pembeli telah menyelesaikan pembayaran. Silakan setujui atau tolak pesanan armada.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setFilter('Menunggu Konfirmasi')}
            className="px-6 py-3 rounded-xl bg-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all self-start sm:self-auto"
          >
            Tinjau Sekarang ({pendingValidationCount})
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 w-full bg-muted animate-pulse rounded-2xl border border-border"></div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5">
          {filtered.length === 0 ? (
            <div className="text-center py-24 bg-card rounded-[2.5rem] border border-border shadow-sm space-y-6">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl opacity-20">receipt_long</span>
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-black uppercase tracking-widest">Tidak Ada Pesanan</p>
                <p className="text-muted-foreground text-sm">Tidak ditemukan data pesanan pada kategori filter ini.</p>
              </div>
              {!isAdmin && (
                <button onClick={() => navigate('/cars')} className="btn btn-primary px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest">Jelajahi Armada</button>
              )}
            </div>
          ) : (
            filtered.map((booking, idx) => {
              const isPendingConfirm = booking.status === 'Menunggu Konfirmasi';
              const isApproved = booking.status === 'Aktif';
              const isRejected = booking.status === 'Ditolak';

              return (
                <div 
                  key={booking._id || idx} 
                  className={`group bg-card border rounded-3xl p-5 lg:p-7 hover:border-primary/40 transition-all shadow-sm relative overflow-hidden space-y-5 ${
                    isPendingConfirm ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-border'
                  }`}
                >
                  <div 
                    className="flex flex-col md:flex-row md:items-center gap-6 cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
                    <div className="relative w-28 h-20 flex-shrink-0">
                      <img 
                        src={booking.car?.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover rounded-2xl shadow-inner border border-border/50" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-foreground text-base truncate">{booking.car?.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${
                          isPendingConfirm ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse' :
                          isApproved ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                          isRejected || booking.status === 'Dibatalkan' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                          booking.status === 'Selesai' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          'bg-primary/10 text-primary border-primary/20'
                        }`}>
                          {isPendingConfirm ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                              Menunggu Validasi Admin
                            </>
                          ) : isApproved ? (
                            <>
                              <span className="material-symbols-outlined text-xs">verified</span>
                              Pesanan Divalidasi (Aktif)
                            </>
                          ) : (
                            booking.status
                          )}
                        </span>
                      </div>

                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        {booking.user?.name ? `${booking.user.name} • ` : ''}{formatDate(booking.startDate)} — {formatDate(booking.endDate)} ({booking.totalDays || booking.days || 1} Hari)
                      </p>
                      
                      <p className="text-[10px] text-muted-foreground font-mono">
                        No. Pesanan: #{booking.orderId || booking._id?.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                      <div className="text-left md:text-right mr-2">
                        <p className="text-base font-black text-primary leading-none">Rp {(booking.totalPrice || booking.total || 0).toLocaleString('id-ID')}</p>
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Lunas (Paid)</p>
                      </div>
                      
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedBooking(booking); }}
                        className="px-4 py-2 rounded-xl bg-muted/40 hover:bg-muted text-xs font-bold text-foreground border border-border transition-all flex items-center gap-1"
                      >
                        Detail
                        <span className="material-symbols-outlined text-base">chevron_right</span>
                      </button>

                      {isAdmin ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setBookingToDelete(booking); }}
                          className="p-2 rounded-xl text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-all border border-border hover:border-destructive/30"
                          title="Hapus / Batalkan Data Transaksi"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      ) : (
                        (booking.status === 'Pending Payment' || booking.status === 'Menunggu Konfirmasi') && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setBookingToCancel(booking); }}
                            className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-all"
                            title="Batalkan Pesanan"
                          >
                            <span className="material-symbols-outlined text-lg">cancel</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Shopee-style Customer Status Callout */}
                  {isPendingConfirm && (
                    <div className="bg-amber-500/5 border border-amber-500/20 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 text-amber-500 font-bold">
                        <span className="material-symbols-outlined text-lg animate-spin">hourglass_bottom</span>
                        <span>{isAdmin ? 'Pesanan ini siap Anda validasi/setujui' : 'Pesanan sedang diproses & diverifikasi oleh admin'}</span>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setValidationModal({ booking, action: 'reject' }); }}
                            className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white text-xs font-black uppercase tracking-wider transition-all"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setValidationModal({ booking, action: 'approve' }); }}
                            className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-base">check</span>
                            Validasi & Setujui
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Notes if validated or rejected */}
                  {isApproved && booking.validationNotes && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">task_alt</span>
                      Catatan Admin: {booking.validationNotes}
                    </div>
                  )}

                  {isRejected && booking.rejectionReason && (
                    <div className="bg-destructive/5 border border-destructive/20 px-4 py-2.5 rounded-xl text-[11px] font-bold text-destructive flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">info</span>
                      Alasan Penolakan: {booking.rejectionReason}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Admin Delete Confirmation Modal */}
      {bookingToDelete && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={() => setBookingToDelete(null)}>
          <div className="bg-card rounded-[2.5rem] p-8 max-w-sm w-full border border-border shadow-2xl animate-zoom-in text-center space-y-6 relative z-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto shadow-inner text-destructive">
              <span className="material-symbols-outlined text-3xl">delete_forever</span>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-foreground">Hapus Data Transaksi?</h3>
              <p className="text-xs text-muted-foreground">
                Pilih tindakan untuk pesanan <span className="font-bold text-foreground">#{bookingToDelete.orderId || bookingToDelete._id?.slice(-8).toUpperCase()}</span>.
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={() => handleDeletePermanent(bookingToDelete)} 
                className="w-full py-3.5 rounded-2xl bg-destructive text-white font-black text-xs uppercase tracking-wider hover:opacity-90 transition-all shadow-lg shadow-destructive/20"
              >
                Hapus Permanen Dari Database
              </button>
              <button 
                onClick={() => handleCancel(bookingToDelete)} 
                className="w-full py-3.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 font-black text-xs uppercase tracking-wider hover:bg-amber-500 hover:text-white transition-all"
              >
                Ubah Status Jadi Dibatalkan
              </button>
              <button 
                onClick={() => setBookingToDelete(null)} 
                className="w-full py-3.5 rounded-2xl bg-muted text-foreground font-black text-xs uppercase tracking-wider hover:bg-muted/70 transition-all"
              >
                Batal
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Customer Cancel Confirmation */}
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

      {/* Full Receipt Modal */}
      {selectedBooking && (
        <ReceiptModal 
          booking={selectedBooking} 
          onClose={() => setSelectedBooking(null)}
          user={user}
          isAdmin={isAdmin}
          onValidate={(b, action) => {
            setValidationModal({ booking: b, action });
          }}
        />
      )}

      {/* Admin Shopee Validation Action Dialog */}
      {validationModal && (
        <ValidationDialog
          booking={validationModal.booking}
          action={validationModal.action}
          onClose={() => setValidationModal(null)}
          onConfirm={handleValidateOrder}
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