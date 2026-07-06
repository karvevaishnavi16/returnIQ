import React, { useState } from 'react';
import { Package, ArrowRightLeft, Clock, Search } from 'lucide-react';

export default function OrderHistory({ orders, onReturnClick }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredOrders = orders.filter(order => 
    order.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'shipped': return 'bg-blue-100 text-blue-700';
      case 'processing': return 'bg-amber-100 text-amber-700';
      case 'returned': return 'bg-slate-200 text-slate-600';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-lg font-bold text-slate-900">Your Recent Orders</h2>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search orders..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No orders found.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-6 items-start sm:items-center transition-all hover:shadow-md">
              
              {/* Product Image */}
              <div className="w-24 h-24 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-100 overflow-hidden">
                {order.image_url ? (
                  <img src={order.image_url} alt={order.product_name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-slate-300" />
                )}
              </div>

              {/* Order Info */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order #{order.id}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md uppercase ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{order.product_name}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Ordered on {new Date(order.order_date).toLocaleDateString()}
                </p>
              </div>

              {/* Price & Actions */}
              <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
                <div className="text-xl font-black text-slate-900">
                  ${parseFloat(order.price).toFixed(2)}
                </div>
                
                {/* Only allow returns on Delivered items that haven't already been returned */}
                {order.status === 'delivered' ? (
                  <button 
                    onClick={() => onReturnClick(order)}
                    className="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border border-indigo-200"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Return Item
                  </button>
                ) : (
                  <button disabled className="w-full sm:w-auto px-4 py-2 bg-slate-50 text-slate-400 font-medium rounded-lg flex items-center justify-center gap-2 cursor-not-allowed border border-slate-100">
                    <ArrowRightLeft className="w-4 h-4" />
                    Return Item
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
