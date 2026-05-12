import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { Info, Download, Filter, Calendar, Loader2 } from 'lucide-react';
import api from '../services/api';

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899'];

const Analytics = () => {
  const [trends, setTrends] = useState([]);
  const [advanced, setAdvanced] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendsRes, advancedRes] = await Promise.all([
          api.get('/analytics/trends'),
          api.get('/analytics/advanced')
        ]);
        setTrends(trendsRes.data);
        setAdvanced(advancedRes.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const distributionData = advanced?.taxDistribution || [
    { name: 'IGST', value: 0 },
    { name: 'CGST', value: 0 },
    { name: 'SGST', value: 0 },
    { name: 'Cess', value: 0 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-500 font-medium">Deep dive into your tax patterns and vendor behavior.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
            <Calendar size={18} />
            <span>FY 2024-25</span>
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download size={18} />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-bold text-gray-900">Monthly Tax Trends</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">Comparison between Payable Tax vs Input Credit</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                <span className="text-xs font-bold text-gray-500">Tax Payable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                <span className="text-xs font-bold text-gray-500">Input Credit</span>
              </div>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="input" name="Input Tax" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={20} />
                <Bar dataKey="output" name="Output Tax" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-2">Tax Distribution</h3>
          <p className="text-xs text-gray-400 font-medium mb-8">Breakdown by GST component type</p>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 space-y-3">
            {distributionData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index]}}></div>
                  <span className="text-sm font-medium text-gray-600">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <h3 className="font-bold text-gray-900">Seasonal Analysis</h3>
            <Info size={16} className="text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-8">
            Tax activity visualization based on your uploaded invoice patterns over time.
          </p>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={advanced?.seasonalAnalysis || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" hide />
                <Tooltip />
                <Line type="monotone" dataKey="tax" stroke="#0ea5e9" strokeWidth={3} dot={{fill: '#0ea5e9', r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="font-bold text-gray-900 mb-6">Vendor Compliance Score</h3>
          <div className="space-y-6">
            {(advanced?.vendorScores || []).length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No vendor data available</p>
            ) : (
              advanced.vendorScores.map((vendor) => (
                <div key={vendor.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900">{vendor.name}</span>
                    <span className={`text-xs font-bold ${vendor.score > 70 ? 'text-green-600' : 'text-red-600'}`}>{vendor.score}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${vendor.score > 70 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${vendor.score}%` }}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
