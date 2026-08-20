import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const ReturnCar = () => {
  const [activeBookings, setActiveBookings] = useState([]);
  const [delayedCount, setDelayedCount] = useState(0);
  const [modal, setModal] = useState(null); 
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      const res = await api.get('/bookings');
      const history = res.data;
      const active = (Array.isArray(history) ? history : []).filter(b => b.status === 'Aktif' || b.status === 'Berjalan');
      setActiveBookings(active);
      const delayed = active.filter(b => {
        if (!b.endDate) return false;
        return new Date(b.endDate) < new Date();
      }).length;
      setDelayedCount(delayed);
    } catch (err) {
      console.error('Failed to load active bookings:', err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReturn = async () => {
    const { booking } = modal;
    try {
      await api.post(`/bookings/${booking._id}/return`, { lateFee: 0 });
      showToast(`Pengembalian mobil ${booking.car?.name} berhasil diproses`);
      loadData();
      setModal(null);
    } catch (err) {
      showToast(err.message || 'Gagal memproses pengembalian', 'error');
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isDelayed = (endDate) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  return (
    <div className="p-6 lg:p-12 space-y-12 animate-fade-in max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground uppercase">Pengembalian Mobil</h2>
          <p className="text-muted-foreground font-medium flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Logistik Aktif
            </span>
            Pelacakan mobil yang sedang berjalan dan pengembalian unit
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card p-8 group">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-3xl">deployed_code</span>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Mobil Sedang Disewa</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-foreground tracking-tighter">{activeBookings.length}</p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Unit di lapangan</span>
                </div>
            </div>
          </div>
        </div>
        <div className="card p-8 group">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center shadow-inner transition-transform group-hover:scale-110 ${
                delayedCount > 0 ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-success/10 border-success/20 text-success'
            }`}>
                <span className="material-symbols-outlined text-3xl">{delayedCount > 0 ? 'history_toggle_off' : 'check_circle'}</span>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">Terlambat Kembali</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black text-foreground tracking-tighter">{delayedCount}</p>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Unit terlambat</span>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <header className="p-8 border-b border-border bg-muted/10 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Daftar Rental Berjalan</h3>
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/5 border-b border-border">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Kendaraan & Penyewa</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Periode Sewa</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status Waktu</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Proses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeBookings.length === 0 ? (
                <tr>
                    <td colSpan="4" className="py-24 text-center">
                        <div className="flex flex-col items-center gap-6 opacity-20">
                            <span className="material-symbols-outlined text-7xl">cloud_done</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Semua Unit Mobil Berada di Pool</p>
                        </div>
                    </td>
                </tr>
              ) : (
                activeBookings.map(b => {
                  const delayed = isDelayed(b.endDate);
                  return (
                    <tr key={b._id} className="hover:bg-muted/5 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-14 rounded-2xl overflow-hidden bg-muted border border-border group-hover:scale-105 transition-transform shadow-sm">
                            <img src={b.car?.imageUrl} alt={b.car?.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-black text-foreground text-sm uppercase tracking-tight">{b.user?.name || 'Pelanggan'}</p>
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{b.car?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3 text-muted-foreground">
                            <span className="text-[11px] font-black uppercase tracking-widest">{formatDate(b.startDate)}</span>
                            <span className="material-symbols-outlined text-[10px]">trending_flat</span>
                            <span className={`text-[11px] font-black uppercase tracking-widest ${delayed ? 'text-destructive' : ''}`}>
                                {formatDate(b.endDate)}
                            </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.15em] border ${
                            delayed ? 'bg-destructive/5 text-destructive border-destructive/20 animate-pulse' : 'bg-primary/5 text-primary border-primary/20'
                        }`}>
                          {delayed ? 'Terlambat' : 'Sedang Berjalan'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button onClick={() => setModal({ booking: b })}
                          className="px-6 py-3 bg-card border border-border rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-1 transition-all shadow-xl group-hover:shadow-primary/20">
                          Selesaikan Pengembalian
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-card border border-border rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center space-y-8">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto shadow-inner">
                    <span className="material-symbols-outlined text-4xl text-primary">published_with_changes</span>
                </div>
                <div className="space-y-2">
                    <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">Konfirmasi Pengembalian</h3>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                        Konfirmasi pengembalian unit <span className="text-foreground font-black">{modal.booking.car?.name}</span>? Status mobil akan kembali 'Tersedia' dan pesanan diselesaikan.
                    </p>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setModal(null)} className="flex-1 py-4 rounded-2xl border border-border text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all">Batal</button>
                    <button onClick={handleReturn} className="flex-1 py-4 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:brightness-110 shadow-2xl shadow-primary/20 transition-all">Ya, Selesaikan</button>
                </div>
            </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-12 right-12 z-[100] animate-slide-up">
            <div className="bg-card/80 backdrop-blur-3xl border border-border shadow-2xl p-6 rounded-[2rem] flex items-center gap-6 min-w-[340px]">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                    toast.type === 'success' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                }`}>
                    <span className="material-symbols-outlined text-2xl">{toast.type === 'success' ? 'verified' : 'report'}</span>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">{toast.type === 'success' ? 'Berhasil' : 'Peringatan'}</p>
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed">{toast.msg}</p>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ReturnCar;