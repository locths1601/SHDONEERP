import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../../../components/common/Button';

interface CatalogConflictModalProps {
  isOpen: boolean;
  onReload: () => void;
  onClose: () => void;
}

export const CatalogConflictModal: React.FC<CatalogConflictModalProps> = ({
  isOpen,
  onReload,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
        <div className="flex items-center gap-4 text-rose-600 mb-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Xung đột dữ liệu (HTTP 409)</h3>
            <p className="text-sm text-slate-500">Optimistic Concurrency Conflict</p>
          </div>
        </div>

        <div className="text-sm text-slate-600 mb-6 space-y-2">
          <p>
            Nhóm danh mục này vừa được chỉnh sửa hoặc thay đổi trạng thái bởi một người dùng khác trong khi bạn đang thao tác.
          </p>
          <p className="font-medium text-slate-800">
            Để bảo toàn tính toàn vẹn dữ liệu, các thay đổi của bạn chưa được lưu. Vui lòng tải lại phiên bản mới nhất từ máy chủ.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={onReload}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className="w-4 h-4" />
            Tải lại dữ liệu mới nhất
          </Button>
        </div>
      </div>
    </div>
  );
};

