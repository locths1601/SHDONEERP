import React, { useState } from 'react';
import { StudentList } from '../../features/studentWorkspace/components/StudentList';
import { StudentCreateDrawer } from '../../features/studentWorkspace/components/StudentCreateDrawer';

export const StudentDirectoryPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Học viên & Hồ sơ 360</h1>
        <p className="text-sm text-gray-500 mt-1">
          Không gian hợp nhất quản lý thông tin nhân thân Party 360, định danh công dân và tiến trình thụ lý hồ sơ du học
        </p>
      </div>

      <StudentList onCreateClick={() => setIsCreateOpen(true)} />

      <StudentCreateDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};

