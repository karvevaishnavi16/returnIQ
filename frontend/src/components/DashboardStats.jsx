import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle, PackageOpen } from 'lucide-react';

export default function DashboardStats({ stats }) {
  if (!stats) return null;

  const data = stats.trends || [];
  const overview = stats.overview || {};

  const total = overview.total_returns || 0;
  const approved = overview.approved_count || 0;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const rejectedCount = overview.rejected_count || 0;
  const highRiskCount = overview.high_risk_count || 0;

  return (
    <div className="space-y-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Returns */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <PackageOpen size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Returns</p>
            <p className="text-2xl font-bold text-slate-900">{total}</p>
          </div>
        </div>

        {/* Approval Rate */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Approval Rate</p>
            <p className="text-2xl font-bold text-slate-900">{approvalRate}%</p>
          </div>
        </div>

        {/* AI Intervention */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">High Risk Returns</p>
            <p className="text-2xl font-bold text-slate-900">{highRiskCount}</p>
          </div>
        </div>
        
        {/* Estimated Savings */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Saved via Rejections</p>
            <p className="text-2xl font-bold text-slate-900">${(rejectedCount * 45).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-text-main">Return Volume Trends</h3>
          <select className="bg-background border border-slate-200 text-sm font-medium text-text-main rounded-lg px-3 py-1.5 focus:ring-primary focus:border-primary">
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
          </select>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <defs>
                <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#342921" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#342921" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#8A7D73', fontWeight: 500 }} 
                dy={10} 
                label={{ value: 'Date', position: 'insideBottom', offset: -10, fill: '#8A7D73', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#8A7D73', fontWeight: 500 }} 
                label={{ value: 'Volume', angle: -90, position: 'insideLeft', fill: '#8A7D73', fontSize: 12, fontWeight: 600 }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', backgroundColor: '#FFFFFF' }}
                itemStyle={{ color: '#2C2520', fontWeight: 'bold' }}
                labelStyle={{ color: '#8A7D73', marginBottom: '8px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: 500, color: '#2C2520' }} />
              <Area name="Return Requests" type="monotone" dataKey="total_returns" stroke="#342921" strokeWidth={3} fillOpacity={1} fill="url(#colorReturns)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
