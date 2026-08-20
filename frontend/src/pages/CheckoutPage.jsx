import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [booking, setBooking] = useState(null);
  const [usePoints, setUsePoints] = useState(false);
  const [error, setError] = useState('');
  const [showDemoMidtrans, setShowDemoMidtrans] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('va');
  const [step, setStep] = useState(1);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    const savedBooking = localStorage.getItem('pending_booking');
    if (savedBooking) {
      setBooking(JSON.parse(savedBooking));
    } else {
      navigate('/cars');
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [navigate]);

  if (!booking || !booking.car) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  const days = booking.days;
  const subtotal = days * booking.car.pricePerDay;
  const insurance = 150000;
  const discountRate = 0.10; 
  const maxDiscount = subtotal * discountRate;
  const discountAmount = (usePoints && user?.points >= 1000) ? maxDiscount : 0;
  const total = subtotal - discountAmount + insurance;

  const createBookingOnBackend = async (finalData) => {
    try {
      const response = await api.post('/bookings', { 
        carId: finalData.car._id,
        startDate: finalData.startDate,
        endDate: finalData.endDate,
        usedPoints: finalData.usedPoints
      });

      if (finalData.usedPoints > 0) {
        updateUser({ points: user.points - finalData.usedPoints });
      }

      return response.data;
    } catch (err) {
      console.error('Backend Booking Error:', err.message);
      throw err;
    }
  };

  const handleCancelOrder = () => {
    localStorage.removeItem('pending_booking');
    navigate('/cars');
  };

  const checkPaymentStatus = (orderId) => {
    let attempts = 0;
    const maxAttempts = 20;
    
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const response = await api.get(`/payment/status/${orderId}`);
        const data = response.data;
        
        if (data.paymentStatus === 'paid') {
          clearInterval(pollIntervalRef.current);
          setIsSuccess(true);
          localStorage.removeItem('pending_booking');
          setTimeout(() => navigate('/history'), 3000);
        } else if (data.paymentStatus === 'failed' || data.paymentStatus === 'expired') {
          clearInterval(pollIntervalRef.current);
          setIsProcessing(false);
          setError(`Pembayaran ${data.paymentStatus === 'expired' ? 'kedaluwarsa' : 'gagal'}.`);
        }
      } catch (err) {
        console.error('Polling error:', err.message);
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollIntervalRef.current);
        navigate('/history');
      }
    }, 3000);
  };

  const handleConfirm = async () => {
    if (step === 1) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const userPoints = Number(user?.points || 0);
    if (usePoints && userPoints < 1000) {
      setError('Insufficient points (Min. 1,000 required).');
      return;
    }

    try {
      setIsProcessing(true);
      setError('');

      // 1. Create the booking on the backend
      const bookingRecord = await createBookingOnBackend({
        car: booking.car,
        startDate: booking.startDate,
        endDate: booking.endDate,
        usedPoints: usePoints ? 1000 : 0,
      });
      
      // 2. Initiate Payment Transaction
      const response = await api.post('/payment/create-transaction', { 
        bookingData: { orderId: bookingRecord.orderId } 
      });
      
      const data = response.data;

      if (data.isDemo) {
        setShowDemoMidtrans(true);
        setIsProcessing(false);
        window.confirmDemoPayment = async () => {
          setIsProcessing(true);
          try {
            await api.post('/payment/demo-confirm', { orderId: data.orderId });
            checkPaymentStatus(data.orderId);
          } catch (err) {
            setError(err.message || 'Gagal konfirmasi demo.');
            setIsProcessing(false);
          }
        };
        return;
      }

      if (typeof window.snap !== 'undefined') {
        window.snap.pay(data.token, {
          onSuccess: () => {
            setIsProcessing(true);
            checkPaymentStatus(data.orderId);
          },
          onPending: () => {
            localStorage.removeItem('pending_booking');
            navigate('/history');
          },
          onError: () => {
            setIsProcessing(false);
            setError('Payment failed, please try again.');
          },
          onClose: () => {
            setIsProcessing(true);
            checkPaymentStatus(data.orderId);
          }
        });
      }
    } catch (err) {
      setIsProcessing(false);
      setError(err.message || 'An error occurred during synchronization.');
    }
  };

  return (
    <div className="p-6 lg:p-12 space-y-12 animate-fade-in max-w-7xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[
          { id: 1, label: 'Rincian Pesanan' },
          { id: 2, label: 'Pembayaran' }
        ].map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${step >= s.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                {step > s.id ? <span className="material-symbols-outlined text-sm">check</span> : s.id}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s.id ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
            </div>
            {i === 0 && <div className={`w-12 h-0.5 rounded-full ${step > 1 ? 'bg-primary' : 'bg-muted'}`}></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          {step === 1 ? (
            <div className="space-y-8 animate-slide-up">
              <header>
                <h1 className="text-4xl font-black tracking-tight">Rincian Pemesanan</h1>
                <p className="text-muted-foreground mt-2">Periksa kembali mobil pilihan dan jadwal sewa Anda.</p>
              </header>

              <div className="card space-y-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <img src={booking.car.imageUrl} alt="" className="w-full md:w-64 h-40 object-cover rounded-[2rem] shadow-2xl border border-border/50" />
                  <div className="space-y-4 flex-1">
                    <div>
                      <h2 className="text-2xl font-black text-foreground mb-1">{booking.car.name}</h2>
                      <p className="text-xs font-bold text-primary uppercase tracking-widest">{booking.car.brand} • {booking.car.year}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="px-4 py-2 bg-muted/30 rounded-xl border border-border/50">
                        <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Durasi Sewa</p>
                        <p className="text-sm font-black text-foreground">{booking.days} Hari</p>
                      </div>
                      <div className="px-4 py-2 bg-muted/30 rounded-xl border border-border/50">
                        <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Titik Jemput</p>
                        <p className="text-sm font-black text-foreground">{booking.pickup}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-border">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Mulai Sewa</p>
                    <div className="p-5 bg-muted/20 rounded-2xl border border-border/50 flex items-center gap-4">
                      <span className="material-symbols-outlined text-primary">event_upcoming</span>
                      <span className="font-bold text-sm">{new Date(booking.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Selesai Sewa</p>
                    <div className="p-5 bg-muted/20 rounded-2xl border border-border/50 flex items-center gap-4">
                      <span className="material-symbols-outlined text-primary">event_available</span>
                      <span className="font-bold text-sm">{new Date(booking.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center gap-2 text-destructive hover:opacity-70 transition-all font-black text-[10px] uppercase tracking-widest"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                Batalkan Pemesanan
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-slide-up">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-black tracking-tight">Metode Pembayaran</h1>
                  <p className="text-muted-foreground mt-2">Pilih metode pembayaran aman yang Anda inginkan.</p>
                </div>
                <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-3 rounded-2xl hover:bg-muted text-xs font-black uppercase tracking-widest transition-all">
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  Kembali
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'va', label: 'Virtual Account Bank', sub: 'BCA, Mandiri, BNI, BRI', icon: 'account_balance' },
                  { id: 'ewallet', label: 'Dompet Digital (E-Wallet)', sub: 'GoPay, OVO, DANA, ShopeePay', icon: 'account_balance_wallet' },
                  { id: 'qris', label: 'QRIS Scan', sub: 'Standar QR Nasional (BCA, GoPay, dll)', icon: 'qr_code_scanner' },
                ].map(method => (
                  <button 
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-6 rounded-3xl border-2 transition-all flex items-start gap-4 text-left group ${selectedMethod === method.id ? 'border-primary bg-primary/5 shadow-xl shadow-primary/5' : 'border-border bg-card hover:border-primary/20'}`}
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${selectedMethod === method.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
                      <span className="material-symbols-outlined text-2xl">{method.icon}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-foreground mb-1">{method.label}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{method.sub}</p>
                    </div>
                    {selectedMethod === method.id && <span className="material-symbols-outlined text-primary">verified</span>}
                  </button>
                ))}
              </div>

              {/* Loyalty Reward */}
              <div className="p-8 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[80px] group-hover:scale-150 transition-transform duration-1000"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-3xl flex items-center justify-center text-primary shadow-2xl">
                      <span className="material-symbols-outlined text-3xl">stars</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-black tracking-tight">Gunakan Poin Loyalitas</h4>
                      <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Tersedia: {user?.points?.toLocaleString('id-ID')} Poin</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="sr-only peer" />
                    <div className="w-14 h-8 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary border border-zinc-700"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4 lg:sticky lg:top-28">
          <div className="card !p-0 overflow-hidden shadow-2xl border-primary/20 flex flex-col h-fit">
            <div className="p-8 space-y-8">
              <h3 className="text-xl font-black uppercase tracking-widest text-foreground">Rincian Pembayaran</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium italic">Biaya Sewa Pokok ({booking.days} Hari)</span>
                  <span className="font-black text-foreground">Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium italic">Asuransi & Proteksi Layanan</span>
                  <span className="font-black text-foreground">Rp {insurance.toLocaleString('id-ID')}</span>
                </div>
                {usePoints && (
                  <div className="flex justify-between items-center text-sm p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                    <span className="text-green-500 font-black uppercase tracking-widest text-[10px]">Diskon Poin</span>
                    <span className="font-black text-green-500">- Rp {discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-border space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total Tagihan</span>
                  <span className="text-4xl font-black text-primary tracking-tighter">Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-widest rounded-2xl border border-destructive/20 text-center animate-shake">
                  {error}
                </div>
              )}

              <button 
                onClick={handleConfirm}
                disabled={isProcessing}
                className="btn btn-primary w-full py-5 text-sm font-black uppercase tracking-widest shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    {step === 1 ? 'Lanjut ke Pembayaran' : 'Bayar Sekarang'}
                    <span className="material-symbols-outlined text-lg">{step === 1 ? 'arrow_forward' : 'lock'}</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="p-4 bg-muted/30 flex items-center justify-center gap-3 border-t border-border">
              <span className="material-symbols-outlined text-primary text-base">verified_user</span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Transaksi Terenkripsi & Aman</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-overlay backdrop-blur-md animate-fade-in">
          <div className="bg-card rounded-[2.5rem] p-10 max-w-sm w-full border border-border shadow-2xl animate-zoom-in text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto shadow-inner text-destructive">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-foreground">Batalkan Pesanan?</h3>
              <p className="text-sm text-muted-foreground">Proses pemesanan ini akan dibatalkan dan Anda akan diarahkan kembali ke katalog armada.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button onClick={handleCancelOrder} className="w-full py-4 rounded-2xl bg-destructive text-white font-black hover:opacity-90 transition-all shadow-xl shadow-destructive/20">Ya, Batalkan</button>
              <button onClick={() => setShowCancelConfirm(false)} className="w-full py-4 rounded-2xl bg-muted text-foreground font-black hover:bg-muted transition-all">Lanjutkan Pesanan</button>
            </div>
          </div>
        </div>
      )}

      {/* Demo Payment Modal */}
      {showDemoMidtrans && !isSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-overlay backdrop-blur-md animate-fade-in">
          <div className="bg-card rounded-[2.5rem] p-10 max-w-md w-full border border-border shadow-2xl animate-zoom-in text-center space-y-8">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto text-primary shadow-inner">
              <span className="material-symbols-outlined text-4xl">sim_card</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-foreground">Simulator Pembayaran</h2>
              <p className="text-sm text-muted-foreground">Ini adalah lingkungan simulasi / uji coba. Saldo rekening Anda tidak akan terpotong.</p>
            </div>
            <div className="p-6 bg-muted/30 rounded-[2rem] border border-border space-y-1">
               <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total yang Dibayar</p>
               <p className="text-3xl font-black text-primary">Rp {total.toLocaleString('id-ID')}</p>
            </div>
            <div className="space-y-3 pt-2">
              <button 
                onClick={() => window.confirmDemoPayment()}
                disabled={isProcessing}
                className="w-full py-5 rounded-2xl bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all shadow-xl"
              >
                {isProcessing ? 'Memproses...' : 'Konfirmasi Simulasi Pembayaran'}
              </button>
              <button onClick={() => setShowDemoMidtrans(false)} className="text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-colors">Tutup Simulator</button>
            </div>
          </div>
        </div>
      )}

      {/* Success View */}
      {isSuccess && (
        <div className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-center p-8 text-center animate-fade-in text-white overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full animate-pulse"></div>
          </div>
          <div className="relative z-10 space-y-10 max-w-lg">
            <div className="w-32 h-32 bg-primary rounded-[2.5rem] flex items-center justify-center mx-auto shadow-[0_0_80px_rgba(79,70,229,0.5)] animate-bounce-subtle border border-white/20">
              <span className="material-symbols-outlined text-7xl font-bold">verified</span>
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl font-black tracking-tighter uppercase">Pemesanan Berhasil</h2>
              <p className="text-white/60 text-lg font-medium leading-relaxed">Terima kasih. Mobil <span className="text-white font-black">{booking.car.name}</span> Anda siap disiapkan untuk perjalanan terbaik Anda.</p>
            </div>
            <div className="pt-8">
              <div className="w-64 mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="bg-primary h-full animate-[progress_3s_linear]"></div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mt-6 animate-pulse">Mengalihkan ke riwayat pesanan...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;