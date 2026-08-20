import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const CarsPage = () => {
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCar, setSelectedCar] = useState(null);
  const [bookingDates, setBookingDates] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    pickup: 'Kantor Pusat (Bandara)'
  });

  useEffect(() => {
    const controller = new AbortController();
    
    const fetchCars = async (pageNumber = 1) => {
      try {
        setLoading(true);
        const catQuery = category !== 'Semua' ? `&category=${encodeURIComponent(category)}` : '';
        const res = await api.get(`/cars?page=${pageNumber}&limit=9&search=${encodeURIComponent(search)}${catQuery}`, {
          signal: controller.signal
        });
        const data = res.data;
        const carsData = data.data || data;
        const parsedCars = Array.isArray(carsData) ? carsData : [];
        const total = data.meta?.total || data.total || parsedCars.length;
        const pages = data.meta?.totalPages || Math.max(1, Math.ceil(total / 9));
        setCars(parsedCars);
        setTotalPages(pages);
        setTotalCount(total);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error('Failed to fetch cars:', err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchCars(page);
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [page, search, category]);

  const handleBookingConfirm = () => {
    const start = new Date(bookingDates.start);
    const end = new Date(bookingDates.end);
    const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;

    const pendingBooking = {
      car: selectedCar,
      startDate: bookingDates.start,
      endDate: bookingDates.end,
      days: diffDays,
      pickup: bookingDates.pickup
    };

    localStorage.setItem('pending_booking', JSON.stringify(pendingBooking));
    navigate('/checkout');
  };

  return (
    <div className="p-6 lg:p-12 space-y-10 animate-fade-in">
      <header className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground">Katalog Armada</h2>
            <p className="text-muted-foreground mt-2 text-lg">
              Pilih kendaraan mewah untuk momen tak terlupakan Anda.
              {totalCount > 0 && <span className="text-primary font-bold ml-2">({totalCount} unit tersedia)</span>}
            </p>
          </div>
          
          <div className="relative group min-w-[300px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">search</span>
            <input 
              type="text"
              placeholder="Cari mobil impian..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-card border border-border focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-medium text-sm"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {['Semua', 'Luxury Sedan', 'SUV Premium', 'Sports Car', 'Convertible', 'Electric'].map(cat => (
            <button 
              key={cat} 
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`px-5 py-2.5 rounded-full border text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${
                category === cat 
                  ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                  : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-[2.5rem] bg-muted animate-pulse border border-border"></div>
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-[2.5rem] border border-border shadow-sm space-y-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-4xl opacity-30">directions_car</span>
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-black text-xl uppercase tracking-tight">Tidak Ada Mobil Ditemukan</p>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">Coba ubah kata kunci pencarian atau pilih kategori lain untuk melihat armada kami.</p>
          </div>
          {(search || category !== 'Semua') && (
            <button 
              onClick={() => { setSearch(''); setCategory('Semua'); setPage(1); }}
              className="btn btn-primary px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest"
            >
              Reset Filter Pencarian
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 content-auto">
            {cars.map((car) => (
              <div key={car._id || car.id} className="group card !p-0 overflow-hidden flex flex-col hover:border-primary/40 transition-colors">
                <div className="relative h-64 overflow-hidden">
                  <img src={car.imageUrl} alt={car.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  <div className="absolute top-5 right-5 px-3 py-1 bg-white/90 dark:bg-zinc-900/90 rounded-full text-[10px] font-black text-foreground shadow-sm uppercase tracking-widest border border-border">
                    {car.category || 'Luxury'}
                  </div>
                </div>
                
                <div className="p-8 flex-1 flex flex-col space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black text-foreground leading-none mb-1">{car.name}</h3>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{car.brand} • {car.year}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-1 rounded-lg">
                      <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-[10px] font-black text-amber-500 uppercase">{car.rating || '4.9'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 py-4 border-y border-border/50">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">settings</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{car.transmission || 'Otomatis'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">person</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{car.seats || '5'} Kursi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">local_gas_station</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{car.fuel || 'Bensin'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Harga Sewa / Hari</p>
                      <p className="text-xl font-black text-primary leading-none">Rp {car.pricePerDay?.toLocaleString('id-ID')}</p>
                    </div>
                    <button
                      onClick={() => setSelectedCar(car)}
                      disabled={car.status !== 'Tersedia'}
                      className={`btn btn-primary px-8 py-3.5 rounded-2xl text-xs font-black tracking-widest uppercase ${car.status !== 'Tersedia' ? 'opacity-50 grayscale pointer-events-none' : ''}`}
                    >
                      {car.status === 'Tersedia' ? 'Sewa Sekarang' : car.status}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Enhanced Numbered Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-wrap justify-center items-center pt-10 gap-2">
              <button 
                onClick={() => { setPage(p => Math.max(p - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                disabled={page === 1} 
                className="px-4 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm gap-1 text-xs font-black uppercase tracking-wider"
              >
                <span className="material-symbols-outlined text-lg">chevron_left</span>
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              <div className="flex items-center gap-1.5 px-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => { setPage(num); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`w-12 h-12 rounded-2xl font-black text-xs transition-all ${
                      page === num 
                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105' 
                        : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => { setPage(p => Math.min(p + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} 
                disabled={page === totalPages} 
                className="px-4 h-12 rounded-2xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary disabled:opacity-30 transition-all shadow-sm gap-1 text-xs font-black uppercase tracking-wider"
              >
                <span className="hidden sm:inline">Berikutnya</span>
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Premium Booking Modal */}
      {selectedCar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/75 animate-fade-in">
          <div className="bg-card rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-zoom-in border border-border">
            <div className="relative h-48">
              <img src={selectedCar.imageUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent flex flex-col justify-end p-8">
                <h3 className="text-white font-black text-3xl mb-1">{selectedCar.name}</h3>
                <p className="text-primary font-bold text-xs uppercase tracking-widest">{selectedCar.brand} • Layanan Rental</p>
              </div>
              <button onClick={() => setSelectedCar(null)} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-all">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 lg:p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mulai Sewa</label>
                  <input 
                    type="date" 
                    className="w-full p-4 rounded-2xl bg-muted/30 border border-border text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    value={bookingDates.start}
                    onChange={(e) => setBookingDates({...bookingDates, start: e.target.value})}
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Selesai Sewa</label>
                  <input 
                    type="date" 
                    className="w-full p-4 rounded-2xl bg-muted/30 border border-border text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                    value={bookingDates.end}
                    onChange={(e) => setBookingDates({...bookingDates, end: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Titik Penjemputan</label>
                <div className="relative">
                  <select 
                    className="w-full p-4 pr-10 rounded-2xl bg-muted/30 border border-border text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all appearance-none"
                    value={bookingDates.pickup}
                    onChange={(e) => setBookingDates({...bookingDates, pickup: e.target.value})}
                  >
                    <option>Kantor Pusat (Bandara)</option>
                    <option>Stasiun Kota</option>
                    <option>Lobi Hotel (Area Kota)</option>
                    <option>Antar ke Rumah (Surcharge)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">expand_more</span>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <button 
                  onClick={handleBookingConfirm}
                  className="w-full py-5 rounded-2xl bg-primary text-white font-black text-sm shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:-translate-y-1 transition-all uppercase tracking-widest"
                >
                  Lanjut ke Pembayaran
                </button>
                <p className="text-center text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Pembayaran dan konfirmasi pada langkah berikutnya</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarsPage;