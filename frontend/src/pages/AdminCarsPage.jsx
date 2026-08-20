import { useState, useEffect } from 'react';
import api from '../utils/api';

const EMPTY_CAR = {
  id: '', name: '', brand: '', category: 'Luxury Sedan', year: new Date().getFullYear(),
  seats: 5, transmission: 'Automatic', fuel: 'Bensin', pricePerDay: '', stock: 10,
  status: 'Tersedia', rating: 4.5, reviews: 0, features: '', imageUrl: '',
};
const CATEGORIES = ['Luxury Sedan', 'Sports Car', 'SUV Premium', 'Convertible', 'Electric'];
const TRANSMISSIONS = ['Automatic', 'Manual'];
const FUELS = ['Bensin', 'Diesel', 'Electric', 'Hybrid'];

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-12 right-12 z-[100] animate-slide-up">
        <div className="bg-card border border-border shadow-xl p-6 rounded-2xl flex items-center gap-6 min-w-[340px]">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                type === 'success' ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
            }`}>
                <span className="material-symbols-outlined text-2xl">{type === 'success' ? 'verified' : 'report'}</span>
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground">{type === 'success' ? 'Berhasil' : 'Peringatan'}</p>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">{msg}</p>
            </div>
        </div>
    </div>
  );
};

const DeleteModal = ({ car, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/75 animate-fade-in">
    <div className="bg-card border border-border rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center space-y-8">
      <div className="w-20 h-20 rounded-3xl bg-destructive/10 flex items-center justify-center mx-auto shadow-inner">
        <span className="material-symbols-outlined text-4xl text-destructive">delete_forever</span>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-foreground tracking-tight uppercase">Hapus Mobil?</h3>
        <p className="text-muted-foreground text-sm font-medium">Anda akan menghapus mobil <span className="text-foreground font-black tracking-tight">{car?.name}</span> dari daftar armada. Tindakan ini tidak dapat dibatalkan.</p>
      </div>
      <div className="flex flex-col gap-3 pt-2">
        <button onClick={onConfirm} className="w-full py-5 rounded-2xl bg-destructive text-white font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 shadow-xl shadow-destructive/20 transition-all">Ya, Hapus Mobil</button>
        <button onClick={onCancel} className="w-full py-5 rounded-2xl bg-muted text-foreground font-black text-xs uppercase tracking-[0.2em] hover:bg-muted/80 transition-all">Batal</button>
      </div>
    </div>
  </div>
);

const Field = ({ label, error, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">{label}</label>
    {children}
    {error && <p className="text-[10px] text-destructive font-black uppercase tracking-widest mt-1 flex items-center gap-2 ml-1"><span className="material-symbols-outlined text-xs">report</span>{error}</p>}
  </div>
);

const inputClass = (err) => `w-full bg-muted/30 border rounded-2xl px-6 py-4 text-sm font-bold text-foreground outline-none transition-all placeholder:text-muted-foreground/30 ${err ? 'border-destructive/50 focus:ring-4 focus:ring-destructive/10' : 'border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/5'}`;

const QUICK_IMAGES = [
  { label: 'Sedan Mewah', url: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80' },
  { label: 'SUV Premium', url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80' },
  { label: 'Mobil Sport', url: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&auto=format&fit=crop&q=80' },
  { label: 'Mobil Listrik', url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80' },
];

const CarFormModal = ({ car, onClose, onSave }) => {
  const isEdit = !!car;
  const [form, setForm] = useState({
    name: car?.name || '',
    brand: car?.brand || '',
    category: car?.category || 'Luxury Sedan',
    year: car?.year || new Date().getFullYear(),
    pricePerDay: car?.pricePerDay || '',
    seats: car?.seats || 5,
    transmission: car?.transmission || 'Automatic',
    fuel: car?.fuel || 'Bensin',
    status: car?.status || 'Tersedia',
    stock: car?.stock ?? 1,
    imageUrl: car?.imageUrl || '',
    features: car?.features && Array.isArray(car.features) ? car.features.join(', ') : (car?.features || ''),
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [imgStatus, setImgStatus] = useState(car?.imageUrl ? 'loaded' : 'idle');

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'imageUrl') {
      setImgStatus(value.trim() ? 'loading' : 'idle');
    }
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name || !form.name.trim()) e.name = 'Nama mobil wajib diisi';
    if (!form.brand || !form.brand.trim()) e.brand = 'Merk mobil wajib diisi';
    if (!form.pricePerDay || isNaN(form.pricePerDay) || Number(form.pricePerDay) <= 0) e.pricePerDay = 'Harga sewa harus berupa angka positif';
    if (!form.imageUrl || !form.imageUrl.trim()) e.imageUrl = 'URL Foto mobil wajib diisi';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    const featuresArr = typeof form.features === 'string'
      ? form.features.split(',').map((f) => f.trim()).filter(Boolean)
      : (Array.isArray(form.features) ? form.features : []);
    
    await onSave({
      ...form,
      _id: car?._id || car?.id,
      pricePerDay: Number(form.pricePerDay),
      stock: Number(form.stock) || 1,
      year: Number(form.year) || new Date().getFullYear(),
      seats: Number(form.seats) || 5,
      features: featuresArr,
    });
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/75 animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-card border border-border rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between px-10 py-8 border-b border-border bg-muted/10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-3xl text-primary">{isEdit ? 'inventory' : 'add_to_photos'}</span>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">{isEdit ? 'Edit Data Mobil' : 'Tambah Mobil Baru'}</h2>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">{isEdit ? `ID: ${car._id || car.id}` : 'Tambahkan unit kendaraan baru ke dalam armada'}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-muted/50 transition-all text-muted-foreground flex items-center justify-center border border-border"><span className="material-symbols-outlined">close</span></button>
        </header>

        <div className="overflow-y-auto flex-1 px-10 py-8 space-y-8 no-scrollbar">
          {/* Dynamic Image Preview */}
          <div className="h-52 rounded-[2rem] overflow-hidden bg-muted/30 border border-border relative flex items-center justify-center group">
            {form.imageUrl ? (
              <>
                <img 
                  src={form.imageUrl} 
                  alt="preview" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onLoad={() => setImgStatus('loaded')}
                  onError={() => setImgStatus('error')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20"></div>
                
                <div className="absolute bottom-5 left-5 flex items-center gap-2">
                  {imgStatus === 'loaded' && (
                    <span className="px-3.5 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Foto Terpasang
                    </span>
                  )}
                  {imgStatus === 'error' && (
                    <span className="px-3.5 py-1.5 bg-destructive/20 text-destructive border border-destructive/30 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                      <span className="material-symbols-outlined text-sm">error</span>
                      URL Gambar Tidak Valid / Rusak
                    </span>
                  )}
                  {imgStatus === 'loading' && (
                    <span className="px-3.5 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-sm animate-pulse">
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      Memuat Gambar...
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 p-6 text-center text-muted-foreground/60">
                <span className="material-symbols-outlined text-4xl text-primary/40">add_photo_alternate</span>
                <p className="text-xs font-bold">Masukkan URL gambar di bawah untuk melihat pratinjau</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2 space-y-3">
              <Field label="URL Foto Mobil" error={errors.imageUrl}>
                <input 
                  className={inputClass(errors.imageUrl)} 
                  placeholder="https://images.unsplash.com/photo-..." 
                  value={form.imageUrl} 
                  onChange={(e) => set('imageUrl', e.target.value)} 
                />
              </Field>
              
              {/* Quick Sample Image Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Pilihan Cepat:</span>
                {QUICK_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => set('imageUrl', preset.url)}
                    className="px-3 py-1 bg-muted/40 hover:bg-primary/10 hover:text-primary hover:border-primary/40 border border-border rounded-lg text-[9px] font-bold transition-all"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <Field label="Nama Mobil" error={errors.name}>
                <input className={inputClass(errors.name)} placeholder="Contoh: Mercedes-Benz S-Class" value={form.name} onChange={(e) => set('name', e.target.value)} />
              </Field>
            </div>
            <Field label="Merk / Brand" error={errors.brand}>
              <input className={inputClass(errors.brand)} placeholder="Contoh: Mercedes-Benz" value={form.brand} onChange={(e) => set('brand', e.target.value)} />
            </Field>
            <Field label="Kategori Mobil">
              <select className={inputClass()} value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} className="bg-card text-foreground">{c}</option>)}
              </select>
            </Field>
            <Field label="Tahun Pembuatan">
              <input type="number" className={inputClass()} value={form.year} onChange={(e) => set('year', e.target.value)} />
            </Field>
            <Field label="Kapasitas Penumpang (Kursi)">
              <input type="number" min={2} max={12} className={inputClass()} value={form.seats} onChange={(e) => set('seats', e.target.value)} />
            </Field>
            <Field label="Transmisi">
              <select className={inputClass()} value={form.transmission} onChange={(e) => set('transmission', e.target.value)}>
                {TRANSMISSIONS.map((t) => <option key={t} className="bg-card text-foreground">{t}</option>)}
              </select>
            </Field>
            <Field label="Bahan Bakar">
              <select className={inputClass()} value={form.fuel} onChange={(e) => set('fuel', e.target.value)}>
                {FUELS.map((f) => <option key={f} className="bg-card text-foreground">{f}</option>)}
              </select>
            </Field>
            <Field label="Harga Sewa / Hari (Rp)" error={errors.pricePerDay}>
              <input type="number" className={inputClass(errors.pricePerDay)} placeholder="0" value={form.pricePerDay} onChange={(e) => set('pricePerDay', e.target.value)} />
            </Field>
            <Field label="Jumlah Stok Unit">
              <input type="number" className={inputClass()} value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Status Mobil">
                <div className="flex gap-3">
                  {['Tersedia', 'Disewa', 'Perawatan'].map(s => (
                    <button 
                      key={s} 
                      type="button"
                      onClick={() => set('status', s)}
                      className={`flex-1 py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${
                        form.status === s ? 'bg-primary/10 border-primary text-primary shadow-inner' : 'bg-muted/30 border-border text-muted-foreground'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Fitur Unggulan (Pisahkan dengan Koma)">
                <textarea className={`${inputClass()} min-h-[100px] resize-none`} placeholder="Audio Premium, Kursi Pijat, Sunroof, Navigasi GPS" value={typeof form.features === 'string' ? form.features : form.features?.join(', ') || ''} onChange={(e) => set('features', e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        <footer className="flex items-center gap-4 px-10 py-8 border-t border-border bg-muted/10">
          <button onClick={onClose} className="flex-1 py-5 rounded-2xl border border-border text-muted-foreground font-black text-[10px] uppercase tracking-widest hover:bg-muted/50 transition-all">Batal</button>
          <button onClick={handleSave} disabled={isSaving} className="flex-[2] py-5 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50">
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-base">{isEdit ? 'verified' : 'add_task'}</span>
                {isEdit ? 'Simpan Perubahan' : 'Tambah Mobil'}
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

const AdminCarsPage = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchCars = async () => {
    try {
      const response = await api.get(`/cars?limit=100&_t=${Date.now()}`);
      const responseData = response.data;
      const list = Array.isArray(responseData) ? responseData : (responseData?.data || responseData?.cars || []);
      setCars(list);
    } catch (err) {
      console.error('Failed to fetch cars:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCars(); }, []);

  const showToast = (msg, type = 'success') => setToast({ msg, type });
  const handleAdd = () => setModal({ type: 'add' });
  const handleEdit = (car) => setModal({ type: 'edit', car: { ...car, features: car.features && Array.isArray(car.features) ? car.features.join(', ') : car.features || '' } });
  const handleDelete = (car) => setModal({ type: 'delete', car });

  const handleSaveCar = async (data) => {
    try {
      const isEdit = modal.type === 'edit';
      const carId = data._id || modal.car?._id || modal.car?.id;
      
      // Optimistic update for immediate visual feedback
      if (isEdit && carId) {
        setCars((prev) => prev.map((c) => (c._id === carId || c.id === carId ? { ...c, ...data } : c)));
        await api.put(`/cars/${carId}`, data);
      } else {
        const res = await api.post('/cars', data);
        if (res.data) {
          setCars((prev) => [res.data, ...prev]);
        }
      }
      showToast(`${data.name} berhasil ${isEdit ? 'diperbarui' : 'ditambahkan'}`);
      fetchCars();
      setModal(null);
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
      fetchCars(); // Revert on failure
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/cars/${modal.car._id || modal.car.id}`);
      showToast(`${modal.car.name} berhasil dihapus`, 'success');
      fetchCars();
      setModal(null);
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  const handleStatusToggle = async (car) => {
    try {
      const next = car.status === 'Tersedia' ? 'Perawatan' : 'Tersedia';
      await api.put(`/cars/${car._id || car.id}`, { ...car, status: next });
      showToast(`Status ${car.name} diubah menjadi ${next}`);
      fetchCars();
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    }
  };

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const displayed = cars.filter((c) => {
    const matchStatus = filterStatus === 'Semua' || c.status === filterStatus;
    const matchSearch = (c.name || '').toLowerCase().includes(search.toLowerCase()) || (c.brand || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE));
  const paginatedCars = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Memuat Data Armada...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-12 space-y-12 animate-fade-in max-w-[1600px] mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tight text-foreground uppercase">Manajemen Armada</h2>
          <p className="text-muted-foreground font-medium flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-[10px] font-black uppercase tracking-widest border border-success/20">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                Operasional
            </span>
            {cars.length} Unit mobil terdaftar dalam sistem
          </p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary px-8 py-5 rounded-2xl group shadow-2xl shadow-primary/30 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3">
          <span className="material-symbols-outlined text-lg">add_to_photos</span>
          Tambah Mobil Baru
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
            { label: 'Total Armada', val: cars.length, suffix: 'Unit', icon: 'inventory_2', color: 'text-primary', bg: 'bg-primary/10' }, 
            { label: 'Mobil Tersedia', val: cars.filter((c) => c.status === 'Tersedia').length, suffix: 'Siap Pakai', icon: 'verified', color: 'text-success', bg: 'bg-success/10' }, 
            { label: 'Mobil Disewa / Perawatan', val: cars.filter((c) => c.status !== 'Tersedia').length, suffix: 'Terpakai', icon: 'dynamic_feed', color: 'text-amber-500', bg: 'bg-amber-500/10' }
        ].map((s) => (
          <div key={s.label} className="card p-8 group">
            <div className="flex items-center gap-6">
                <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center transition-transform group-hover:scale-110 shadow-inner ${s.bg}`}>
                    <span className={`material-symbols-outlined text-3xl ${s.color}`}>{s.icon}</span>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">{s.label}</p>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-foreground tracking-tighter">{s.val}</p>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{s.suffix}</span>
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <header className="p-8 border-b border-border flex flex-col lg:flex-row items-center gap-8 bg-muted/10">
          <div className="relative w-full lg:w-96 group">
            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-focus-within:text-primary transition-colors">search</span>
            <input 
              className="w-full pl-14 pr-6 py-4 rounded-2xl text-xs font-bold border border-border bg-muted/30 outline-none focus:bg-card focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all tracking-wide" 
              placeholder="Cari nama atau merk mobil..." 
              value={search} 
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
            />
          </div>
          <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-[1.5rem] overflow-x-auto max-w-full no-scrollbar border border-border">
            {['Semua', 'Tersedia', 'Disewa', 'Perawatan'].map((s) => (
              <button 
                key={s} 
                onClick={() => { setFilterStatus(s); setPage(1); }} 
                className={`px-6 py-2.5 rounded-[1.125rem] text-[9px] font-black uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                    filterStatus === s ? 'bg-card text-primary shadow-xl border border-border' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/5 border-b border-border">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Kendaraan</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Kategori</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center">Stok Unit</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayed.length === 0 ? (
                <tr>
                    <td colSpan="5" className="py-24 text-center">
                        <div className="flex flex-col items-center gap-6 opacity-20">
                            <span className="material-symbols-outlined text-7xl">inventory_2</span>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em]">Tidak ada mobil ditemukan</p>
                        </div>
                    </td>
                </tr>
              ) : (
                paginatedCars.map((car) => (
                  <tr key={car._id || car.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-6">
                        <div className="w-24 h-16 rounded-2xl overflow-hidden bg-muted border border-border group-hover:scale-105 transition-transform">
                          <img 
                            className="w-full h-full object-cover" 
                            src={car.imageUrl} 
                            alt={car.name} 
                            loading="lazy" 
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80';
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="font-black text-foreground text-sm uppercase tracking-tight">{car.name}</p>
                          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{car.brand} • {car.year}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1.5 bg-muted rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground border border-border">{car.category}</span>
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-amber-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                          <span className="text-xs font-black text-foreground">{car.rating}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="space-y-0.5">
                        <p className={`text-sm font-black ${car.stock > 0 ? 'text-foreground' : 'text-destructive'}`}>{car.stock}</p>
                        <p className="text-[8px] uppercase tracking-widest text-muted-foreground font-black">Unit</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <button 
                        onClick={() => handleStatusToggle(car)} 
                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-[0.15em] border transition-all hover:scale-105 active:scale-95 ${
                            car.status === 'Tersedia' ? 'bg-success/5 text-success border-success/20' : 
                            car.status === 'Disewa' ? 'bg-primary/5 text-primary border-primary/20' : 
                            'bg-amber-500/5 text-amber-500 border-amber-500/20'
                        }`}
                      >
                        {car.status}
                      </button>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button onClick={() => handleEdit(car)} className="w-10 h-10 rounded-2xl bg-card border border-border text-primary shadow-xl hover:bg-primary/10 transition-all flex items-center justify-center" title="Edit Mobil">
                            <span className="material-symbols-outlined text-base">edit_square</span>
                        </button>
                        <button onClick={() => handleDelete(car)} className="w-10 h-10 rounded-2xl bg-card border border-border text-destructive shadow-xl hover:bg-destructive/10 transition-all flex items-center justify-center" title="Hapus Mobil">
                            <span className="material-symbols-outlined text-base">delete_sweep</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Fleet Table Pagination Footer */}
        {displayed.length > 0 && (
          <footer className="p-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/5">
            <p className="text-xs font-bold text-muted-foreground">
              Menampilkan <span className="text-foreground font-black">{(page - 1) * PAGE_SIZE + 1}</span> - <span className="text-foreground font-black">{Math.min(page * PAGE_SIZE, displayed.length)}</span> dari <span className="text-foreground font-black">{displayed.length}</span> unit mobil
            </p>
            
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-black text-muted-foreground hover:text-primary hover:border-primary disabled:opacity-30 transition-all flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                  Sebelumnya
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                        page === n
                          ? 'bg-primary text-white shadow-md shadow-primary/20'
                          : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-xl bg-card border border-border text-xs font-black text-muted-foreground hover:text-primary hover:border-primary disabled:opacity-30 transition-all flex items-center gap-1"
                >
                  Berikutnya
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            )}
          </footer>
        )}
      </div>

      {/* Render Modals and Toasts */}
      {(modal?.type === 'add' || modal?.type === 'edit') && <CarFormModal car={modal.car} onSave={handleSaveCar} onClose={() => setModal(null)} />}
      {modal?.type === 'delete' && <DeleteModal car={modal.car} onConfirm={handleConfirmDelete} onCancel={() => setModal(null)} />}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default AdminCarsPage;