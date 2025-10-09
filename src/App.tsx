import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Home from './pages/Home';
import CourseDetail from './pages/CourseDetail';

function App() {
  const [currentPage, setCurrentPage] = useState<'signup' | 'login' | 'home' | 'course'>('login');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      (async () => {
        await checkUser();
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      setCurrentPage('home');
    }
    setLoading(false);
  };

  const handleNavigate = (page: string, courseId?: string) => {
    if (page === 'course' && courseId) {
      setSelectedCourseId(courseId);
      setCurrentPage('course');
    } else {
      setCurrentPage(page as any);
    }
  };

  const handleLoginSuccess = () => {
    checkUser();
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (currentPage === 'signup') {
    return <SignUp onNavigate={handleNavigate} />;
  }

  if (currentPage === 'login' && !user) {
    return <Login onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPage === 'home' && user) {
    return <Home onNavigate={handleNavigate} onLogout={handleLogout} userEmail={user.email} />;
  }

  if (currentPage === 'course' && selectedCourseId && user) {
    return <CourseDetail courseId={selectedCourseId} onNavigate={handleNavigate} />;
  }

  return null;
}

export default App;
