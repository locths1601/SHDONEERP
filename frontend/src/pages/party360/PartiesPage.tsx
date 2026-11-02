import React from 'react';
import { PageContainer } from '../../components/common/PageContainer';
import { Card } from '../../components/common/Card';
import { PartyList } from '../../features/party360/components/PartyList';

export const PartiesPage: React.FC = () => {
  return (
    <PageContainer
      title="Party 360 — Khách hàng & Đối tác"
      subtitle="Quản lý tập trung định danh học viên, phụ huynh, ứng viên và tổ chức đối tác đa vai trò trên toàn hệ sinh thái SHD Corp"
      breadcrumbs={[
        { label: 'Tổng quan', href: '/' },
        { label: 'Party 360' },
      ]}
    >
      <Card>
        <PartyList />
      </Card>
    </PageContainer>
  );
};
export default PartiesPage;

