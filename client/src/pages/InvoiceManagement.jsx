import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Download,
  Calendar,
  IndianRupee,
  Building,
  X,
  ScanLine,
  Upload,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

// ─── Confidence dot indicator ─────────────────────────────────
const ConfidenceDot = ({ score }) => {
  if (score === undefined || score === null) return null;
  const color =
    score > 0.85 ? 'bg-green-500' :
    score >= 0.5 ? 'bg-amber-400' :
    'bg-red-500';
  const label =
    score > 0.85 ? 'High confidence' :
    score >= 0.5 ? 'Medium confidence' :
    'Low confidence — verify this field';
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`}
      title={`${label} (${Math.round(score * 100)}%)`}
    />
  );
};

// ─── OCR Scanner Modal ────────────────────────────────────────
const OcrScanModal = ({ onClose, onConfirm }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [ocrData, setOcrData] = useState(null);
  const [editedData, setEditedData] = useState({});
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    setFile(f);
    setOcrData(null);
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f));
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  };

  const handleScan = async () => {
    if (!file) return;
    setScanning(true);
    try {
      const formData = new FormData();
      formData.append('invoice', file);
      const { data } = await api.post('/invoices/scan-ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setOcrData(data.data);
      setEditedData({
        vendorName: data.data.vendorName || '',
        invoiceNumber: data.data.invoiceNumber || '',
        date: data.data.date || '',
        amount: data.data.amount || '',
        taxRate: data.data.taxRate || 18,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'OCR scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleConfirm = () => {
    onConfirm(editedData);
    onClose();
  };

  const fields = [
    { key: 'vendorName', label: 'Vendor Name', type: 'text' },
    { key: 'invoiceNumber', label: 'Invoice Number', type: 'text' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'amount', label: 'Amount (₹)', type: 'number' },
    { key: 'taxRate', label: 'Tax Rate (%)', type: 'number' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-primary-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
              <ScanLine size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">AI Invoice Scanner</h2>
              <p className="text-xs text-gray-500">Upload an invoice image to auto-extract data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Upload Zone */}
          {!ocrData && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragging ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                <Upload size={32} className="mx-auto text-gray-300 mb-3" />
                {file ? (
                  <div>
                    <p className="font-bold text-gray-700">{file.name}</p>
                    <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="font-bold text-gray-700">Drag & drop your invoice</p>
                    <p className="text-sm text-gray-400 mt-1">JPG, PNG or PDF • Max 10 MB</p>
                  </div>
                )}
              </div>

              {/* Camera button */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors"
                >
                  <Camera size={16} />
                  Take Photo
                </button>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={!file || scanning}
                  className="flex-1 flex items-center justify-center gap-2 btn-primary py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {scanning ? (
                    <><Loader2 size={16} className="animate-spin" /> Scanning...</>
                  ) : (
                    <><ScanLine size={16} /> Scan Invoice</>
                  )}
                </button>
              </div>

              {/* Preview */}
              {preview && (
                <div className="rounded-2xl overflow-hidden border border-gray-200">
                  <img src={preview} alt="Preview" className="w-full max-h-48 object-contain bg-gray-50" />
                </div>
              )}
            </>
          )}

          {/* OCR Results */}
          {ocrData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">📋 OCR Results — Review & Edit</h3>
                <button
                  onClick={() => setOcrData(null)}
                  className="text-xs text-primary-600 hover:underline font-medium"
                >
                  ← Rescan
                </button>
              </div>

              {/* GSTIN */}
              {ocrData.GSTIN && (
                <div className={`rounded-xl p-3 flex items-center gap-3 ${ocrData.gstinValid ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                  {ocrData.gstinValid ? (
                    <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-gray-600">GSTIN</p>
                    <p className="font-mono text-sm font-bold">{ocrData.GSTIN}</p>
                    {ocrData.gstinValidationError && (
                      <p className="text-xs text-red-500 mt-0.5">{ocrData.gstinValidationError}</p>
                    )}
                  </div>
                  <ConfidenceDot score={ocrData.confidence?.GSTIN} />
                </div>
              )}

              {/* Editable fields */}
              {fields.map(({ key, label, type }) => (
                <div key={key}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-sm font-bold text-gray-700">{label}</label>
                    <ConfidenceDot score={ocrData.confidence?.[key]} />
                    {ocrData.confidence?.[key] < 0.5 && (
                      <span className="text-[10px] text-red-500 font-bold flex items-center gap-0.5">
                        <AlertCircle size={10} /> Verify
                      </span>
                    )}
                  </div>
                  <input
                    type={type}
                    value={editedData[key] || ''}
                    onChange={(e) => setEditedData({ ...editedData, [key]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all text-sm"
                  />
                </div>
              ))}

              {/* Confidence legend */}
              <div className="flex items-center gap-4 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> High (&gt;85%)</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Medium</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Low (&lt;50%)</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Confirm & Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────
const InvoiceManagement = () => {
  const [showModal, setShowModal] = useState(false);
  const [showOcrModal, setShowOcrModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/invoices');
      setInvoices(data);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.post('/invoices', { ...data, type: 'intra' });
      toast.success('Invoice added successfully!');
      setShowModal(false);
      reset();
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to add invoice');
    }
  };

  // Called when user confirms OCR data — pre-fills the manual form and opens it
  const handleOcrConfirm = async (ocrFields) => {
    try {
      await api.post('/invoices', { ...ocrFields, type: 'intra' });
      toast.success('Invoice saved from OCR scan!');
      fetchInvoices();
    } catch (err) {
      // Fall back: open the manual form pre-filled
      Object.entries(ocrFields).forEach(([k, v]) => setValue(k, v));
      setShowModal(true);
      toast('Please review and save the invoice.', { icon: '📋' });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.delete(`/invoices/${id}`);
        toast.success('Invoice deleted');
        fetchInvoices();
      } catch (error) {
        toast.error('Failed to delete invoice');
      }
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Invoice Management</h1>
          <p className="text-gray-500 font-medium">Create, edit and track your GST invoices.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Scan Invoice button */}
          <button
            onClick={() => setShowOcrModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors"
          >
            <ScanLine size={18} />
            <span>Scan Invoice</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            <span>Add New Invoice</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by vendor or invoice ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors">
              <Download size={18} />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Invoice Details</th>
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">GST ({filteredInvoices[0]?.taxRate || 18}%)</th>
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInvoices.map((inv) => (
                <tr key={inv._id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-900">{inv.vendorName}</span>
                      <span className="text-xs text-gray-500 font-medium">
                        {inv.invoiceNumber} • {new Date(inv.date).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td className="py-5 font-bold text-gray-900">₹{inv.amount.toLocaleString()}</td>
                  <td className="py-5 font-bold text-primary-600">₹{(inv.cgst + inv.sgst + inv.igst).toLocaleString()}</td>
                  <td className="py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      inv.status === 'Verified' ? 'bg-green-100 text-green-700' :
                      inv.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(inv._id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Add New Invoice</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Vendor Name</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      {...register('vendorName', { required: true })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                      placeholder="Reliance Ind."
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Invoice Number</label>
                  <input
                    {...register('invoiceNumber', { required: true })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    placeholder="INV-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      {...register('date', { required: true })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Amount (₹)</label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="number"
                      {...register('amount', { required: true })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Tax Rate (%)</label>
                  <select
                    {...register('taxRate')}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                  >
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-3">
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OCR Scanner Modal */}
      {showOcrModal && (
        <OcrScanModal
          onClose={() => setShowOcrModal(false)}
          onConfirm={handleOcrConfirm}
        />
      )}
    </div>
  );
};

export default InvoiceManagement;
