import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Building2, 
  MapPin,
  Users, 
  LayoutDashboard, 
  ShieldCheck, 
  History,
  Layers,
  Boxes,
  Key,
  GraduationCap,
  Database
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const Sidebar: React.FC = () => {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const isAdmin = useAuthStore((state) => state.user?.isAdmin);

  const orgItems = [
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
      label: 'Đơn vị kinh doanh (BU)',
      href: '/organization/business-units',
      icon: <Layers className="w-5 h-5" />,
      permission: 'org.business_unit.view',
    },
    {
      label: 'Cơ sở đào tạo (Campus)',
      href: '/organization/branches',
      icon: <MapPin className="w-5 h-5" />,
      permission: 'org.branch.view',
    },
    {
      label: 'Học viên & Hồ sơ 360',
      href: '/students',
      icon: <GraduationCap className="w-5 h-5" />,
      permission: 'party.profile.view',
    },
    {
      label: 'Party 360 (Chủ thể)',
      href: '/party-360',
      icon: <Users className="w-5 h-5" />,
      permission: 'party.profile.view',
    },
  ];

  const adminItems = [
    {
      label: 'Quản trị Nhóm quyền (GBAC)',
      href: '/admin/user-groups',
      icon: <ShieldCheck className="w-5 h-5" />,
      permission: 'identity.group.view',
    },
    {
      label: 'Nhật ký Kiểm toán (Audit)',
      href: '/admin/audit-logs',
      icon: <History className="w-5 h-5" />,
      permission: 'identity.audit.view',
    },
    {
      label: 'Danh mục Phân hệ & Tính năng',
      href: '/admin/registry',
      icon: <Boxes className="w-5 h-5" />,
      permission: 'system.module.view',
    },
    {
      label: 'Bản đồ Ánh xạ Quyền',
      href: '/admin/permission-mapping',
      icon: <Key className="w-5 h-5" />,
      permission: 'system.permission_map.view',
    },
    {
      label: 'Dữ liệu nguồn (Master Data)',
      href: '/admin/reference-data',
      icon: <Database className="w-5 h-5" />,
      permission: 'system.reference_data.view',
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
          <span className="text-[10px] text-blue-400 font-medium tracking-wider uppercase block mt-1">Enterprise Platform</span>
        </div>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Phân hệ Tổ chức & Khách hàng
        </div>

        {orgItems.map((item) => {
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
            </NavLink>
          );
        })}

        <div className="pt-6 px-3 pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          Nền tảng Quản trị & Bảo mật
        </div>

        {adminItems.map((item) => {
          if (item.permission && !hasPermission(item.permission) && !isAdmin) {
            return null;
          }

          return (
            <NavLink
              key={item.href}
              to={item.href}
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
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800/80 bg-slate-950/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-slate-300">
            SHD
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-white block truncate">Tập đoàn Giáo dục SHD</span>
            <span className="text-[10px] text-emerald-400 block truncate">Foundation Ready (net10)</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
