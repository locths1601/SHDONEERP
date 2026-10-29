import React from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { BranchList } from '../../features/organization/components/BranchList';

export const BranchesPage: React.FC = () => (
  <PageContainer
    title="Cơ sở đào tạo / Chi nhánh"
    subtitle="Quản lý mạng lưới cơ sở, trung tâm và chi nhánh đào tạo trực thuộc trong phạm vi được phân quyền"
    breadcrumbs={[
      { label: 'Trang chủ', href: '/' },
      { label: 'Cơ cấu tổ chức' },
      { label: 'Cơ sở đào tạo (Campus)' },
    ]}
  >
    <BranchList />
  </PageContainer>
);

