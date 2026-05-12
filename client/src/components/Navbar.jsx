import { Bell, Search, User, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BusinessSwitcher from './BusinessSwitcher';

const Navbar = () => {
  const { user } = useAuth();

  return (
    <header className="h-20 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-30 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search invoices, reports..." 
            className="w-full bg-gray-100/50 border-transparent border focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 rounded-xl pl-11 pr-4 py-2.5 outline-none transition-all"
          />
        </div>
      </div>

      {/* Business Switcher — center of navbar */}
      <div className="mx-6">
        <BusinessSwitcher />
      </div>

      <div className="flex items-center gap-6">
        <button className="text-gray-500 hover:text-primary-600 relative transition-colors">
          <Bell size={22} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full text-[10px] text-white flex items-center justify-center font-bold">3</span>
        </button>
        
        <button className="text-gray-500 hover:text-primary-600 transition-colors">
          <HelpCircle size={22} />
        </button>

        <div className="h-8 w-px bg-gray-200"></div>

        <Link to="/profile" className="flex items-center gap-3 pl-2 group cursor-pointer">
          <div className="text-right">
            <p className="text-sm font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{user?.name}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{user?.role}</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white border-2 border-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all">
            <User size={20} />
          </div>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
