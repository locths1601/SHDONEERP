import React from 'react';
import { PageContainer } from '../components/common/PageContainer';
import { Card } from '../components/common/Card';
import { Building2, Users, GraduationCap, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  return (
    <PageContainer
      title="Bảng Điều Hành Trung Tâm"
      subtitle="Chào mừng bạn đến với hệ thống SHD OneERP — Phiên bản Khởi tạo Phase 0 & Phase 1"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Link to="/organization/legal-entities">
          <Card className="hover:border-blue-500 transition cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Pháp nhân Hệ sinh thái</span>
                <span className="text-xl font-bold text-slate-900">Quản lý</span>
              </div>
            </div>
          </Card>
        </Link>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-900 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Party 360 (Khách hàng)</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-700 mt-1 inline-block">
                Foundation Sẵn sàng
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-900 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Phân quyền Direct GBAC</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 mt-1 inline-block">
                Active v4.2
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-900 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Đào tạo & Du học</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700 mt-1 inline-block">
                Kế hoạch Phase 6
              </span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Trạng thái Triển khai Hệ thống (Architecture Reality)">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Kiến trúc Backend</span>
              <strong className="text-slate-900 font-mono">.NET 10 Modular Monolith</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Đường đọc (Read-side)</span>
              <strong className="text-emerald-700 font-mono">100% Stored Procedures (sp_*)</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Đường ghi (Write-side)</span>
              <strong className="text-blue-900 font-mono">EF Core + Unit of Work</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Cơ chế Migrations</span>
              <strong className="text-slate-900 font-mono">Handwritten SQL Versioned</strong>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
              <span className="text-slate-600">Bảo mật & Phân quyền</span>
              <strong className="text-purple-700 font-mono">Direct GBAC v4.2 + Multi-Scope</strong>
            </div>
          </div>
        </Card>

        <Card title="Hành động Khuyến nghị">
          <div className="space-y-4 text-xs text-slate-600">
            <p>
              1. Truy cập module <strong>Quản trị Pháp nhân</strong> để trải nghiệm tính năng tìm kiếm, phân trang và chỉnh sửa trực tiếp thông qua Stored Procedure.
            </p>
            <p>
              2. Xem tài liệu kiến trúc tại thư mục <code className="bg-slate-100 px-1 py-0.5 rounded">docs/</code> để nắm rõ Domain Map và ADR.
            </p>
            <p>
              3. Chạy script migration tại <code className="bg-slate-100 px-1 py-0.5 rounded">database/scripts/run-migrations.ps1</code> khi kết nối đến cơ sở dữ liệu SQL Server.
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};
