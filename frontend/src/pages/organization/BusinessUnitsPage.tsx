import React from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { BusinessUnitList } from '../../features/organization/components/BusinessUnitList';

export const BusinessUnitsPage: React.FC = () => (
  <PageContainer
    title="Đơn vị kinh doanh"
    subtitle="Quản lý đơn vị trực thuộc pháp nhân trong phạm vi được cấp quyền"
    breadcrumbs={[
      { label: 'Trang chủ', href: '/' },
      { label: 'Cơ cấu tổ chức' },
      { label: 'Đơn vị kinh doanh' },
    ]}
  >
    <BusinessUnitList />
  </PageContainer>
);
