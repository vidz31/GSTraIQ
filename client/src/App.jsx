import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import InvoiceManagement from './pages/InvoiceManagement';
import Analytics from './pages/Analytics';
import PredictionModule from './pages/PredictionModule';
import Anomalies from './pages/Anomalies';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import CashFlow from './pages/CashFlow';
import CaDashboard from './pages/CaDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<InvoiceManagement />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/predictions" element={<PredictionModule />} />
              <Route path="/anomalies" element={<Anomalies />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/cash-flow" element={<CashFlow />} />
              <Route path="/ca-dashboard" element={<CaDashboard />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
