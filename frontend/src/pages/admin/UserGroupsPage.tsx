import React from 'react';
import { UserGroupList } from '../../features/identity/components/UserGroupList';

export const UserGroupsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <UserGroupList />
    </div>
  );
};

