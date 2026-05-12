import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import GSTCopilot from './GSTCopilot';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col relative">
        <Navbar />
        <main className="flex-1 mt-20 p-8 overflow-auto">
          <Outlet />
        </main>
        {/* GST Copilot floating button — uses absolute positioning inside relative wrapper */}
        <GSTCopilot />
      </div>
    </div>
  );
};

export default Layout;
