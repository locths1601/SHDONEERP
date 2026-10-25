import React from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { LegalEntityList } from '../../features/organization/components/LegalEntityList';

export const LegalEntitiesPage: React.FC = () => {
  return (
    <PageContainer
      title="Danh sách Pháp nhân"
      subtitle="Quản lý các công ty thành viên, pháp nhân độc lập và chi nhánh thuộc hệ sinh thái SHD Corp"
      breadcrumbs={[
        { label: 'Trang chủ', href: '/' },
        { label: 'Cơ cấu Tổ chức' },
        { label: 'Pháp nhân' },
      ]}
    >
      <LegalEntityList />
    </PageContainer>
  );
};
