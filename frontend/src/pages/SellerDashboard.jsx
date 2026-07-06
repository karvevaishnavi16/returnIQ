import React, { useState, useEffect, useContext } from 'react';
import { PackageOpen, Loader2, LogOut } from 'lucide-react';
import apiClient from '../api/client';
import { AuthContext } from '../context/AuthContext';
import DashboardStats from '../components/DashboardStats';
import ReturnsTable from '../components/ReturnsTable';
import AIReturnModal from '../components/AIReturnModal';
import SellerAnalytics from '../components/SellerAnalytics';

export default function SellerDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'returns' | 'analytics'
  const [stats, setStats] = useState(null);
  const [returns, setReturns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [overviewRes, trendsRes, returnsRes] = await Promise.all([
        apiClient.get('/seller/analytics/overview'),
        apiClient.get('/seller/analytics/trends'),
        apiClient.get('/seller/returns')
      ]);
      setStats({
        overview: overviewRes.data.overview,
        trends: trendsRes.data.trends
      });
      setReturns(returnsRes.data.returns);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRowClick = (returnItem) => {
    setSelectedReturn(returnItem);
  };

  const closeModal = () => {
    setSelectedReturn(null);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-1.5 rounded-lg shadow-sm">
              <PackageOpen size={24} />
            </div>
            <span className="text-xl font-bold text-text-main tracking-tight">ReturnIQ</span>
            <span className="ml-2 px-2 py-0.5 rounded-md bg-accent-green text-green-900 text-xs font-bold uppercase tracking-wider">Seller Portal</span>
          </div>

          <nav className="hidden md:flex gap-8 text-sm font-semibold">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`transition-colors ${activeTab === 'dashboard' ? 'text-primary border-b-2 border-primary pb-1' : 'text-text-muted hover:text-text-main'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('returns')} 
              className={`transition-colors ${activeTab === 'returns' ? 'text-primary border-b-2 border-primary pb-1' : 'text-text-muted hover:text-text-main'}`}
            >
              Returns Management
            </button>
            <button 
              onClick={() => setActiveTab('analytics')} 
              className={`transition-colors ${activeTab === 'analytics' ? 'text-primary border-b-2 border-primary pb-1' : 'text-text-muted hover:text-text-main'}`}
            >
              Analytics
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-muted">{user?.display_name || 'Store Owner'}</span>
            <div className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600">
              {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'O'}
            </div>
            <div className="h-6 w-px bg-slate-200"></div>
            <button onClick={logout} className="text-text-muted hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium">
              <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in duration-300 space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-text-main">Dashboard Overview</h1>
              <p className="text-text-muted mt-1">Monitor AI-driven return intelligence and business health.</p>
            </div>
            <DashboardStats stats={stats} />
          </div>
        )}

        {activeTab === 'returns' && (
          <div className="animate-in fade-in duration-300 space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-text-main">Returns Management</h1>
              <p className="text-text-muted mt-1">Process and review AI-flagged return requests.</p>
            </div>
            <ReturnsTable returns={returns} onRowClick={handleRowClick} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-300 space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-text-main">Deep Analytics</h1>
              <p className="text-text-muted mt-1">Advanced insights into return costs, risks, and trends.</p>
            </div>
            <SellerAnalytics />
          </div>
        )}

      </main>

      {/* AI Modal */}
      {selectedReturn && (
        <AIReturnModal 
          returnItem={selectedReturn} 
          onClose={closeModal} 
          onUpdate={fetchData} 
        />
      )}
    </div>
  );
}
