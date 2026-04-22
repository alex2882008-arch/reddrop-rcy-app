import { createBrowserRouter } from 'react-router';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminSignup from './pages/AdminSignup';
import Dashboard from './pages/Dashboard';
import DonorDirectory from './pages/DonorDirectory';
import EmergencyRequests from './pages/EmergencyRequests';
import Camps from './pages/Camps';
import ProfileSettings from './pages/ProfileSettings';
import AdminConsole from './pages/AdminConsole';
import RouteError from './pages/RouteError';
import LegalPolicies from './pages/LegalPolicies';

export const router = createBrowserRouter([
  { path: '/', Component: Landing, errorElement: <RouteError /> },
  { path: '/login', Component: Login, errorElement: <RouteError /> },
  { path: '/signup', Component: Signup, errorElement: <RouteError /> },
  { path: '/admin-signup', Component: AdminSignup, errorElement: <RouteError /> },
  { path: '/dashboard', Component: Dashboard, errorElement: <RouteError /> },
  { path: '/donors', Component: DonorDirectory, errorElement: <RouteError /> },
  { path: '/emergency', Component: EmergencyRequests, errorElement: <RouteError /> },
  { path: '/camps', Component: Camps, errorElement: <RouteError /> },
  { path: '/profile', Component: ProfileSettings, errorElement: <RouteError /> },
  { path: '/admin', Component: AdminConsole, errorElement: <RouteError /> },
  { path: '/legal', Component: LegalPolicies, errorElement: <RouteError /> },
]);
