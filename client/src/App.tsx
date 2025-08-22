import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TicketList } from '@/components/tickets/TicketList';
import { CreateTicketForm } from '@/components/tickets/CreateTicketForm';
import { TicketDetail } from '@/components/tickets/TicketDetail';
import { KBListPage } from '@/pages/KBListPage';
import { KBEditorPage } from '@/pages/KBEditorPage';
import { KBArticleView } from '@/pages/KBArticleView';
import { SettingsPage } from '@/pages/SettingsPage';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Toaster } from '@/components/ui/sonner';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
}

// Main App Routes
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth Route */}
      <Route 
        path="/auth" 
        element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} 
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tickets"
        element={
          <ProtectedRoute>
            <TicketList />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tickets/new"
        element={
          <ProtectedRoute>
            <CreateTicketForm />
          </ProtectedRoute>
        }
      />

      <Route
        path="/tickets/:id"
        element={
          <ProtectedRoute>
            <TicketDetail />
          </ProtectedRoute>
        }
      />

      {/* KB Article View - Available to all authenticated users for citations */}
      <Route
        path="/kb/:id/view"
        element={
          <ProtectedRoute>
            <KBArticleView />
          </ProtectedRoute>
        }
      />

      {/* KB routes (admin only) */}
      <Route
        path="/kb"
        element={
          <ProtectedRoute>
            <RoleGuard allow={['admin']}>
              <KBListPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kb/new"
        element={
          <ProtectedRoute>
            <RoleGuard allow={['admin']}>
              <KBEditorPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/kb/:id"
        element={
          <ProtectedRoute>
            <RoleGuard allow={['admin']}>
              <KBEditorPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Settings (admin only) */}
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <RoleGuard allow={['admin']}>
              <SettingsPage />
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Redirect root to dashboard if authenticated, otherwise to auth */}
      <Route
        path="/"
        element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />
        }
      />

      {/* Catch all route */}
      <Route
        path="*"
        element={
          user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />
        }
      />
    </Routes>
  );
}

// Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;