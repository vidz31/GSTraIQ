import React, { useState } from 'react';
import { FileText, FileDown, Table, CheckCircle2, Filter, X, Calendar, Building, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

const Reports = () => {
  const [showBuilder, setShowBuilder] = useState(false);
  const [filters, setFilters] = useState({
    vendor: '',
    startDate: '',
    endDate: '',
    minAmount: '',
    status: ''
  });

  const reports = [
    { name: 'GSTR-1 Summary', type: 'Filing', date: 'Monthly', status: 'Ready' },
    { name: 'GSTR-3B Computation', type: 'Filing', date: 'Monthly', status: 'Ready' },
    { name: 'Vendor Wise Tax Paid', type: 'Audit', date: 'Cumulative', status: 'Ready' },
    { name: 'Anomaly Summary', type: 'Audit', date: 'Monthly', status: 'Ready' },
  ];

  const handleDownload = (format, customFilters = null) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Session expired. Please login again.');
      return;
    }

    const activeFilters = customFilters || {};
    const queryParams = new URLSearchParams(activeFilters).toString();
    const url = `http://localhost:5000/api/reports/${format.toLowerCase()}?${queryParams}`;

    toast.loading(`Generating custom ${format} report...`, { duration: 2000 });

    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Custom_GST_Report_${Date.now()}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success('Custom report generated!');
      if (customFilters) setShowBuilder(false);
    })
    .catch(() => {
      toast.error('Failed to generate report');
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Reports Center</h1>
          <p className="text-gray-500 font-medium">Export audit-ready GST reports in multiple formats.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Standard Reports Cards (Already dynamic) */}
        <div className="card shadow-lg border-none">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText size={20} className="text-primary-600" />
            Standard Filing Reports
          </h3>
          <div className="space-y-4">
             {reports.filter(r => r.type === 'Filing').map((report, i) => (
               <div key={i} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-transparent hover:border-primary-100 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-primary-600 shadow-sm group-hover:scale-110 transition-transform">
                       <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{report.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{report.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownload('PDF')} className="p-2 hover:bg-white rounded-lg text-red-600 transition-colors"><FileDown size={18} /></button>
                    <button onClick={() => handleDownload('CSV')} className="p-2 hover:bg-white rounded-lg text-green-600 transition-colors"><Table size={18} /></button>
                  </div>
               </div>
             ))}
          </div>
        </div>

        <div className="card shadow-lg border-none">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-green-600" />
            Audit & Reconciliation
          </h3>
          <div className="space-y-4">
             {reports.filter(r => r.type !== 'Filing').map((report, i) => (
               <div key={i} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-transparent hover:border-green-100 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-xl text-green-600 shadow-sm group-hover:scale-110 transition-transform">
                       <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{report.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{report.date} • <span className="text-green-600">{report.status}</span></p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleDownload('PDF')} className="p-2 hover:bg-white rounded-lg text-red-600 transition-colors"><FileDown size={18} /></button>
                    <button onClick={() => handleDownload('CSV')} className="p-2 hover:bg-white rounded-lg text-green-600 transition-colors"><Table size={18} /></button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Report Builder Call-to-Action */}
      <div className="card bg-gray-900 text-white p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-primary-400 mb-6 border border-white/20">
          <Filter size={32} />
        </div>
        <h3 className="font-bold text-xl mb-2">Custom Report Builder</h3>
        <p className="text-gray-400 font-medium max-w-sm mt-2 mb-8">Need something specific? Build your own report by selecting custom parameters and data fields.</p>
        <button 
          onClick={() => setShowBuilder(true)}
          className="px-10 py-3.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-900/20 active:scale-95"
        >
          Launch Report Builder
        </button>
      </div>

      {/* Report Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-600 rounded-lg text-white">
                  <Filter size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Custom Report Builder</h2>
              </div>
              <button onClick={() => setShowBuilder(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Vendor Name (Optional)</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="e.g. Reliance"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                      value={filters.vendor}
                      onChange={(e) => setFilters({...filters, vendor: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="date"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                      value={filters.startDate}
                      onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="date"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                      value={filters.endDate}
                      onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Min Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="number"
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                      value={filters.minAmount}
                      onChange={(e) => setFilters({...filters, minAmount: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Invoice Status</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                  >
                    <option value="">All Statuses</option>
                    <option value="Verified">Verified Only</option>
                    <option value="Suspicious">Suspicious Only</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => handleDownload('PDF', filters)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95"
                >
                  <FileDown size={20} />
                  Export PDF
                </button>
                <button 
                  onClick={() => handleDownload('CSV', filters)}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all active:scale-95"
                >
                  <Table size={20} />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
