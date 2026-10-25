import React from 'react';
import { LoginForm } from '../features/identity/components/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-900 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-2xl mb-4 shadow-lg shadow-blue-900/30">
            S
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">SHD OneERP</h1>
          <p className="text-xs text-slate-500 mt-1">Hệ thống quản trị tập trung toàn bộ hệ sinh thái SHD Corp</p>
        </div>

        <LoginForm />
      </div>
    </div>
  );
};
