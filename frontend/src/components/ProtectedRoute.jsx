import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Melindungi route dari user yang belum login
export const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant font-body-md">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Melindungi route yang hanya boleh diakses admin
export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant font-body-md">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-12">
          <div className="w-24 h-24 rounded-full bg-error-container flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl text-error">lock</span>
          </div>
          <h1 className="font-h1 text-h1 text-on-surface mb-3">Akses Ditolak</h1>
          <p className="text-on-surface-variant font-body-lg max-w-md mx-auto">
            Halaman ini hanya dapat diakses oleh Administrator. Silakan kembali ke dashboard Anda.
          </p>
          <a href="/dashboard" className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-semibold hover:brightness-110 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
};
