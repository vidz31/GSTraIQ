import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  Users, 
  FileCheck, 
  Clock 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';

const COLORS = ['#0ea5e9', '#6366f1', '#f59e0b', '#ef4444'];

const StatCard = ({ title, value, change, isPositive, icon: Icon }) => (
  <div className="card group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-sm font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {change}%
      </div>
    </div>
    <h3 className="text-gray-500 font-medium text-sm mb-1">{title}</h3>
    <p className="text-2xl font-extrabold text-gray-900">{value}</p>
  </div>
);

const Dashboard = () => {
  const [summary, setSummary] = useState({ totalInputTax: 0, totalOutputTax: 0, netLiability: 0, invoiceCount: 0 });
  const [trends, setTrends] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, trendRes, vendorRes, invRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/trends'),
          api.get('/analytics/vendors'),
          api.get('/invoices')
        ]);
        setSummary(sumRes.data);
        setTrends(trendRes.data);
        setVendors(vendorRes.data);
        setRecentInvoices(invRes.data.slice(0, 4));
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 font-medium">Welcome back! Here's what's happening with your GST.</p>
        </div>
        <a 
          href="https://www.gst.gov.in/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-primary flex items-center gap-2"
        >
          <FileCheck size={20} />
          <span>File Returns</span>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Input Tax" value={`₹${summary.totalInputTax.toLocaleString()}`} change="12.5" isPositive={true} icon={TrendingUp} />
        <StatCard title="Total Output Tax" value={`₹${summary.totalOutputTax.toLocaleString()}`} change="8.2" isPositive={true} icon={TrendingDown} />
        <StatCard title="Net GST Liability" value={`₹${summary.netLiability.toLocaleString()}`} change="4.1" isPositive={false} icon={DollarSign} />
        <StatCard title="Total Invoices" value={summary.invoiceCount} change="2.4" isPositive={true} icon={Users} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900">Input Tax vs Output Tax</h3>
            <select className="bg-gray-50 border-none text-xs font-bold text-gray-500 rounded-lg px-2 py-1 outline-none">
              <option>Last 6 Months</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="input" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorInput)" />
                <Area type="monotone" dataKey="output" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorOutput)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-6">Vendor Contributions</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vendors}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {vendors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center">
              <span className="text-gray-400 text-xs font-bold uppercase">Top Vendor</span>
              <span className="text-xl font-extrabold text-gray-900">{vendors[0]?.name || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-gray-900">Recent Invoices</h3>
          <button className="text-primary-600 font-bold text-sm hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice ID</th>
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor</th>
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentInvoices.map((inv) => (
                <tr key={inv._id} className="group hover:bg-gray-50 transition-colors">
                  <td className="py-4 font-bold text-gray-900">{inv.invoiceNumber}</td>
                  <td className="py-4 text-gray-600 font-medium">{inv.vendorName}</td>
                  <td className="py-4 text-gray-500 font-medium">{new Date(inv.date).toLocaleDateString()}</td>
                  <td className="py-4 font-bold text-gray-900">₹{inv.totalAmount.toLocaleString()}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      inv.status === 'Verified' ? 'bg-green-100 text-green-700' : 
                      inv.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
