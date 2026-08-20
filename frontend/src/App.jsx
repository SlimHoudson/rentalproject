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
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-foreground/40">Initializing Protocol</p>
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
                <Layout title="Concierge Dashboard"><UserDashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/cars" element={
              <ProtectedRoute>
                <Layout title="Exclusive Fleet"><CarsPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute>
                <Layout title="Secure Acquisition"><CheckoutPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <Layout title="Personal Archive"><BookingHistory /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout title="Identity Profile"><ProfilePage /></Layout>
              </ProtectedRoute>
            } />

            {/* ====== ADMINISTRATIVE COMMAND CENTER ====== */}
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <Layout title="Operational Intelligence"><AdminDashboard /></Layout>
              </AdminRoute>
            } />
            <Route path="/admin/cars" element={
              <AdminRoute>
                <Layout title="Fleet Asset Control"><AdminCarsPage /></Layout>
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <Layout title="Registry Management"><AdminUsersPage /></Layout>
              </AdminRoute>
            } />
            <Route path="/admin/return" element={
              <AdminRoute>
                <Layout title="Logistics Synchronization"><ReturnCar /></Layout>
              </AdminRoute>
            } />
            <Route path="/admin/bookings" element={
              <AdminRoute>
                <Layout title="Central Ledger"><BookingHistory /></Layout>
              </AdminRoute>
            } />
            <Route path="/admin/chat" element={
              <AdminRoute>
                <Layout title="Communications Terminal"><AdminChat /></Layout>
              </AdminRoute>
            } />
            <Route path="/admin/history" element={
              <AdminRoute>
                <Layout title="Global Archives"><BookingHistory /></Layout>
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
