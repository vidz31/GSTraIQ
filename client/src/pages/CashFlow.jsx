import React, { useState, useEffect } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Lightbulb, TrendingUp, Wallet, ShieldCheck, Calendar } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── Month Heatmap ──────────────────────────────────────────────
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const getHeatColor = (value, max) => {
  if (!value || max === 0) return 'bg-blue-50';
  const ratio = value / max;
  if (ratio > 0.8) return 'bg-blue-600 text-white';
  if (ratio > 0.6) return 'bg-blue-500 text-white';
  if (ratio > 0.4) return 'bg-blue-400 text-white';
  if (ratio > 0.2) return 'bg-blue-300';
  return 'bg-blue-100';
};

const MonthHeatmap = ({ monthlyActual, predictions }) => {
  // Build a lookup by YYYY-MM
  const actualMap = {};
  monthlyActual.forEach((m) => { actualMap[m.month] = m.totalTax; });
  const predMap = {};
  predictions.forEach((m) => { predMap[m.month] = m.predictedTax; });

  // Current year cells
  const currentYear = new Date().getFullYear();
  const cells = MONTH_NAMES.map((name, i) => {
    const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
    const actual = actualMap[key];
    const predicted = predMap[key];
    return { name, key, value: actual ?? predicted, isPredicted: !actual && !!predicted };
  });

  const max = Math.max(...cells.map((c) => c.value || 0), 1);

  return (
    <div className="card">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar size={18} className="text-primary-600" />
        Monthly Tax Heatmap — {currentYear}
      </h3>
      <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
        {cells.map((cell) => (
          <div
            key={cell.key}
            className={`rounded-xl p-2 flex flex-col items-center justify-center aspect-square transition-all hover:scale-105 cursor-default
              ${getHeatColor(cell.value, max)}
              ${cell.isPredicted ? 'border-2 border-dashed border-blue-400' : ''}
            `}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{cell.name}</span>
            {cell.value ? (
              <span className="text-[11px] font-bold mt-0.5">
                ₹{(cell.value / 1000).toFixed(0)}k
              </span>
            ) : (
              <span className="text-[11px] text-gray-400 mt-0.5">—</span>
            )}
            {cell.isPredicted && (
              <span className="text-[8px] uppercase tracking-wider mt-0.5 opacity-70">est.</span>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-gray-200 inline-block"></span> Low</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block"></span> Medium</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-600 inline-block"></span> High</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border-2 border-dashed border-blue-400 inline-block"></span> Predicted</span>
      </div>
    </div>
  );
};

// ─── Reserve Calculator ──────────────────────────────────────────
const ReserveCalculator = () => {
  const [revenue, setRevenue] = useState('');
  const [gstRate, setGstRate] = useState(18);
  const [itcRatio, setItcRatio] = useState(80);

  const rev = parseFloat(revenue) || 0;
  const gstOutput = (rev * gstRate) / 100;
  const itcCredit = (gstOutput * itcRatio) / 100;
  const netLiability = Math.max(0, gstOutput - itcCredit);

  return (
    <div className="card">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Wallet size={18} className="text-primary-600" />
        Reserve Calculator
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            Expected Monthly Revenue (₹)
          </label>
          <input
            type="number"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all"
            placeholder="e.g. 500000"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            GST Rate (%)
          </label>
          <select
            value={gstRate}
            onChange={(e) => setGstRate(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary-500 transition-all"
          >
            {[5, 12, 18, 28].map((r) => <option key={r} value={r}>{r}%</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1.5">
            ITC Credit Ratio (%)
          </label>
          <input
            type="number"
            value={itcRatio}
            min={0}
            max={100}
            onChange={(e) => setItcRatio(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition-all"
          />
        </div>
      </div>

      {rev > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">GST Output</p>
            <p className="text-2xl font-black text-blue-700">₹{gstOutput.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">ITC Credit</p>
            <p className="text-2xl font-black text-green-700">₹{itcCredit.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Net Liability</p>
            <p className="text-2xl font-black text-amber-700">₹{netLiability.toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────
const CashFlow = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: res } = await api.get('/cashflow/planner');
        setData(res);
      } catch {
        toast.error('Failed to load cash flow data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { monthlyActual = [], predictions = [], reservePlan = {}, insights = [] } = data || {};

  // Build chart data: merge actuals + predictions
  const chartData = [
    ...monthlyActual.map((m) => ({
      month: m.month,
      actual: m.totalTax,
      label: m.month.slice(5), // MM
    })),
    ...predictions.map((p) => ({
      month: p.month,
      predicted: p.predictedTax,
      label: p.month.slice(5),
    })),
  ].sort((a, b) => a.month.localeCompare(b.month));

  const confidenceBadge = predictions[0]?.confidence;
  const badgeColor = {
    High: 'bg-green-100 text-green-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low: 'bg-red-100 text-red-700',
  }[confidenceBadge] || 'bg-gray-100 text-gray-600';

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Cash Flow & Tax Reserve Planner</h1>
        <p className="text-gray-500 font-medium">Predict your GST liability and plan reserves smartly.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card flex items-center gap-5">
          <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <TrendingUp size={22} className="text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Next Month Liability</p>
            <p className="text-2xl font-black text-gray-900">
              ₹{(reservePlan.nextMonthLiability || 0).toLocaleString('en-IN')}
            </p>
            {confidenceBadge && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                {confidenceBadge} Confidence
              </span>
            )}
          </div>
        </div>

        <div className="card flex items-center gap-5">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Wallet size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Set Aside Weekly</p>
            <p className="text-2xl font-black text-gray-900">
              ₹{(reservePlan.weeklySetAside || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-gray-500">₹{(reservePlan.dailySetAside || 0).toLocaleString('en-IN')}/day</p>
          </div>
        </div>

        <div className="card flex items-center gap-5">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={22} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recommended Buffer</p>
            <p className="text-2xl font-black text-gray-900">
              ₹{(reservePlan.recommendedBuffer || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-gray-500">1.2× predicted liability</p>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <MonthHeatmap monthlyActual={monthlyActual} predictions={predictions} />

      {/* Insights */}
      {insights.length > 0 && (
        <div className="card">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb size={18} className="text-amber-500" />
            Insights
          </h3>
          <div className="space-y-3">
            {insights.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 font-medium">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-5">Monthly GST Trend</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v) => [`₹${v?.toLocaleString('en-IN')}`, undefined]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar dataKey="actual" name="Actual Tax" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={40} />
              <Line
                dataKey="predicted"
                name="Predicted Tax"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="6 3"
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <TrendingUp size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Add invoices to see your cash flow trends</p>
          </div>
        )}
      </div>

      {/* Reserve Calculator */}
      <ReserveCalculator />
    </div>
  );
};

export default CashFlow;
