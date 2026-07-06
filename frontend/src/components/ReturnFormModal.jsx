import React, { useState } from 'react';
import { X, ArrowRightLeft, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '../api/client';

export default function ReturnFormModal({ order, onClose, onSubmitSuccess }) {
  const [reason, setReason] = useState('Defective or Damaged');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post('/customer/returns', {
        order_id: order.id,
        return_reason: reason,
        detailed_notes: notes
      });
      onSubmitSuccess();
    } catch (err) {
      console.error('Submit return error:', err);
      setError(err.response?.data?.error || 'Failed to submit return request.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Return Item</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Summary */}
        <div className="p-6 border-b border-slate-100 bg-white flex gap-4 items-center">
          <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
             {order.image_url && <img src={order.image_url} alt={order.product_name} className="w-full h-full object-cover" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{order.product_name}</h3>
            <p className="text-sm text-slate-500">Order #{order.id}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white">
          
          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Why are you returning this?</label>
            <select 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border-slate-200 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 py-2.5 px-3"
              disabled={isSubmitting}
            >
              <option value="Defective or Damaged">Defective or Damaged</option>
              <option value="Wrong Item Received">Wrong Item Received</option>
              <option value="Item does not match description">Item does not match description</option>
              <option value="No longer needed / Changed mind">No longer needed / Changed mind</option>
              <option value="Better price available">Better price available</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">Additional Details (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Please provide any extra details that might help us process your return faster..."
              className="w-full border-slate-200 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 py-3 px-3 h-28 resize-none"
              disabled={isSubmitting}
            ></textarea>
            <p className="text-xs text-slate-400">Our AI assistant will use this context to quickly evaluate your request.</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</>
              ) : (
                'Submit Return'
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
