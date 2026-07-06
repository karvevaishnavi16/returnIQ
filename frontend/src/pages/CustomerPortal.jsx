import React, { useState, useEffect, useContext } from 'react';
import { ShoppingBag, ArrowRightLeft, LogOut, Loader2 } from 'lucide-react';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';
import OrderHistory from '../components/OrderHistory';
import ReturnHistory from '../components/ReturnHistory';
import ReturnFormModal from '../components/ReturnFormModal';
import ProductCatalog from '../components/ProductCatalog';
import AIChatWidget from '../components/AIChatWidget';

export default function CustomerPortal() {
  const { user, logout } = useContext(AuthContext);
  
  const firstName = user?.display_name ? user.display_name.split(' ')[0] : 'User';
  const initial = firstName.charAt(0).toUpperCase();
  
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'orders' | 'returns'
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, returnsRes] = await Promise.all([
        apiClient.get('/customer/orders'),
        apiClient.get('/customer/returns')
      ]);
      setOrders(ordersRes.data.orders);
      setReturns(returnsRes.data.returns);
    } catch (err) {
      console.error('Failed to fetch customer data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReturnSuccess = () => {
    setSelectedOrderForReturn(null);
    fetchData(); // Refresh data
    setActiveTab('returns'); // Switch to returns tab to see the new return!
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navbar */}
      <header className="bg-surface border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-1.5 rounded-lg shadow-sm">
              <ShoppingBag size={24} />
            </div>
            <span className="text-xl font-black text-text-main tracking-tight">EliteMart</span>
          </div>
          
          <nav className="hidden md:flex gap-8 text-sm font-semibold">
            <button 
              onClick={() => setActiveTab('catalog')} 
              className={`transition-colors ${activeTab === 'catalog' ? 'text-primary border-b-2 border-primary pb-1' : 'text-text-muted hover:text-text-main'}`}
            >
              Product Catalog
            </button>
            <button 
              onClick={() => setActiveTab('orders')} 
              className={`transition-colors ${activeTab === 'orders' ? 'text-primary border-b-2 border-primary pb-1' : 'text-text-muted hover:text-text-main'}`}
            >
              My Orders
            </button>
            <button 
              onClick={() => setActiveTab('returns')} 
              className={`transition-colors ${activeTab === 'returns' ? 'text-primary border-b-2 border-primary pb-1' : 'text-text-muted hover:text-text-main'}`}
            >
              My Returns
            </button>
          </nav>

          <div className="flex items-center gap-6">
            <button onClick={logout} className="text-text-muted hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Profile Header */}
        <div className="mb-8 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-black border-4 border-white shadow-sm">
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {firstName}!</h1>
            <p className="text-slate-500">Manage your orders and return requests.</p>
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {activeTab === 'catalog' && (
            <ProductCatalog />
          )}

          {activeTab === 'orders' && (
            <OrderHistory 
              orders={orders} 
              onReturnClick={(order) => setSelectedOrderForReturn(order)} 
            />
          )}
          
          {activeTab === 'returns' && (
            <ReturnHistory returns={returns} />
          )}
        </div>

      </main>

      {/* AI Chat Widget */}
      <AIChatWidget />

      {/* Return Modal */}
      {selectedOrderForReturn && (
        <ReturnFormModal 
          order={selectedOrderForReturn} 
          onClose={() => setSelectedOrderForReturn(null)} 
          onSubmitSuccess={handleReturnSuccess}
        />
      )}
    </div>
  );
}
