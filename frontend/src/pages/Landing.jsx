import React from 'react';
import { Link } from 'react-router-dom';
import { PackageOpen, ArrowRight, ShieldCheck, Zap, Brain } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
      
      {/* Decorative Background Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

      {/* Navigation Bar */}
      <nav className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/30">
            <PackageOpen size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">EliteMart</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            Sign In
          </Link>
          <Link to="/register" className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-md transition-all hover:shadow-lg">
            Create Account
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-grow flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-primary font-medium text-sm">
            <SparklesIcon className="w-4 h-4" />
            Introducing ReturnIQ
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
            AI-powered <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">return intelligence</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Experience frictionless returns. Our AI instantly evaluates requests, 
            detects product defects, and prevents policy abuse so you can shop with confidence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-lg shadow-primary/30 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2">
              Access Portal <ArrowRight size={18} />
            </Link>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 border-t border-slate-200/60 mt-16 text-left">
            <FeatureCard 
              icon={<Zap className="w-6 h-6 text-amber-500" />}
              title="Instant Decisions"
              desc="No more waiting days for approval. Our AI agent evaluates requests in milliseconds."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-emerald-500" />}
              title="Fraud Protection"
              desc="Pattern recognition stops serial returners while approving honest mistakes."
            />
            <FeatureCard 
              icon={<Brain className="w-6 h-6 text-purple-500" />}
              title="Smart Insights"
              desc="Automatically detect recurring product defects from customer feedback."
            />
          </div>

        </div>
      </main>
    </div>
  );
}

function SparklesIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/60 shadow-sm">
      <div className="bg-slate-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-slate-100">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
