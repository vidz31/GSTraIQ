import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  Copy, 
  Zap, 
  CheckCircle, 
  Search, 
  Settings, 
  X, 
  Bell, 
  Shield, 
  Clock,
  Loader2,
  Edit3,
  Calendar,
  Building,
  IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../services/api';

const Anomalies = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anomalies, setAnomalies] = useState([]);
  const [stats, setStats] = useState({ totalScanned: 0, accuracy: 0 });
  const [settings, setSettings] = useState({
    realTime: true,
    duplicates: true,
    highValue: true,
    threshold: 50000,
    notifications: true
  });

  const [resolveData, setResolveData] = useState({
    vendorName: '',
    amount: '',
    taxRate: '',
    type: 'intra',
    date: ''
  });

  const fetchData = async () => {
    try {
      const [anomaliesRes, advancedRes] = await Promise.all([
        api.get('/predictions/anomalies'),
        api.get('/analytics/advanced')
      ]);
      setAnomalies(anomaliesRes.data);
      setStats(advancedRes.data.stats);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openResolveModal = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setResolveData({
      vendorName: anomaly.vendorName,
      amount: anomaly.amount,
      taxRate: anomaly.taxRate,
      type: anomaly.igst > 0 ? 'inter' : 'intra',
      date: new Date(anomaly.date).toISOString().split('T')[0]
    });
    setShowResolveModal(true);
  };

  const handleResolve = async () => {
    try {
      await api.put(`/predictions/anomalies/${selectedAnomaly._id}/resolve`, resolveData);
      toast.success('Invoice corrected and verified!');
      setShowResolveModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to resolve anomaly');
    }
  };

  const handleDismiss = async (id) => {
    try {
      await api.put(`/predictions/anomalies/${id}/dismiss`);
      toast.success('Anomaly dismissed');
      fetchData();
    } catch (error) {
      toast.error('Failed to dismiss anomaly');
    }
  };

  const handleReScan = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/predictions/anomalies/re-scan');
      toast.success(`Re-scan complete! Found ${data.newAnomaliesFound} new anomalies.`);
      fetchData();
    } catch (error) {
      toast.error('Re-scan failed. Make sure ML service is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = () => {
    toast.success('Settings updated successfully!');
    setShowSettings(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
            Anomaly Detection
            <span className="bg-red-100 text-red-700 text-[10px] uppercase tracking-widest px-2 py-1 rounded-md">Live Scanning</span>
          </h1>
          <p className="text-gray-500 font-medium">Automatic identification of errors, fraud and compliance risks.</p>
        </div>
        <button 
          onClick={handleReScan}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-gray-200 active:scale-95"
        >
          <Search size={18} />
          <span>Manual Re-scan</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center py-10 border-red-100 bg-red-50/30">
          <p className="text-4xl font-black text-red-600 mb-1">{anomalies.length.toString().padStart(2, '0')}</p>
          <p className="text-xs font-bold text-red-800 uppercase tracking-widest">Active Alerts</p>
        </div>
        <div className="card text-center py-10 border-green-100 bg-green-50/30">
          <p className="text-4xl font-black text-green-600 mb-1">{stats.totalScanned}</p>
          <p className="text-xs font-bold text-green-800 uppercase tracking-widest">Invoices Scanned</p>
        </div>
        <div className="card text-center py-10 border-blue-100 bg-blue-50/30">
          <p className="text-4xl font-black text-blue-600 mb-1">{stats.accuracy}%</p>
          <p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Detection Accuracy</p>
        </div>
      </div>

      {/* Alert Queue */}
      <div className="space-y-4">
        <h3 className="font-bold text-gray-900 text-lg">Active Alerts Queue</h3>
        {anomalies.length === 0 ? (
          <div className="card text-center py-12 bg-gray-50 border-dashed border-gray-200">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <h4 className="font-bold text-gray-900">No Anomalies Detected</h4>
            <p className="text-sm text-gray-500">Your compliance status is currently healthy.</p>
          </div>
        ) : (
          anomalies.map((anomaly, index) => (
            <div key={index} className="card group hover:border-gray-300">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="p-4 rounded-2xl bg-red-100 text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-gray-900">{anomaly.anomalyType || 'Suspicious Transaction'}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-tighter bg-red-600 text-white">
                        High Priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium max-w-2xl">
                      Invoice #{anomaly.invoiceNumber} from {anomaly.vendorName} for ₹{anomaly.amount.toLocaleString()} was flagged by AI as {anomaly.status.toLowerCase()}.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDismiss(anomaly._id)}
                    className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                  <button 
                    onClick={() => openResolveModal(anomaly)}
                    className="px-4 py-2 text-sm font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolve/Edit Modal */}
      <AnimatePresence>
        {showResolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResolveModal(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-primary-600 text-white">
                <div className="flex items-center gap-3">
                  <Edit3 size={24} />
                  <h2 className="text-xl font-bold">Review & Resolve Anomaly</h2>
                </div>
                <button onClick={() => setShowResolveModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Correct Vendor Name</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 outline-none transition-all"
                        value={resolveData.vendorName}
                        onChange={(e) => setResolveData({...resolveData, vendorName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Base Amount (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="number" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 outline-none transition-all font-bold"
                        value={resolveData.amount}
                        onChange={(e) => setResolveData({...resolveData, amount: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Correct Tax Rate (%)</label>
                    <select 
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 outline-none transition-all font-bold"
                      value={resolveData.taxRate}
                      onChange={(e) => setResolveData({...resolveData, taxRate: e.target.value})}
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="12">12%</option>
                      <option value="18">18%</option>
                      <option value="28">28%</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Supply Type</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setResolveData({...resolveData, type: 'intra'})}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${resolveData.type === 'intra' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        Intra-state
                      </button>
                      <button 
                        onClick={() => setResolveData({...resolveData, type: 'inter'})}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${resolveData.type === 'inter' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        Inter-state
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Invoice Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input 
                        type="date" 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 outline-none transition-all"
                        value={resolveData.date}
                        onChange={(e) => setResolveData({...resolveData, date: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setShowResolveModal(false)}
                    className="flex-1 px-6 py-4 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleResolve}
                    className="flex-1 px-6 py-4 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={20} />
                    Verify & Resolve
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Compliance Shield */}
      <div className="card bg-gray-900 text-white p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-primary-400 border border-white/20 shadow-inner">
              <Shield size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                Compliance Shield Active
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              </h3>
              <p className="text-gray-400 font-medium">Your account is currently protected against potential GST filing errors.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-all active:scale-95"
          >
            <Settings size={20} />
            <span>View Settings</span>
          </button>
        </div>
      </div>

      {/* Settings Modal (Unchanged) */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-[2rem] w-full max-w-xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-200"><Shield size={24} /></div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Shield Settings</h2>
                    <p className="text-xs text-gray-500 font-medium">Configure your anomaly detection parameters</p>
                  </div>
                </div>
                <button onClick={() => setShowSettings(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Clock size={20} /></div>
                      <div><p className="font-bold text-gray-900">Real-time Scanning</p><p className="text-xs text-gray-500 font-medium">Scan invoices as they are uploaded</p></div>
                    </div>
                    <button onClick={() => setSettings({...settings, realTime: !settings.realTime})} className={`w-12 h-6 rounded-full transition-colors relative ${settings.realTime ? 'bg-primary-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.realTime ? 'left-7' : 'left-1'}`}></div></button>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button onClick={() => setShowSettings(false)} className="flex-1 px-6 py-3.5 border border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all active:scale-95">Discard</button>
                  <button onClick={handleSaveSettings} className="flex-1 px-6 py-3.5 bg-primary-600 text-white rounded-2xl font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center gap-2"><CheckCircle size={20} />Save Configuration</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Anomalies;
