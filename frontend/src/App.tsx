import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar/Navbar';
import { Footer } from './components/Footer/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { APPS } from './config/apps';
import './globals.css';

// Lazy load admin and login pages
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));
const VideosAdminPage = lazy(() => import('./pages/VideosAdminPage').then(module => ({ default: module.VideosAdminPage })));
const SpeechSoundsAdminPage = lazy(() => import('./pages/SpeechSoundsAdminPage').then(module => ({ default: module.SpeechSoundsAdminPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  {/* Dynamically generate routes for enabled apps */}
                  {APPS.filter(app => !app.disabled).map(app => (
                    <Route 
                      key={app.id} 
                      path={app.link} 
                      element={
                        <Suspense fallback={<PageLoader />}>
                          <app.component />
                        </Suspense>
                      } 
                    />
                  ))}
                  {/* Keep non-app routes separate */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/videos"
                    element={
                      <ProtectedRoute>
                        <VideosAdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/speech-sounds"
                    element={
                      <ProtectedRoute>
                        <SpeechSoundsAdminPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Suspense>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;



