import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Common
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import HomePage from './pages/public/HomePage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import EventDetailPage from './pages/public/EventDetailPage';

// Buyer Pages
import BuyerDashboard from './pages/buyer/DashboardPage';
import CheckoutPage from './pages/buyer/CheckoutPage';
import TicketsPage from './pages/buyer/TicketsPage';
import HistoryPage from './pages/buyer/HistoryPage';
import ProfilePage from './pages/buyer/ProfilePage';

// Operator Pages
import OperatorDashboard from './pages/operator/DashboardPage';
import OperatorEvents from './pages/operator/EventsPage';
import OperatorTicketTypes from './pages/operator/TicketTypesPage';
import OperatorTransactions from './pages/operator/TransactionsPage';
import ScannerPage from './pages/operator/ScannerPage';

// Admin Pages
import AdminDashboard from './pages/admin/DashboardPage';
import AdminOperators from './pages/admin/OperatorsPage';
import AdminEvents from './pages/admin/EventsPage';
import AdminUsers from './pages/admin/UsersPage';
import AdminSettings from './pages/admin/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#0B0B0C',
            border: '1px solid #E4E2DC',
            borderRadius: '999px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
            fontSize: 14,
          },
          success: { iconTheme: { primary: '#12A896', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* ── Public Routes ── */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="event/:id" element={<EventDetailPage />} />
        </Route>

        {/* ── Auth Routes (no layout) ── */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />

        {/* ── Buyer Dashboard ── */}
        <Route element={<ProtectedRoute roles={['buyer']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<BuyerDashboard />} />
          <Route path="checkout/:id" element={<CheckoutPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* ── Operator Dashboard ── */}
        <Route element={<ProtectedRoute roles={['operator']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="operator" element={<OperatorDashboard />} />
          <Route path="operator/events" element={<OperatorEvents />} />
          <Route path="operator/events/:id/tickets" element={<OperatorTicketTypes />} />
          <Route path="operator/transactions" element={<OperatorTransactions />} />
          <Route path="operator/scanner" element={<ScannerPage />} />
          <Route path="operator/profile" element={<ProfilePage />} />
        </Route>

        {/* ── Admin Dashboard ── */}
        <Route element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/operators" element={<AdminOperators />} />
          <Route path="admin/events" element={<AdminEvents />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/settings" element={<AdminSettings />} />
        </Route>

        {/* ── Catch All ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
