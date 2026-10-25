import React from 'react';
import { LogOut, User as UserIcon, Bell } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../common/Button';

export const Header: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-900 border border-blue-200">
          Môi trường: Development
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition relative">
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-blue-600 absolute top-2 right-2 ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200" />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-semibold text-slate-900 leading-none">{user?.fullName || 'Người dùng'}</div>
            <div className="text-xs text-slate-500 mt-1">{user?.email || 'user@shdcorp.vn'}</div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          icon={<LogOut className="w-4 h-4 text-red-500" />}
          className="text-slate-600 hover:text-red-600"
          title="Đăng xuất"
        >
          Đăng xuất
        </Button>
      </div>
    </header>
  );
};
