import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  ArrowLeft,
  User,
  Shield,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useStudentDetail } from '../../features/studentWorkspace/hooks/useStudents';
import { StudentOverviewTab } from '../../features/studentWorkspace/components/StudentOverviewTab';
import { StudentIdentificationsTab } from '../../features/studentWorkspace/components/StudentIdentificationsTab';
import { StudentApplicationsTab } from '../../features/studentWorkspace/components/StudentApplicationsTab';

export const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'identifications' | 'applications'>('overview');

  const { data: student, isLoading, isError, error, refetch, isFetching } = useStudentDetail(id);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-6 bg-gray-100 rounded w-1/4 animate-pulse" />
        <div className="h-28 bg-gray-50 rounded-xl animate-pulse" />
        <div className="h-96 bg-gray-50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          {(error as any)?.status === 403
            ? 'Không có quyền truy cập hồ sơ này (403)'
            : 'Không tìm thấy hồ sơ học viên'}
        </h3>
        <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
          {(error as any)?.message || 'Hồ sơ không tồn tại hoặc đã bị xóa.'}
        </p>
        <button
          onClick={() => navigate('/students')}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/students')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại danh sách học viên
        </button>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          title="Làm mới dữ liệu"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* Profile Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-xl shadow-md">
            {student.firstName?.[0] || 'HV'}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-gray-900">{student.fullName}</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded font-semibold bg-gray-100 text-gray-700">
                {student.code}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                {student.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PartyId: <span className="font-mono">{student.id}</span> • Quốc tịch: {student.nationality || 'Việt Nam'} • Ngày tạo: {new Date(student.createdAtUtc).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <GraduationCap className="w-4 h-4" />
            Vai trò: Học viên (Student)
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 flex gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <User className="w-4 h-4" />
          Tổng quan & Thân nhân
        </button>

        <button
          onClick={() => setActiveTab('identifications')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'identifications'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          Giấy tờ định danh ({student.identifications.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition ${
            activeTab === 'applications'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Hồ sơ du học & Checklist Visa
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {activeTab === 'overview' && <StudentOverviewTab student={student} />}
        {activeTab === 'identifications' && <StudentIdentificationsTab student={student} />}
        {activeTab === 'applications' && <StudentApplicationsTab student={student} />}
      </div>
    </div>
  );
};

