import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, Bot, Search, Filter } from 'lucide-react';

export default function ReturnsTable({ returns, onRowClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', 'Electronics', 'Fashion/Clothing', 'Home & Kitchen', 'Accessories', 'Footwear'];

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = ret.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
    const matchesCategory = categoryFilter === 'All' || ret.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending</span>;
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3" /> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800"><XCircle className="w-3 h-3" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const getRiskScoreBadge = (score) => {
    if (score === null || score === undefined) return <span className="text-slate-400">-</span>;
    
    if (score <= 30) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-sm font-semibold bg-green-50 text-green-700 border border-green-200">{score}</span>;
    } else if (score <= 60) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-sm font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200">{score}</span>;
    } else {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-sm font-semibold bg-red-50 text-red-700 border border-red-200">{score}</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            AI Processed Returns
          </h3>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <Filter className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <span className="text-sm font-medium text-slate-500 mr-2">Category:</span>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors border ${
                categoryFilter === cat 
                  ? 'bg-primary border-primary text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Product</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reason</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">AI Risk Score</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">AI Rec</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-100">
            {filteredReturns.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                  No returns found matching your filters.
                </td>
              </tr>
            ) : (
              filteredReturns.map((ret) => (
                <tr 
                  key={ret.id} 
                  onClick={() => onRowClick(ret)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    #{ret.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-medium">
                    {ret.product_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {ret.return_reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRiskScoreBadge(ret.ai_risk_score)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {ret.ai_recommendation === 'approve' && <span className="text-emerald-600 font-medium">Approve</span>}
                    {ret.ai_recommendation === 'reject' && <span className="text-rose-600 font-medium">Reject</span>}
                    {ret.ai_recommendation === 'manual_review' && <span className="text-amber-600 font-medium">Manual</span>}
                    {!ret.ai_recommendation && <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(ret.status)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
