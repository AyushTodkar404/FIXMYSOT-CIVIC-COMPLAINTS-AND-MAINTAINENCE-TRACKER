import React from 'react';
import '@/App.css';
import './i18n';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthCallback } from './components/AuthCallback';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CitizenDashboard } from './pages/CitizenDashboard';
import { ReportIssue } from './pages/ReportIssue';
import { MyIssues } from './pages/MyIssues';
import { Leaderboard } from './pages/Leaderboard';
import { MunicipalDashboard } from './pages/MunicipalDashboard';
import { ExplorePage } from './pages/ExplorePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { NetworkStatusBanner } from './components/NetworkStatusBanner';

function AppRouter() {
  const location = useLocation();
  
  // Check URL fragment for session_id synchronously during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <>
      <NetworkStatusBanner />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route
          path="/citizen/dashboard"
          element={
            <ProtectedRoute requireRole="citizen">
              <CitizenDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/report"
          element={
            <ProtectedRoute requireRole="citizen">
              <ReportIssue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/my-issues"
          element={
            <ProtectedRoute requireRole="citizen">
              <MyIssues />
            </ProtectedRoute>
          }
        />
        <Route
          path="/citizen/leaderboard"
          element={
            <ProtectedRoute requireRole="citizen">
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <ExplorePage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/municipal/dashboard"
          element={
            <ProtectedRoute requireRole="municipal">
              <MunicipalDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>}
        />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      </Routes>
      <Toaster position="top-right" richColors />
    </>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="App">
        <BrowserRouter>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
