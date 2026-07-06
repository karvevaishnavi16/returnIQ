import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Info, Check, X, ArrowRightLeft } from 'lucide-react';
import apiClient from '../api/client';
import toast from 'react-hot-toast';

export default function ProductCatalog() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('All');
  const [sortBy, setSortBy] = useState('health_desc');
  
  // Comparison state
  const [compareQueue, setCompareQueue] = useState([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await apiClient.get('/customer/products');
        setProducts(res.data.products);
      } catch (err) {
        toast.error("Failed to load products.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredAndSortedProducts = products
    .filter(p => filterCategory === 'All' || p.category === filterCategory)
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'health_desc') return b.return_health_score - a.return_health_score;
      if (sortBy === 'health_asc') return a.return_health_score - b.return_health_score;
      return 0;
    });

  const handleToggleCompare = (product) => {
    if (compareQueue.find(p => p.id === product.id)) {
      setCompareQueue(compareQueue.filter(p => p.id !== product.id));
    } else {
      if (compareQueue.length >= 3) {
        toast.error("You can only compare up to 3 products.");
        return;
      }
      setCompareQueue([...compareQueue, product]);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-surface border border-slate-200 rounded-xl h-80 animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-main">Product Catalog</h2>
          <p className="text-text-muted">Browse our collection and view product reliability scores before you buy.</p>
        </div>
        
        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-slate-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="health_desc">Highest Health Score</option>
            <option value="health_asc">Lowest Health Score</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-24">
        {filteredAndSortedProducts.map(product => (
          <div key={product.id} className="bg-surface border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all group flex flex-col">
            <div className="h-48 overflow-hidden bg-slate-100 relative">
              <img 
                src={product.image_url || '/placeholder.png'} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-text-main shadow-sm">
                {product.category}
              </div>
            </div>
            
            <div className="p-5 flex flex-col flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-text-main leading-tight">{product.name}</h3>
                <span className="font-black text-lg text-text-main">₹{product.price}</span>
              </div>
              
              <div className="flex items-center gap-1 mb-4">
                <span className="text-yellow-500 font-bold text-sm">★ {product.avg_rating}</span>
                <span className="text-text-muted text-xs">({product.total_reviews} reviews)</span>
              </div>

              {/* Health Score Box */}
              <div className={`p-3 rounded-lg flex items-start gap-3 mb-4 ${
                product.return_health_score >= 80 ? 'bg-green-50 border border-green-100' :
                product.return_health_score >= 60 ? 'bg-yellow-50 border border-yellow-100' :
                'bg-red-50 border border-red-100'
              }`}>
                {product.return_health_score >= 80 ? (
                  <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <ShieldAlert className={`w-5 h-5 mt-0.5 ${product.return_health_score >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                )}
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Health Score: {product.return_health_score}/100
                  </p>
                  {product.top_return_reasons?.length > 0 && (
                    <p className="text-xs text-slate-600 mt-1">
                      Top issues: {product.top_return_reasons.join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer group/label relative">
                  <input 
                    type="checkbox" 
                    className="absolute opacity-0 w-0 h-0"
                    checked={!!compareQueue.find(p => p.id === product.id)}
                    onChange={() => handleToggleCompare(product)}
                  />
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    compareQueue.find(p => p.id === product.id) 
                      ? 'bg-primary border-primary text-white' 
                      : 'border-slate-300 group-hover/label:border-primary'
                  }`}>
                    {compareQueue.find(p => p.id === product.id) && <Check className="w-3 h-3" />}
                  </div>
                  <span className="text-sm font-medium text-slate-700 select-none">Compare</span>
                </label>
                <button 
                  onClick={() => setSelectedProduct(product)}
                  className="text-sm font-bold text-primary hover:text-primary-light transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Compare Bar */}
      {compareQueue.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-slate-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] p-4 z-40 transform transition-transform animate-in slide-in-from-bottom-full">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <span className="font-bold text-text-main">
                {compareQueue.length} product{compareQueue.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                {compareQueue.map(p => (
                  <div key={p.id} className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
                    <span className="truncate max-w-[150px] font-medium">{p.name}</span>
                    <button onClick={() => handleToggleCompare(p)} className="text-slate-400 hover:text-slate-800">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setCompareQueue([])}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Clear All
              </button>
              <button 
                disabled={compareQueue.length < 2}
                onClick={() => setShowCompareModal(true)}
                className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Compare Products
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-text-main flex items-center gap-2">
                <ArrowRightLeft className="w-6 h-6 text-primary" /> Product Comparison
              </h2>
              <button onClick={() => setShowCompareModal(false)} className="text-slate-400 hover:text-slate-800 p-2">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {compareQueue.map(product => (
                <div key={product.id} className="border border-slate-200 rounded-xl p-5 flex flex-col">
                  <img src={product.image_url || '/placeholder.png'} alt={product.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                  <h3 className="font-bold text-lg text-text-main mb-1">{product.name}</h3>
                  <p className="text-primary font-black mb-4">₹{product.price}</p>
                  
                  <div className="space-y-4 flex-1">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Health Score</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xl font-black ${
                          product.return_health_score >= 80 ? 'text-green-600' :
                          product.return_health_score >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {product.return_health_score}/100
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Top Issues</span>
                      {product.top_return_reasons?.length > 0 ? (
                        <ul className="list-disc pl-4 text-sm text-slate-700">
                          {product.top_return_reasons.map(reason => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-slate-500">No major issues reported.</span>
                      )}
                    </div>
                  </div>

                  {/* Alternative Suggestion if Score is Low */}
                  {product.return_health_score < 70 && (
                    <div className="mt-6 p-4 bg-accent-amber/50 rounded-lg border border-accent-amber border-opacity-50">
                      <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-amber-900 mb-1">Consider an Alternative</p>
                          <p className="text-xs text-amber-800 mb-2">This product has elevated return rates. We recommend looking at alternatives with higher reliability scores.</p>
                          
                          {/* Find best alternative in same category */}
                          {(() => {
                            const alt = products.filter(p => p.category === product.category && p.id !== product.id && p.return_health_score > product.return_health_score)
                                                .sort((a, b) => b.return_health_score - a.return_health_score)[0];
                            if (alt) {
                              return (
                                <button onClick={() => setSelectedProduct(alt)} className="text-xs font-bold bg-white text-amber-900 px-3 py-1.5 rounded shadow-sm hover:shadow-md transition-shadow mt-2">
                                  View {alt.name} ({alt.return_health_score}/100)
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  <button className="w-full mt-6 bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors">
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row gap-6">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 bg-white rounded-full p-1 shadow-sm">
              <X className="w-6 h-6" />
            </button>
            <div className="md:w-1/2">
              <img src={selectedProduct.image_url || '/placeholder.png'} alt={selectedProduct.name} className="w-full h-80 object-cover rounded-xl border border-slate-200" />
            </div>
            <div className="md:w-1/2 flex flex-col">
              <div className="mb-2">
                <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                  {selectedProduct.category}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-text-main mb-2">{selectedProduct.name}</h2>
              <p className="text-2xl font-black text-text-main mb-4">₹{selectedProduct.price}</p>
              
              <div className="flex items-center gap-2 mb-6">
                <span className="text-yellow-500 font-bold text-lg">★ {selectedProduct.avg_rating}</span>
                <span className="text-text-muted">({selectedProduct.total_reviews} verified reviews)</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-6">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" /> Return Intelligence
                </h3>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Health Score</span>
                  <span className={`font-bold ${
                    selectedProduct.return_health_score >= 80 ? 'text-green-600' :
                    selectedProduct.return_health_score >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>{selectedProduct.return_health_score}/100</span>
                </div>
                {selectedProduct.top_return_reasons?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <span className="text-sm text-slate-600 block mb-1">Most common return reasons:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.top_return_reasons.map(reason => (
                        <span key={reason} className="bg-white border border-slate-200 text-xs px-2 py-1 rounded shadow-sm text-slate-700">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button className="w-full mt-auto bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-dark transition-colors text-lg shadow-sm">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
