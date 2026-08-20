import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

import Layout from './components/Layout';

// Lazy loading pages for better performance and smaller initial cache
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AdminDashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.AdminDashboard })));
const UserDashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.UserDashboard })));
const BookingHistory = lazy(() => import('./pages/BookingHistory'));
const ReturnCar = lazy(() => import('./pages/ReturnCar'));
const CarsPage = lazy(() => import('./pages/CarsPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const AdminCarsPage = lazy(() => import('./pages/AdminCarsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminChat = lazy(() => import('./pages/AdminChat'));

// Loading component for premium initial impression
const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-background space-y-8 animate-fade-in">
    <div className="relative">
        <div className="w-20 h-20 border-4 border-primary/10 border-t-primary rounded-full animate-spin shadow-2xl"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-primary/10 rounded-lg animate-pulse"></div>
        </div>
    </div>
    <div className="flex flex-col items-center gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">Memuat Sistem...</p>
        <div className="flex gap-1">
            {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/20 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}></div>
            ))}
        </div>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Access Gates */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* ====== LUXURY USER ECOSYSTEM ====== */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout title="Dashboard Pengguna"><UserDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/cars" element={
              <ProtectedRoute>
                <Layout title="Katalog Mobil"><CarsPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Layout title="Pembayaran"><CheckoutPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <Layout title="Riwayat Pesanan"><BookingHistory /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout title="Profil Pengguna"><ProfilePage /></Layout>
              </ProtectedRoute>
            } />

            {/* ====== ADMINISTRATIVE COMMAND CENTER ====== */}
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <Layout title="Dashboard Admin"><AdminDashboard /></Layout>
              </AdminRoute>
            } />
            <Route path="/admin/cars" element={
              <AdminRoute>
                <Layout title="Manajemen Armada"><AdminCarsPage /></Layout>
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <Layout title="Manajemen Pelanggan"><AdminUsersPage /></Layout>
              </AdminRoute>
            } />
            <Route path="/admin/return" element={
              <AdminRoute>
                <Layout title="Pengembalian Mobil"><ReturnCar /></Layout>
              </AdminRoute>
            } />
            <Route path="/admin/bookings" element={
              <AdminRoute>
                <Layout title="Daftar Transaksi"><BookingHistory /></Layout>
              </AdminRoute>
            } />
            <Route path="/admin/chat" element={
              <AdminRoute>
                <Layout title="Pusat Pesan"><AdminChat /></Layout>
              </AdminRoute>
            } />
            <Route path="/admin/history" element={
              <AdminRoute>
                <Layout title="Arsip Transaksi"><BookingHistory /></Layout>
              </AdminRoute>
            } />

            {/* Security Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
