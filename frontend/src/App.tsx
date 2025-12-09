import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar/Navbar';
import { Footer } from './components/Footer/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { AdminPage } from './pages/AdminPage';
import { VideosAdminPage } from './pages/VideosAdminPage';
import { SpeechSoundsAdminPage } from './pages/SpeechSoundsAdminPage';
import { LoginPage } from './pages/LoginPage';
import { APPS } from './config/apps';
import './globals.css';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                {/* Dynamically generate routes for enabled apps */}
                {APPS.filter(app => !app.disabled).map(app => (
                  <Route 
                    key={app.id} 
                    path={app.link} 
                    element={<app.component />} 
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
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;



