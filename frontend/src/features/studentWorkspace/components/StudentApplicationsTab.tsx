import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  Building2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { StudentDetailDto } from '../types';
import { useStudentApplications } from '../hooks/useStudents';
import { ApplicationCreateDrawer } from './ApplicationCreateDrawer';
import { ApplicationDetailModal } from './ApplicationDetailModal';

interface StudentApplicationsTabProps {
  student: StudentDetailDto;
}

export const StudentApplicationsTab: React.FC<StudentApplicationsTabProps> = ({ student }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  const { data: applications = [], isLoading, isError, error } = useStudentApplications(student.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">Bản nháp</span>;
      case 'Submitted':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">Đã nộp hồ sơ</span>;
      case 'UnderReview':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">Đang thẩm định Visa</span>;
      case 'Accepted':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">Đã đậu Visa</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800">Từ chối Visa</span>;
      case 'Withdrawn':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">Đã rút hồ sơ</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            Hồ sơ tuyển sinh & Đăng ký Du học ({applications.length})
          </h3>
          <p className="text-xs text-gray-500">
            Học viên có thể mở nhiều hồ sơ theo từng kỳ tuyển sinh, thị trường hoặc chương trình đào tạo khác nhau
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Mở hồ sơ du học mới
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-6">
          <div className="h-20 bg-gray-50 rounded-xl animate-pulse" />
          <div className="h-20 bg-gray-50 rounded-xl animate-pulse" />
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-xs text-red-600">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          Không thể tải danh sách hồ sơ: {(error as any)?.message}
        </div>
      ) : applications.length === 0 ? (
        <div className="py-12 text-center text-gray-400 text-xs">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          Chưa có hồ sơ du học nào. Bấm nút phía trên để mở hồ sơ du học cho học viên này.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {applications.map((app) => {
            const percent =
              app.totalChecklistItems > 0
                ? Math.round((app.verifiedChecklistItems / app.totalChecklistItems) * 100)
                : 0;

            return (
              <div
                key={app.id}
                onClick={() => setSelectedAppId(app.id)}
                className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-blue-50/40 hover:border-blue-300 cursor-pointer transition shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {app.applicationCode}
                  </span>
                  {getStatusBadge(app.status)}
                </div>

                <div>
                  <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{app.programName}</h4>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                    <span className="font-semibold text-gray-700">{app.targetMarket}</span>
                    <span>•</span>
                    <span>{app.intakeTerm}</span>
                  </div>
                </div>

                {/* Progress bar of checklist items */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>Tiến độ thẩm định giấy tờ:</span>
                    <span className="font-semibold text-gray-700">
                      {app.verifiedChecklistItems}/{app.totalChecklistItems} hợp lệ ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percent === 100 ? 'bg-green-500' : percent > 50 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200/70 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1 text-[11px]">
                    <Building2 className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate max-w-[150px]">{app.legalEntityName}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAppId(app.id);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    Xem & Thẩm định
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer: Create Application */}
      <ApplicationCreateDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        studentPartyId={student.id}
        studentName={student.fullName || student.code}
      />

      {/* Modal: Application Detail & Checklist */}
      {selectedAppId && (
        <ApplicationDetailModal
          applicationId={selectedAppId}
          onClose={() => setSelectedAppId(null)}
        />
      )}
    </div>
  );
};
