import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import VerifiedRoute from './components/VerifiedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import NotFound from './pages/NotFound';

// Dashboard Pages
import ArtistDashboard from './pages/artist/Dashboard';
import OrganizerDashboard from './pages/organizer/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';

// Artist Components
import ArtistProfile from './components/artist/ArtistProfile';
import PackageManagement from './components/artist/PackageManagement';
import ArtistBookingManagement from './components/artist/BookingManagement';
import AvailabilityManagement from './components/artist/AvailabilityManagement';

// Organizer Components
import EventManagement from './components/organizer/EventManagement';
import BrowseArtists from './pages/organizer/BrowseArtists';
import OrganizerBookingManagement from './pages/organizer/BookingManagement';
import OrganizerProfileForm from './components/organizer/ProfileForm';

// Admin Components
import UserManagement from './pages/admin/UserManagement';
import BookingManagement from './pages/admin/BookingManagement';
import AdminEventManagement from './pages/admin/EventManagement';
import Analytics from './pages/admin/Analytics';
import SystemSettings from './pages/admin/SystemSettings';
import VerificationManagement from './pages/admin/VerificationManagement';
import DisputeManagement from './pages/admin/DisputeManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          
          <main className="container-fluid p-0">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes - Dashboard (No verification required) */}
              <Route 
                path="/artist/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['artist']}>
                    <ArtistDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/organizer/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <OrganizerDashboard />
                  </ProtectedRoute>
                } 
              />

              {/* ARTIST VERIFIED ROUTES - Require verification */}
              <Route 
                path="/artist/profile" 
                element={
                  <ProtectedRoute allowedRoles={['artist']}>
                    <VerifiedRoute feature="profile editing">
                      <ArtistProfile />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/artist/packages" 
                element={
                  <ProtectedRoute allowedRoles={['artist']}>
                    <VerifiedRoute feature="package management">
                      <PackageManagement />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/artist/bookings" 
                element={
                  <ProtectedRoute allowedRoles={['artist']}>
                    <VerifiedRoute feature="booking management">
                      <ArtistBookingManagement />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/artist/availability" 
                element={
                  <ProtectedRoute allowedRoles={['artist']}>
                    <VerifiedRoute feature="availability management">
                      <AvailabilityManagement />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />

              {/* ORGANIZER VERIFIED ROUTES - Require verification */}
              <Route 
                path="/organizer/profile" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <VerifiedRoute feature="profile editing">
                      <OrganizerProfileForm />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/organizer/events" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <VerifiedRoute feature="event management">
                      <EventManagement />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/organizer/bookings" 
                element={
                  <ProtectedRoute allowedRoles={['organizer']}>
                    <VerifiedRoute feature="booking management">
                      <OrganizerBookingManagement />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/artists" 
                element={
                  <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                    <VerifiedRoute feature="browsing artists">
                      <BrowseArtists />
                    </VerifiedRoute>
                  </ProtectedRoute>
                } 
              />

              {/* ADMIN ROUTES - No verification required for admins */}
              <Route 
                path="/admin/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UserManagement />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/events" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminEventManagement />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/verifications" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <VerificationManagement />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/bookings" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <BookingManagement />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/analytics" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Analytics />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/disputes" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <DisputeManagement />
                  </ProtectedRoute>
                } 
              />

              {/* Fallback Routes */}
              <Route path="/dashboard" element={<DashboardRedirect />} />
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </main>

          {/* Toast notifications */}
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

// Component to redirect users to their appropriate dashboard
const DashboardRedirect = () => {
  // This would use the auth context to determine user role
  // For now, redirect to home
  return <Navigate to="/" replace />;
};

export default App; 