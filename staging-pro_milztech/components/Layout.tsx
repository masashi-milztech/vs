
import React, { useState } from 'react';
import { User, PLAN_DETAILS } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

type FooterPage = 'Pricing' | 'Enterprise' | 'API' | 'Careers' | 'Showcase' | 'Process' | 'Privacy' | 'Terms' | 'Cookies' | null;

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [activePage, setActivePage] = useState<FooterPage>(null);

  const renderPageContent = () => {
    switch (activePage) {
      case 'Pricing':
        return (
          <div className="space-y-12 py-10">
            <h3 className="text-4xl font-black jakarta tracking-tighter uppercase">Transparent Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {Object.entries(PLAN_DETAILS).map(([key, plan]) => (
                <div key={key} className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <h4 className="text-lg font-black uppercase mb-2">{plan.title}</h4>
                  <p className="text-4xl font-black mb-4">{plan.price}</p>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{plan.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Process':
        return (
          <div className="space-y-12 py-10">
            <h3 className="text-4xl font-black jakarta tracking-tighter uppercase">Our Studio Process</h3>
            <div className="space-y-8">
              {[
                { step: '01', title: 'Asset Capture', desc: 'Upload high-resolution RAW or JPG images of your empty or furnished space.' },
                { step: '02', title: 'Spatial Design', desc: 'Our architectural visualizers remove clutter and place high-end digital furniture.' },
                { step: '03', title: 'Studio Delivery', desc: 'Receive your staged images within 24-48 hours in high-resolution format.' }
              ].map((item) => (
                <div key={item.step} className="flex gap-8 items-start">
                  <span className="text-5xl font-black text-slate-100">{item.step}</span>
                  <div>
                    <h4 className="text-xl font-black uppercase mb-1">{item.title}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Privacy':
      case 'Terms':
      case 'Cookies':
        return (
          <div className="space-y-8 py-10">
            <h3 className="text-4xl font-black jakarta tracking-tighter uppercase">{activePage} Policy</h3>
            <div className="prose prose-slate max-w-none text-slate-500 font-medium leading-loose">
              <p>StagingPro International values your professional data. This policy outlines how we handle spatial assets and architectural visualizations within our secure studio environment.</p>
              <p>All uploaded images are processed on secure, encrypted servers. We do not use client images for promotional purposes without explicit written consent.</p>
              <p>For enterprise-grade security inquiries, please contact our compliance officer.</p>
            </div>
          </div>
        );
      default:
        return (
          <div className="py-20 text-center space-y-6">
            <h3 className="text-3xl font-black uppercase tracking-tighter">{activePage} Studio</h3>
            <p className="text-slate-400 font-medium uppercase tracking-[0.2em]">Section currently in production.</p>
            <button onClick={() => setActivePage(null)} className="px-10 py-4 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Back to Studio</button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Footer Modal */}
      {activePage && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative p-12 md:p-20">
            <button 
              onClick={() => setActivePage(null)}
              className="absolute top-10 right-10 w-12 h-12 flex items-center justify-center rounded-full border border-slate-100 hover:bg-slate-900 hover:text-white transition-all z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            {renderPageContent()}
          </div>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 z-[60] glass-nav">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-10">
            <span className="serif text-3xl font-extrabold tracking-tighter text-slate-900 uppercase cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>StagingPro</span>
            <div className="hidden lg:flex h-5 w-px bg-slate-200"></div>
            <div className="hidden lg:flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Production Studio Active</span>
            </div>
          </div>
          
          <nav className="flex items-center gap-10">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] leading-none mb-1.5">Authenticated</span>
              <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-widest">{user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="px-8 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full hover:bg-black transition-all shadow-lg"
            >
              Log Out
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow pt-20">
        {children}
      </main>

      <footer className="py-24 border-t border-slate-200 mt-20 bg-white">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-20">
          <div className="space-y-8 max-w-sm">
            <span className="serif text-3xl font-extrabold text-slate-900 uppercase">StagingPro</span>
            <p className="text-[12px] font-medium text-slate-400 uppercase tracking-widest leading-loose">
              Visualizing the future of architectural spaces. <br/>
              The standard in luxury virtual staging and spatial AI.
            </p>
            <div className="flex flex-col gap-6">
              <div className="flex gap-6">
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 cursor-pointer transition-colors">
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </div>
                <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center hover:bg-slate-50 cursor-pointer transition-colors">
                  <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </div>
              </div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-40">Powered by milz.tech</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16 md:gap-24">
            <div className="space-y-8">
              <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">Platform</h5>
              <div className="flex flex-col gap-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                <button onClick={() => setActivePage('Pricing')} className="text-left hover:text-slate-900 transition-colors">Pricing</button>
                <button onClick={() => setActivePage('Enterprise')} className="text-left hover:text-slate-900 transition-colors">Enterprise</button>
                <button onClick={() => setActivePage('API')} className="text-left hover:text-slate-900 transition-colors">API Docs</button>
              </div>
            </div>
            <div className="space-y-8">
              <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">Studio</h5>
              <div className="flex flex-col gap-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                <button onClick={() => setActivePage('Careers')} className="text-left hover:text-slate-900 transition-colors">Careers</button>
                <button onClick={() => setActivePage('Showcase')} className="text-left hover:text-slate-900 transition-colors">Showcase</button>
                <button onClick={() => setActivePage('Process')} className="text-left hover:text-slate-900 transition-colors">Process</button>
              </div>
            </div>
            <div className="space-y-8">
              <h5 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900">Legal</h5>
              <div className="flex flex-col gap-6 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                <button onClick={() => setActivePage('Privacy')} className="text-left hover:text-slate-900 transition-colors">Privacy</button>
                <button onClick={() => setActivePage('Terms')} className="text-left hover:text-slate-900 transition-colors">Terms</button>
                <button onClick={() => setActivePage('Cookies')} className="text-left hover:text-slate-900 transition-colors">Cookies</button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto px-6 pt-16 mt-16 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
            &copy; {new Date().getFullYear()} StagingPro International Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
             <div className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
             </div>
             <span className="text-[9px] font-black text-slate-200 uppercase tracking-widest">v2.5.0-Luxe</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
