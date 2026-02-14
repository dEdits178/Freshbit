import { Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicLayout from './components/layout/PublicLayout';
import AppShell from './components/layout/AppShell';
import CommandPalette from './components/common/CommandPalette';
import PageTransition from './components/common/PageTransition';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import Settings from './pages/settings/Settings';
import Unauthorized from './pages/errors/Unauthorized';
import NotFound from './pages/errors/NotFound';
import Landing from './pages/public/Landing';
import Features from './pages/public/Features';
import Contact from './pages/public/Contact';
import AdminDashboard from './pages/admin/AdminDashboard';
import AllDrives from './pages/admin/AllDrives';
import ManageColleges from './pages/admin/ManageColleges';
import ManageCompanies from './pages/admin/ManageCompanies';
import Analytics from './pages/admin/Analytics';
import DriveDetails from './pages/admin/DriveDetails';
import CompanyDashboard from './pages/dashboard/CompanyDashboard';
import CollegeDashboard from './pages/dashboard/CollegeDashboard';
import ModulePlaceholder from './pages/dashboard/ModulePlaceholder';

const App = () => {
  const location = useLocation();

  return (
    <>
      <CommandPalette />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<PublicLayout />}>
            <Route
              path="/"
              element={
                <PageTransition>
                  <Landing />
                </PageTransition>
              }
            />
            <Route
              path="/features"
              element={
                <PageTransition>
                  <Features />
                </PageTransition>
              }
            />
            <Route
              path="/contact"
              element={
                <PageTransition>
                  <Contact />
                </PageTransition>
              }
            />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<AppShell />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/drives" element={<AllDrives />} />
              <Route path="/admin/drives/:id" element={<DriveDetails />} />
              <Route path="/admin/colleges" element={<ManageColleges />} />
              <Route path="/admin/companies" element={<ManageCompanies />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['COMPANY']} />}>
            <Route element={<AppShell />}>
              <Route path="/company" element={<CompanyDashboard />} />
              <Route path="/company/drives" element={<ModulePlaceholder title="My Drives" />} />
              <Route path="/company/colleges" element={<ModulePlaceholder title="Colleges" />} />
              <Route path="/company/applications" element={<ModulePlaceholder title="Applications" />} />
              <Route path="/company/schedule" element={<ModulePlaceholder title="Schedule" />} />
              <Route path="/company/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['COLLEGE']} />}>
            <Route element={<AppShell />}>
              <Route path="/college" element={<CollegeDashboard />} />
              <Route path="/college/invitations" element={<ModulePlaceholder title="Invitations" />} />
              <Route path="/college/drives" element={<ModulePlaceholder title="Drives" />} />
              <Route path="/college/students" element={<ModulePlaceholder title="Students" />} />
              <Route path="/college/schedule" element={<ModulePlaceholder title="Schedule" />} />
              <Route path="/college/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'COMPANY', 'COLLEGE']} />}>
            <Route element={<AppShell />}>
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default App;
