import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import BoardView from './pages/BoardView.jsx';
import Navbar from './components/Navbar.jsx';
import { supabase } from './lib/supabase.js';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-lg">Loading CollabBoard...</p>
        </div>
      </div>
    );
  }

  const isAuthPage = location.pathname === '/authpage';

  return (
    <div className="min-h-screen bg-slate-900">
      {session && !isAuthPage && <Navbar session={session} />}
      <Routes>
        <Route
          path="/"
          element={
            session ? <Navigate to="/dashboard" replace /> : <Navigate to="/authpage" replace />
          }
        />
        <Route
          path="/authpage"
          element={
            session ? <Navigate to="/dashboard" replace /> : <AuthPage />
          }
        />
        <Route
          path="/dashboard"
          element={
            session ? <Dashboard session={session} /> : <Navigate to="/authpage" replace />
          }
        />
        <Route
          path="/boardview"
          element={
            session ? <BoardView session={session} /> : <Navigate to="/authpage" replace />
          }
        />
        <Route
          path="/board/:boardId"
          element={
            session ? <BoardView session={session} /> : <Navigate to="/authpage" replace />
          }
        />
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-indigo-500 mb-4">404</h1>
                <p className="text-slate-400 text-xl mb-6">Page not found</p>
                <a
                  href={session ? "/dashboard" : "/authpage"}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Go Home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;