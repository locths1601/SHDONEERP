import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  LayoutDashboard, 
  ShieldCheck, 
  GraduationCap, 
  FileText, 
  Globe, 
  Briefcase 
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const Sidebar: React.FC = () => {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const isAdmin = useAuthStore((state) => state.user?.isAdmin);

  const navItems = [
    {
      label: 'Tổng quan',
      href: '/',
      icon: <LayoutDashboard className="w-5 h-5" />,
      permission: null,
    },
    {
      label: 'Quản trị Pháp nhân',
      href: '/organization/legal-entities',
      icon: <Building2 className="w-5 h-5" />,
      permission: 'org.legal_entity.view',
    },
    {
      label: 'Party 360 (Khách hàng)',
      href: '/party-360',
      icon: <Users className="w-5 h-5" />,
      permission: 'party.profile.view',
    },
    {
      label: 'Đào tạo & Lớp học',
      href: '/education',
      icon: <GraduationCap className="w-5 h-5" />,
      badge: 'TBD',
    },
    {
      label: 'Hồ sơ & Visa',
      href: '/admission-visa',
      icon: <FileText className="w-5 h-5" />,
      badge: 'TBD',
    },
    {
      label: 'Đối tác Quốc tế',
      href: '/placement',
      icon: <Globe className="w-5 h-5" />,
      badge: 'TBD',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-screen border-r border-slate-800">
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg">
          S
        </div>
        <div>
          <span className="font-bold text-base text-white tracking-wide block leading-none">SHD OneERP</span>
          <span className="text-[10px] text-blue-400 font-medium tracking-wider uppercase block mt-1">Ecosystem Platform</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Phân hệ Quản trị
        </div>

        {navItems.map((item) => {
          if (item.permission && !hasPermission(item.permission) && !isAdmin) {
            return null;
          }

          return (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {(isAdmin || hasPermission('identity.user.view')) && (
          <>
            <div className="pt-6 px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Bảo mật & Hệ thống
            </div>
            <NavLink
              to="/admin/permissions"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <ShieldCheck className="w-5 h-5" />
              <span>Phân quyền GBAC</span>
            </NavLink>
          </>
        )}
      </div>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300">
            SHD
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-white block truncate">Tập đoàn SHD</span>
            <span className="text-[10px] text-slate-400 block truncate">v1.0.0-phase0</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
