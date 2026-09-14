import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Navbar is rendered OUTSIDE the flex row so it spans full width */}
      <Navbar />

      {/* Below the navbar: sidebar (fixed) + main content */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--navbar-height))' }}>
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="dashboard-content">
          <div className="dashboard-main">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
