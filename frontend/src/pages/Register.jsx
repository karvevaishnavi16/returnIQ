import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PackageOpen, Lock, Mail, User, Shield, Loader2, AlertCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import apiClient from '../api/client';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // 1. Send registration data to Node.js
      const response = await apiClient.post('/auth/register', { 
        email, 
        password,
        display_name: name,
        role: 'customer'
      });
      
      // 2. Log them in immediately with the returned token
      login(response.data.user, response.data.accessToken, response.data.refreshToken);
      
      // 3. Redirect them to the correct dashboard
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background styling */}
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-primary-light/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-primary text-white p-2 rounded-xl shadow-lg">
            <PackageOpen size={28} />
          </div>
          <span className="text-3xl font-bold tracking-tight text-text-main">EliteMart</span>
        </Link>
        <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-text-main">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-text-muted">
          Or <Link to="/login" className="font-medium text-primary hover:text-primary-light transition-colors">sign in to your existing account</Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white/80 backdrop-blur-md py-8 px-4 shadow-xl border border-slate-100 sm:rounded-2xl sm:px-10">
          
          <form className="space-y-5" onSubmit={handleRegister}>
            
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-white"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-white"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 px-3 py-2 border border-slate-300 rounded-lg focus:ring-primary focus:border-primary sm:text-sm bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 transition-all"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
            </button>
            
          </form>
          
        </div>
      </div>
    </div>
  );
}
