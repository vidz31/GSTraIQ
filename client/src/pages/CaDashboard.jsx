import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, AlertTriangle, FileText, IndianRupee, Building2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CaDashboard = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setActiveBusiness, businesses } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/businesses/ca-dashboard');
        setClients(data);
      } catch {
        toast.error('Failed to load CA dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleViewClient = (client) => {
    // Switch activeBusiness to this client and navigate to dashboard
    const biz = businesses.find((b) => b._id === client.businessId?.toString()) || {
      _id: client.businessId,
      name: client.name,
      gstin: client.gstin,
    };
    setActiveBusiness(biz);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Totals row
  const totals = clients.reduce(
    (acc, c) => ({
      invoiceCount: acc.invoiceCount + c.invoiceCount,
      totalTaxLiability: acc.totalTaxLiability + c.totalTaxLiability,
      anomalyCount: acc.anomalyCount + c.anomalyCount,
    }),
    { invoiceCount: 0, totalTaxLiability: 0, anomalyCount: 0 }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">CA Client Overview</h1>
        <p className="text-gray-500 font-medium">All your linked client businesses in one place.</p>
      </div>

      {clients.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-gray-400">
          <Building2 size={48} className="mb-4 opacity-30" />
          <p className="font-bold text-lg">No client businesses yet</p>
          <p className="text-sm mt-1">Ask clients to invite you as a CA to their business.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                {['Business Name', 'GSTIN', 'Invoices', 'Tax Liability', 'Anomalies', 'Action'].map((h) => (
                  <th key={h} className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider pr-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map((client) => (
                <tr key={client.businessId} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Building2 size={15} className="text-primary-600" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{client.name}</p>
                        <p className="text-xs text-gray-400 capitalize">{client.businessType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="font-mono text-sm text-gray-600">{client.gstin}</span>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-1.5">
                      <FileText size={15} className="text-gray-400" />
                      <span className="font-bold text-gray-800">{client.invoiceCount}</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-1">
                      <IndianRupee size={13} className="text-gray-500" />
                      <span className="font-bold text-gray-800">
                        {client.totalTaxLiability.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    {client.anomalyCount > 0 ? (
                      <span className="flex items-center gap-1.5 text-red-600 font-bold">
                        <AlertTriangle size={14} />
                        {client.anomalyCount}
                      </span>
                    ) : (
                      <span className="text-green-600 font-bold text-sm">Clean ✓</span>
                    )}
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => handleViewClient(client)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-sm font-bold hover:bg-primary-100 transition-colors"
                    >
                      <ExternalLink size={14} />
                      View
                    </button>
                  </td>
                </tr>
              ))}

              {/* Totals row */}
              <tr className="border-t-2 border-gray-200 bg-gray-50/60">
                <td className="py-4 pr-4 font-black text-gray-700" colSpan={2}>
                  Totals ({clients.length} clients)
                </td>
                <td className="py-4 pr-4">
                  <span className="font-black text-gray-800">{totals.invoiceCount}</span>
                </td>
                <td className="py-4 pr-4">
                  <div className="flex items-center gap-1">
                    <IndianRupee size={13} className="text-gray-600" />
                    <span className="font-black text-gray-800">
                      {totals.totalTaxLiability.toLocaleString('en-IN')}
                    </span>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  {totals.anomalyCount > 0 ? (
                    <span className="text-red-600 font-black">{totals.anomalyCount}</span>
                  ) : (
                    <span className="text-green-600 font-black">0</span>
                  )}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CaDashboard;
