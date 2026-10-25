import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { MainLayout } from './components/layout/MainLayout';
import { RequireAuth } from './components/common/AuthGuards';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LegalEntitiesPage } from './pages/organization/LegalEntitiesPage';
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
            {/* Redirect legacy or shortcuts */}
            <Route path="organization" element={<Navigate to="/organization/legal-entities" replace />} />
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
