import React from 'react';
import { PackageOpen, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function ReturnHistory({ returns }) {
  
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending':
        return (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-semibold text-sm">
            <Clock className="w-4 h-4" /> Under Review
          </div>
        );
      case 'approved':
        return (
          <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold text-sm">
            <CheckCircle className="w-4 h-4" /> Approved
          </div>
        );
      case 'rejected':
        return (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 font-semibold text-sm">
            <XCircle className="w-4 h-4" /> Rejected
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-sm capitalize">
            {status}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">Your Returns</h2>
        <p className="text-slate-500 text-sm mt-1">Track the status of your AI-processed return requests.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {returns.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <PackageOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">You haven't made any returns yet.</p>
          </div>
        ) : (
          returns.map((ret) => (
            <div key={ret.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              
              {/* Product Image */}
              <div className="w-20 h-20 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-100 overflow-hidden">
                {ret.product_image ? (
                  <img src={ret.product_image} alt={ret.product_name} className="w-full h-full object-cover" />
                ) : (
                  <PackageOpen className="w-6 h-6 text-slate-300" />
                )}
              </div>

              {/* Return Info */}
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Return #{ret.id}</span>
                  <span className="text-xs font-medium text-slate-400">•</span>
                  <span className="text-xs font-medium text-slate-400">{new Date(ret.return_date).toLocaleDateString()}</span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{ret.product_name}</h3>
                <p className="text-sm font-medium text-slate-600 bg-slate-100 inline-block px-2 py-1 rounded-md">
                  Reason: {ret.return_reason}
                </p>
                {ret.detailed_notes && (
                  <p className="text-sm text-slate-500 italic mt-2">"{ret.detailed_notes}"</p>
                )}
              </div>

              {/* Status */}
              <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                {getStatusDisplay(ret.status)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
