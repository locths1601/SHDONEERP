import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Link } from 'react-router-dom';

export const Forbidden403Page: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 tracking-tight">403 — Không có quyền truy cập</h1>
      <p className="text-sm text-slate-500 max-w-md mt-2 mb-8">
        Tài khoản của bạn không có quyền hạn (Permission) hoặc nằm ngoài phạm vi (Scope) pháp nhân để thực hiện hành động này.
      </p>
      <Link to="/">
        <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
          Quay lại Bảng điều khiển
        </Button>
      </Link>
    </div>
  );
};

export const NotFound404Page: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-black text-slate-300">404</h1>
      <h2 className="text-xl font-bold text-slate-800 mt-2">Trang không tồn tại</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-8">
        Đường dẫn bạn yêu cầu không tồn tại hoặc đã được di chuyển.
      </p>
      <Link to="/">
        <Button variant="primary" size="sm">
          Về Trang chủ
        </Button>
      </Link>
    </div>
  );
};
