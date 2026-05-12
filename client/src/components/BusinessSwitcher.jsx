import React, { useState } from 'react';
import { ChevronDown, Check, Plus, Building2, CreditCard, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const BusinessSwitcher = () => {
  const { businesses, activeBusiness, setActiveBusiness, setBusinesses, fetchBusinesses } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', gstin: '', businessType: 'regular' });
  const [submitting, setSubmitting] = useState(false);

  // Check if user has any CA role
  const hasCaBusinesses = businesses.some((b) =>
    b.members?.some((m) => m.role === 'ca')
  );

  const handleSwitch = (biz) => {
    setActiveBusiness(biz);
    setOpen(false);
    // Reload the current page data by triggering a navigation (soft refresh)
    window.location.reload();
  };

  const handleAddBusiness = async (e) => {
    e.preventDefault();
    if (!GSTIN_REGEX.test(form.gstin.toUpperCase())) {
      toast.error('Invalid GSTIN format');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/businesses', {
        ...form,
        gstin: form.gstin.toUpperCase(),
      });
      setBusinesses((prev) => [...prev, data]);
      setActiveBusiness(data);
      setShowAddModal(false);
      setForm({ name: '', gstin: '', businessType: 'regular' });
      toast.success(`"${data.name}" added!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create business');
    } finally {
      setSubmitting(false);
    }
  };

  const displayGstin = activeBusiness?.gstin
    ? `•• ${activeBusiness.gstin.slice(-4)}`
    : '';

  return (
    <div className="relative">
      {/* Trigger */}
      {(!businesses || businesses.length === 0) ? (
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600 text-sm font-medium transition-all"
        >
          <Plus size={15} />
          Add Business
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all text-sm font-semibold text-gray-700 shadow-sm"
        >
          <Building2 size={16} className="text-primary-600" />
          <span className="max-w-[130px] truncate">{activeBusiness?.name || 'Select Business'}</span>
          {displayGstin && (
            <span className="text-xs text-gray-400 font-mono">{displayGstin}</span>
          )}
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="p-3 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Your Businesses</p>
            </div>
            <div className="py-2 max-h-60 overflow-y-auto">
              {businesses.map((biz) => (
                <button
                  key={biz._id}
                  onClick={() => handleSwitch(biz)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex flex-col items-start text-left">
                    <span className="font-semibold text-gray-800 text-sm">{biz.name}</span>
                    <span className="text-xs text-gray-400 font-mono">{biz.gstin}</span>
                  </div>
                  {activeBusiness?._id === biz._id && (
                    <Check size={16} className="text-primary-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 py-2">
              <button
                onClick={() => { setShowAddModal(true); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-primary-600 hover:bg-primary-50 transition-colors font-medium"
              >
                <Plus size={16} />
                Add Business
              </button>
              {hasCaBusinesses && (
                <button
                  onClick={() => { navigate('/ca-dashboard'); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
                >
                  <ExternalLink size={16} />
                  CA Dashboard
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Add Business Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-hidden">
          {/* Backdrop Closer */}
          <div className="absolute inset-0" onClick={() => setShowAddModal(false)} />
          
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 relative flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                  <Building2 size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Add Business</h3>
                  <p className="text-xs text-gray-400 font-medium tracking-tight">Register a new entity in GSTraIQ</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            {/* Scrollable Form Body */}
            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleAddBusiness} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Business Name</label>
                  <input
                    required
                    autoFocus
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all"
                    placeholder="e.g. Raj Electronics"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">GSTIN Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      required
                      value={form.gstin}
                      onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
                      maxLength={15}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all font-mono tracking-wider uppercase"
                      placeholder="29ABCDE1234F1Z5"
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1.5 px-1">
                    <p className="text-[10px] text-gray-400 font-medium">Format: 15-char Alpha-numeric</p>
                    <p className={`text-[10px] font-bold ${form.gstin.length === 15 ? 'text-green-500' : 'text-gray-300'}`}>
                      {form.gstin.length}/15
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Business Type</label>
                  <select
                    value={form.businessType}
                    onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:bg-white focus:border-primary-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="regular">Regular Taxpayer</option>
                    <option value="composition">Composition Scheme</option>
                    <option value="qrmp">QRMP Scheme</option>
                  </select>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3.5 px-4 rounded-2xl text-gray-600 font-bold hover:bg-gray-100 transition-colors border border-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3.5 px-4 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Plus size={18} />
                        Create Business
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessSwitcher;
