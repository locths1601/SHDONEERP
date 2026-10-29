import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { MainLayout } from './components/layout/MainLayout';
import { RequireAuth } from './components/common/AuthGuards';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LegalEntitiesPage } from './pages/organization/LegalEntitiesPage';
import { BusinessUnitsPage } from './pages/organization/BusinessUnitsPage';
import { BranchesPage } from './pages/organization/BranchesPage';
import { PartiesPage } from './pages/party360/PartiesPage';
import { StudentDirectoryPage } from './pages/studentWorkspace/StudentDirectoryPage';
import { StudentDetailPage } from './pages/studentWorkspace/StudentDetailPage';
import { UserGroupsPage } from './pages/admin/UserGroupsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { ModuleRegistryPage } from './pages/admin/ModuleRegistryPage';
import { Forbidden403Page, NotFound404Page } from './pages/ErrorPages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 30, // 30 seconds
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403" element={<Forbidden403Page />} />

          {/* Authenticated ERP routes */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <MainLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route
              path="organization/legal-entities"
              element={
                <RequireAuth permission="org.legal_entity.view">
                  <LegalEntitiesPage />
                </RequireAuth>
              }
            />
            <Route
              path="organization/branches"
              element={
                <RequireAuth permission="org.branch.view">
                  <BranchesPage />
                </RequireAuth>
              }
            />
            <Route
              path="organization/business-units"
              element={
                <RequireAuth permission="org.business_unit.view">
                  <BusinessUnitsPage />
                </RequireAuth>
              }
            />
            <Route
              path="party-360"
              element={
                <RequireAuth permission="party.profile.view">
                  <PartiesPage />
                </RequireAuth>
              }
            />
            <Route
              path="students"
              element={
                <RequireAuth permission="party.profile.view">
                  <StudentDirectoryPage />
                </RequireAuth>
              }
            />
            <Route
              path="students/:id"
              element={
                <RequireAuth permission="party.profile.view">
                  <StudentDetailPage />
                </RequireAuth>
              }
            />

            {/* Foundation Admin routes */}
            <Route
              path="admin/user-groups"
              element={
                <RequireAuth permission="identity.group.view">
                  <UserGroupsPage />
                </RequireAuth>
              }
            />
            <Route
              path="admin/audit-logs"
              element={
                <RequireAuth permission="identity.audit.view">
                  <AuditLogsPage />
                </RequireAuth>
              }
            />

            {/* System Module & Feature Registry (FND-04) */}
            <Route
              path="admin/registry"
              element={
                <RequireAuth permission="system.module.view">
                  <ModuleRegistryPage />
                </RequireAuth>
              }
            />
            <Route
              path="admin/modules"
              element={
                <RequireAuth permission="system.module.view">
                  <ModuleRegistryPage initialTab="modules" />
                </RequireAuth>
              }
            />
            <Route
              path="admin/features"
              element={
                <RequireAuth permission="system.feature.view">
                  <ModuleRegistryPage initialTab="features" />
                </RequireAuth>
              }
            />
            <Route
              path="admin/permission-mapping"
              element={
                <RequireAuth permission="system.permission_map.view">
                  <ModuleRegistryPage initialTab="mappings" />
                </RequireAuth>
              }
            />

            {/* Redirect legacy or shortcuts */}
            <Route path="organization" element={<Navigate to="/organization/legal-entities" replace />} />
            <Route path="admin" element={<Navigate to="/admin/user-groups" replace />} />
          </Route>

          {/* 404 fallback */}
          <Route path="*" element={<NotFound404Page />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
};
export default App;
