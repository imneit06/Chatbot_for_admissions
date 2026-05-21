import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import ChatPage from './pages/ChatPage';
import LookupPage from './pages/LookupPage';
import AdminPage from './pages/AdminPage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/routes/ProtectedRoute';
import AdminRoute from './components/routes/AdminRoute';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Navigate to={isAuthenticated ? '/chat' : '/login'} replace />} />
              <Route path="/lookup" element={<LookupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/history" element={<HistoryPage />} />
              </Route>
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
              <Route path="*" element={<Navigate to={isAuthenticated ? '/chat' : '/login'} replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </Router>
  );
}

export default App;
