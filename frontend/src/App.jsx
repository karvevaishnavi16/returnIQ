import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/AuthContext';

// Import Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import CustomerPortal from './pages/CustomerPortal';
import SellerDashboard from './pages/SellerDashboard';

// A "Protected Route" wrapper component
// If a user tries to access a page they shouldn't, we redirect them
function ProtectedRoute({ children, allowedRole }) {
  const { user } = useContext(AuthContext);

  // Not logged in? Go to login page.
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in, but wrong role? (e.g. a customer trying to access seller dashboard)
  if (allowedRole && user.role !== allowedRole) {
    // Redirect them to their proper home
    return user.role === 'customer' 
      ? <Navigate to="/customer" replace />
      : <Navigate to="/seller" replace />;
  }

  // All good, render the page
  return children;
}

function App() {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-background text-text-main font-sans">
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          // If already logged in, skip the landing page
          user ? (
            <Navigate to={user.role === 'customer' ? "/customer" : "/seller"} replace />
          ) : (
            <Landing />
          )
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route 
          path="/customer/*" 
          element={
            <ProtectedRoute allowedRole="customer">
              <CustomerPortal />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/*" 
          element={
            <ProtectedRoute allowedRole="seller">
              <SellerDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback for unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
