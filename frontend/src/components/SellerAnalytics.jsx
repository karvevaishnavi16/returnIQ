import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { AlertTriangle, TrendingUp, AlertOctagon } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const COLORS = ['#342921', '#8A7D73', '#D6CFC7', '#E5E7EB', '#A39180', '#5C4E43'];

export default function SellerAnalytics() {
  const [loading, setLoading] = useState(true);
  const [trendsData, setTrendsData] = useState([]);
  const [reasonsData, setReasonsData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [highRiskReturns, setHighRiskReturns] = useState([]);
  
  const [daysFilter, setDaysFilter] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [trendsRes, reasonsRes, productsRes, returnsRes] = await Promise.all([
          apiClient.get('/seller/analytics/trends'),
          apiClient.get('/seller/analytics/reasons'),
          apiClient.get('/seller/analytics/products'),
          apiClient.get('/seller/returns') // We filter this on frontend for high-risk
        ]);

        // Process Trends
        let trends = trendsRes.data.trends || [];
        // Filter by days
        const cutoffDate = dayjs().subtract(daysFilter, 'day');
        trends = trends.filter(t => dayjs(t.date).isAfter(cutoffDate));
        
        // Format dates for the chart X-axis
        trends = trends.map(t => ({
          ...t,
          formattedDate: dayjs(t.date).format('MMM D')
        }));
        setTrendsData(trends);

        // Process Reasons (Pie chart expects name/value)
        const reasons = reasonsRes.data.reasons || [];
        setReasonsData(reasons.map(r => ({
          name: r.return_reason,
          value: parseInt(r.count)
        })));

        // Process Category (Bar chart)
        const byCategory = reasonsRes.data.byCategory || [];
        // Aggregate byCategory into { category: string, total_returns: number }
        const catMap = {};
        byCategory.forEach(item => {
          if (!catMap[item.category]) catMap[item.category] = 0;
          catMap[item.category] += parseInt(item.count);
        });
        const catArray = Object.keys(catMap).map(cat => ({
          category: cat,
          total_returns: catMap[cat]
        })).sort((a, b) => b.total_returns - a.total_returns);
        setCategoryData(catArray);

        // Process Products (Bar chart - top 10 returned products)
        const products = productsRes.data.products || [];
        const sortedProducts = [...products].sort((a, b) => b.total_returns - a.total_returns).slice(0, 10);
        setProductsData(sortedProducts);

        // Process High Risk Returns
        const allReturns = returnsRes.data.returns || [];
        const highRisk = allReturns.filter(r => r.ai_risk_score >= 70 && r.status === 'pending');
        setHighRiskReturns(highRisk);

      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        toast.error("Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [daysFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Business Action Summary Logic
  const topCategory = categoryData[0];
  const topProduct = productsData[0];

  return (
    <div className="space-y-6">
      
      {/* 5. BUSINESS ACTION SUMMARY */}
      <div className="bg-white border-l-4 border-amber-500 shadow-sm rounded-r-xl p-6 flex items-start gap-4">
        <AlertTriangle className="text-amber-500 w-8 h-8 shrink-0 mt-1" />
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Business Action Summary</h3>
          <p className="text-slate-700">
            {topCategory && topCategory.total_returns > 0 ? (
              <>
                <span className="font-bold text-slate-900">{topCategory.category}</span> is showing elevated returns ({topCategory.total_returns} returns). 
              </>
            ) : (
              "No category anomalies detected. "
            )}
            {topProduct && topProduct.total_returns > 0 ? (
              <>
                {" "}The most returned specific product is the <span className="font-bold text-slate-900">{topProduct.name}</span> with {topProduct.total_returns} returns and a health score of {topProduct.return_health_score}/100.
              </>
            ) : (
              ""
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. RETURN TRENDS CHART */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Return Volume Trends</h3>
            <select 
              value={daysFilter}
              onChange={(e) => setDaysFilter(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-700 rounded-lg px-3 py-1.5 focus:ring-primary focus:border-primary"
            >
              <option value={30}>Last 30 Days</option>
              <option value={60}>Last 60 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendsData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="formattedDate" 
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
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#FFFFFF' }}
                  itemStyle={{ color: '#2C2520', fontWeight: 'bold' }}
                  labelStyle={{ color: '#8A7D73', marginBottom: '8px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '14px', fontWeight: 500, color: '#2C2520' }} />
                <Line name="Total Returns" type="monotone" dataKey="total_returns" stroke="#342921" strokeWidth={3} dot={{ r: 4, fill: '#342921' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. RETURN REASON DISTRIBUTION */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Return Reason Distribution</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reasonsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {reasonsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. RETURNS BY CATEGORY */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Returns by Category</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A7D73' }} allowDecimals={false} />
                <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#8A7D73', fontWeight: 600 }} width={100} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar name="Total Returns" dataKey="total_returns" fill="#342921" radius={[0, 4, 4, 0]} barSize={32}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. TOP RETURNED PRODUCTS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Top Returned Products</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productsData}
                margin={{ top: 10, right: 10, left: -20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#8A7D73' }} 
                  angle={-45} 
                  textAnchor="end"
                  interval={0}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#8A7D73' }} 
                  allowDecimals={false}
                />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar name="Total Returns" dataKey="total_returns" fill="#8A7D73" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6. HIGH-RISK REQUESTS LIST */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-red-600" /> Pending High-Risk Requests
          </h3>
        </div>
        
        {highRiskReturns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-y border-slate-200">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order ID</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold text-right">Risk Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {highRiskReturns.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">#{r.order_id}</td>
                    <td className="px-4 py-3 text-slate-700">{r.product_name}</td>
                    <td className="px-4 py-3 text-slate-700">{r.customer_name}</td>
                    <td className="px-4 py-3 text-slate-700">{r.return_reason}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                        {r.ai_risk_score}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500 font-medium">No pending high-risk return requests found.</p>
          </div>
        )}
      </div>

    </div>
  );
}
