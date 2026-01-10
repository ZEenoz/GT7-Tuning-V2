import React from 'react';
import { HashRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Feed from './pages/Feed';
import Garage from './pages/Garage';
import Search from './pages/Search';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import AddTune from './pages/AddTune';
import EditTune from './pages/EditTune';
import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import BottomNav from './components/BottomNav';

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const location = useLocation();
  const hideNavPaths = ['/add-tune', '/tune-details', '/settings', '/login', '/register', '/onboarding'];
  const showNav = !hideNavPaths.includes(location.pathname);

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-gray-900 dark:text-white font-display pb-20 relative overflow-hidden max-w-lg mx-auto shadow-2xl border-x border-gray-200 dark:border-white/5 transition-colors duration-300">
      {children}
      {showNav && <BottomNav />}
    </div>
  );
};

// Wrapper for page transitions
const PageTransition = ({ children }: { children?: React.ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
};

const PrivateRoute = ({ children }: { children: React.ReactElement }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If user has no display name and isn't already on onboarding, force them there
  if (!currentUser.displayName && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore */}
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/register" element={<PageTransition><Register /></PageTransition>} />

        {/* Onboarding Route (Protected but special case handled in PrivateRoute) */}
        <Route path="/onboarding" element={<PrivateRoute><PageTransition><Onboarding /></PageTransition></PrivateRoute>} />

        {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute><PageTransition><Feed /></PageTransition></PrivateRoute>} />
        <Route path="/garage" element={<PrivateRoute><PageTransition><Garage /></PageTransition></PrivateRoute>} />
        <Route path="/search" element={<PrivateRoute><PageTransition><Search /></PageTransition></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><PageTransition><Profile /></PageTransition></PrivateRoute>} />
        <Route path="/user/:uid" element={<PrivateRoute><PageTransition><UserProfile /></PageTransition></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><PageTransition><Settings /></PageTransition></PrivateRoute>} />
        <Route path="/add-tune" element={<PrivateRoute><PageTransition><AddTune /></PageTransition></PrivateRoute>} />
        <Route path="/tune-details" element={<PrivateRoute><PageTransition><EditTune /></PageTransition></PrivateRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <HashRouter>
          <Layout>
            <AnimatedRoutes />
          </Layout>
        </HashRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}