import React, { useState } from 'react';
import { X, CheckCircle, XCircle, BrainCircuit, Bot, AlertTriangle, MessageSquare, Save } from 'lucide-react';
import apiClient from '../api/client';

export default function AIReturnModal({ returnItem, onClose, onUpdate }) {
  if (!returnItem) return null;

  const [isUpdating, setIsUpdating] = useState(false);

  const handleOverride = async (newStatus) => {
    setIsUpdating(true);
    try {
      await apiClient.put(`/seller/returns/${returnItem.id}/status`, {
        status: newStatus
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRiskColor = (score) => {
    if (!score) return 'bg-slate-100 text-slate-800';
    if (score <= 30) return 'bg-green-100 text-green-800 border-green-200';
    if (score <= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">ReturnIQ Evaluation</h2>
              <p className="text-sm text-slate-500">Return #{returnItem.id} • Order #{returnItem.order_id}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Top Cards: Risk & Insight */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Risk Score Card */}
            <div className="border border-slate-100 rounded-xl p-5 bg-white shadow-sm flex items-start gap-4">
              <div className={`text-3xl font-black px-4 py-2 rounded-xl border ${getRiskColor(returnItem.ai_risk_score)}`}>
                {returnItem.ai_risk_score || '--'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 flex items-center gap-1">
                  AI Risk Score
                </h4>
                <p className="text-sm text-slate-500 mt-1">
                  Calculated based on customer history, product health, and stated reasons.
                </p>
                <div className="mt-2 text-sm font-semibold flex items-center gap-1.5 text-slate-700">
                  Recommendation: 
                  {returnItem.ai_recommendation === 'approve' && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4"/> Approve</span>}
                  {returnItem.ai_recommendation === 'reject' && <span className="text-rose-600 flex items-center gap-1"><XCircle className="w-4 h-4"/> Reject</span>}
                  {returnItem.ai_recommendation === 'manual_review' && <span className="text-amber-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4"/> Manual Review</span>}
                </div>
              </div>
            </div>

            {/* Insight Card */}
            <div className="border border-indigo-100 rounded-xl p-5 bg-indigo-50/30 shadow-sm">
              <h4 className="font-bold text-indigo-900 flex items-center gap-2 mb-2">
                <Bot className="w-5 h-5 text-indigo-500" />
                ReturnIQ Insight
              </h4>
              <p className="text-sm text-indigo-800 font-medium leading-relaxed">
                "{returnItem.ai_insight || 'No insight generated.'}"
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <span>Confidence Level:</span>
                <div className="flex-1 h-2 bg-indigo-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full" 
                    style={{ width: `${(returnItem.ai_confidence || 0) * 100}%` }}
                  ></div>
                </div>
                <span>{Math.round((returnItem.ai_confidence || 0) * 100)}%</span>
              </div>
            </div>

          </div>

          {/* AI Root Cause Explanation */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Detailed Agent Explanation</h4>
            </div>
            <div className="p-4 bg-white text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {returnItem.ai_explanation || 'No detailed explanation generated.'}
            </div>
          </div>

          {/* Customer Details Summary */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block mb-1">Customer Stated Reason</span>
              <span className="font-semibold text-slate-900">{returnItem.return_reason}</span>
              <p className="mt-2 text-slate-600 italic">"{returnItem.detailed_notes || 'No extra notes'}"</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block mb-1">Product Info</span>
              <span className="font-semibold text-slate-900 block">{returnItem.product_name}</span>
              <span className="text-slate-500 block mt-1">Status: <strong className="uppercase">{returnItem.status}</strong></span>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          {returnItem.status === 'pending' ? (
            <>
              <button
                disabled={isUpdating}
                onClick={() => handleOverride('rejected')}
                className="px-4 py-2.5 rounded-lg font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 transition-colors flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject Return
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleOverride('approved')}
                className="px-4 py-2.5 rounded-lg font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Approve Return
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors"
            >
              Close
            </button>
          )}
        </div>
        
      </div>
    </div>
  );
}
