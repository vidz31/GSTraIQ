import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  BarChart3, 
  LineChart, 
  AlertTriangle, 
  FileDown, 
  Settings,
  LogOut,
  ChevronRight,
  Wallet,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout, businesses } = useAuth();

  // Check if current user has CA role in any business they belong to
  const hasCaRole = businesses?.some((b) =>
    b.members?.some((m) => 
      (m.user?.toString() === user?._id?.toString() || m.user?._id?.toString() === user?._id?.toString()) && 
      m.role === 'ca'
    )
  );

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Invoices', icon: FileText, path: '/invoices' },
    { name: 'Analytics', icon: BarChart3, path: '/analytics' },
    { name: 'Predictions', icon: LineChart, path: '/predictions' },
    { name: 'Anomalies', icon: AlertTriangle, path: '/anomalies' },
    { name: 'Cash Flow', icon: Wallet, path: '/cash-flow' },
    { name: 'Reports', icon: FileDown, path: '/reports' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col fixed left-0 top-0 z-40 transition-transform duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
          G
        </div>
        <div>
          <h1 className="font-bold text-gray-900 leading-tight">GSTraIQ</h1>
          <p className="text-xs text-gray-500 font-medium tracking-wider">SMART ANALYTICS</p>
        </div>
      </div>

      <nav className="flex-1 mt-6 px-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-primary-50 text-primary-600 font-semibold' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className="group-hover:scale-110 transition-transform" />
              <span>{item.name}</span>
            </div>
            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}

        {/* CA Dashboard — only visible if user has CA role */}
        {hasCaRole && (
          <NavLink
            to="/ca-dashboard"
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-indigo-50 text-indigo-600 font-semibold' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <div className="flex items-center gap-3">
              <Users size={20} className="group-hover:scale-110 transition-transform" />
              <span>Client Overview</span>
            </div>
            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
