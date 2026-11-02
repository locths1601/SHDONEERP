import React, { useState } from 'react';
import {
  Search,
  Plus,
  GraduationCap,
  AlertCircle,
  FileText,
  Eye,
  RefreshCw,
  Phone,
  Mail,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudentsPaged } from '../hooks/useStudents';
import { useLegalEntitiesPaged } from '../../organization/hooks/useLegalEntities';

interface StudentListProps {
  onCreateClick: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({ onCreateClick }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [legalEntityFilter, setLegalEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const { data, isLoading, isError, error, refetch, isFetching } = useStudentsPaged({
    pageNumber: page,
    pageSize,
    searchTerm: searchTerm || undefined,
    status: statusFilter || undefined,
    legalEntityId: legalEntityFilter || undefined,
  });

  const { data: legalEntitiesData } = useLegalEntitiesPaged({ page: 1, pageSize: 50 });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Hoạt động</span>;
      case 'Inactive':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">Tạm ngưng</span>;
      case 'Pending':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Chờ duyệt</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo mã học viên, họ tên..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="Active">Hoạt động</option>
            <option value="Inactive">Tạm ngưng</option>
            <option value="Pending">Chờ duyệt</option>
          </select>

          <select
            value={legalEntityFilter}
            onChange={(e) => {
              setLegalEntityFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả pháp nhân</option>
            {legalEntitiesData?.items?.map((le) => (
              <option key={le.id} value={le.id}>
                {le.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            onClick={onCreateClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Tiếp nhận học viên mới
          </button>
        </div>
      </div>

      {/* Main Table / State Handling */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <div className="h-6 bg-gray-100 rounded w-1/4 animate-pulse" />
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-50 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {(error as any)?.status === 403
                ? 'Không có quyền truy cập (403 Forbidden)'
                : 'Lỗi tải danh sách học viên'}
            </h3>
            <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
              {(error as any)?.status === 403
                ? 'Tài khoản của bạn không có quyền xem hồ sơ học viên tại pháp nhân này theo chính sách Data Scope.'
                : (error as any)?.message || 'Không thể lấy dữ liệu từ máy chủ API.'}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Thử lại
            </button>
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Chưa có học viên nào</h3>
            <p className="text-sm text-gray-500 mb-4">
              {searchTerm || statusFilter || legalEntityFilter
                ? 'Không tìm thấy học viên nào phù hợp với bộ lọc hiện tại.'
                : 'Bắt đầu tiếp nhận và quản lý hồ sơ học viên đầu tiên vào hệ thống.'}
            </p>
            <button
              onClick={onCreateClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Tạo hồ sơ học viên
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3">Mã học viên</th>
                    <th className="px-4 py-3">Họ và tên</th>
                    <th className="px-4 py-3">Ngày sinh & Giới tính</th>
                    <th className="px-4 py-3">Liên hệ</th>
                    <th className="px-4 py-3">Pháp nhân quản lý</th>
                    <th className="px-4 py-3 text-center">Hồ sơ du học</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.items.map((student) => (
                    <tr
                      key={student.id}
                      onClick={() => navigate(`/students/${student.id}`)}
                      className="hover:bg-blue-50/40 cursor-pointer transition"
                    >
                      <td className="px-4 py-3.5 font-medium text-gray-900 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span>{student.code}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-gray-900">{student.fullName}</div>
                        <div className="text-xs text-gray-400">{student.nationality || 'Việt Nam'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div>{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('vi-VN') : '—'}</div>
                        <div className="text-xs text-gray-400">{student.gender || '—'}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        {student.primaryPhone ? (
                          <div className="flex items-center gap-1 text-xs text-gray-700">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{student.primaryPhone}</span>
                          </div>
                        ) : null}
                        {student.primaryEmail ? (
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{student.primaryEmail}</span>
                          </div>
                        ) : null}
                        {!student.primaryPhone && !student.primaryEmail && <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-800 text-xs">{student.legalEntityName || '—'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <FileText className="w-3.5 h-3.5" />
                          {student.applicationCount} hồ sơ
                        </span>
                      </td>
                      <td className="px-4 py-3.5">{getStatusBadge(student.status)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/students/${student.id}`);
                          }}
                          className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center gap-1 border border-blue-200 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Hồ sơ 360
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <div>
                Hiển thị trang <span className="font-semibold text-gray-800">{data.page}</span> /{' '}
                <span className="font-semibold text-gray-800">{data.totalPages || 1}</span> ({data.totalItems} học viên)
              </div>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Trước
                </button>
                <button
                  disabled={page >= (data.totalPages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
