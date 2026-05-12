import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { BrainCircuit, TrendingUp, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import api from '../services/api';

const PredictionModule = () => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const { data } = await api.get('/predictions/gst');
        setPrediction(data);
      } catch (error) {
        console.error('Error fetching prediction:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPrediction();
  }, []);

  const forecastData = [
    { month: 'Jun', actual: 45000, predicted: 45000 },
    { month: 'Jul', actual: 48000, predicted: 48500 },
    { month: 'Aug', actual: 52000, predicted: 51000 },
    { month: 'Sep', predicted: prediction?.predicted_gst_amount || 58000 },
    { month: 'Oct', predicted: (prediction?.predicted_gst_amount || 58000) * 1.1 },
    { month: 'Nov', predicted: (prediction?.predicted_gst_amount || 58000) * 0.95 },
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
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
            AI Predictions
            <span className="bg-primary-100 text-primary-700 text-[10px] uppercase tracking-widest px-2 py-1 rounded-md">Powered by ML</span>
          </h1>
          <p className="text-gray-500 font-medium">Forecasting your tax liabilities and cash flow needs.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="card bg-gradient-to-br from-primary-600 to-primary-800 text-white border-none shadow-xl shadow-primary-200 relative overflow-hidden">
          <Sparkles className="absolute top-[-20px] right-[-20px] text-white/10 w-40 h-40" />
          <div className="relative z-10">
            <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md">
              <BrainCircuit size={24} />
            </div>
            <h3 className="text-white/80 font-medium text-sm mb-1 uppercase tracking-wider">Next Month Predicted Liability</h3>
            <p className="text-4xl font-black mb-6">₹{prediction?.predicted_gst_amount?.toLocaleString() || '0'}</p>
            <div className="flex items-center gap-2 text-primary-100 text-sm font-bold bg-white/10 w-fit px-3 py-1.5 rounded-lg backdrop-blur-sm">
              <TrendingUp size={16} />
              <span>Confidence: {prediction?.confidence}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card">
          <h3 className="font-bold text-gray-900 mb-8">6-Month Liability Forecast</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="actual" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorActual)" strokeDasharray="0" />
                <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorPred)" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 bg-primary-500"></div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Actual Data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-0.5 border-t-2 border-dashed border-indigo-500"></div>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Forecast</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-amber-50 border-amber-100 flex items-start gap-4">
        <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
          <AlertCircle size={24} />
        </div>
        <div>
          <h4 className="font-bold text-amber-900 mb-1">Liquidity Recommendation</h4>
          <p className="text-amber-800 text-sm font-medium leading-relaxed">
            Based on the predicted liability, we recommend maintaining a tax reserve of approximately <span className="font-bold">₹{(prediction?.predicted_gst_amount * 1.2).toLocaleString()}</span> to ensure zero compliance friction during the next filing period.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PredictionModule;
