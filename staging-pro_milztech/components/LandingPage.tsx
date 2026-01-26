
import React from 'react';
import { PLAN_DETAILS } from '../types';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="bg-white selection:bg-slate-900 selection:text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden px-6 pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover scale-105 animate-pulse-slow" 
            alt="Luxury Interior" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-20"></div>
        </div>

        <div className="relative z-30 max-w-[1400px] mx-auto text-center w-full">
          <div className="space-y-6 md:space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="inline-flex items-center gap-3 px-4 md:px-6 py-2 bg-slate-900 rounded-full mx-auto">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-[0.4em] md:tracking-[0.5em] whitespace-nowrap">
                Studio Cluster Online
              </span>
            </div>
            
            <div className="relative inline-block w-full">
              <h1 className="text-5xl sm:text-7xl md:text-9xl lg:text-[11rem] xl:text-[13rem] font-black text-slate-900 tracking-tighter uppercase leading-[0.85] md:leading-[0.8] jakarta break-words">
                Staging<span className="text-slate-300">Pro</span>
              </h1>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-8 md:space-y-10 px-4">
              <p className="text-base sm:text-xl md:text-2xl lg:text-3xl text-slate-500 font-medium leading-tight tracking-tight">
                Elite Virtual Staging for Luxury Real Estate. <br className="hidden sm:block" />
                Transforming space into digital excellence.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 pt-6 md:pt-10">
                <button 
                  onClick={onStart}
                  className="w-full sm:w-auto px-10 md:px-16 py-5 md:py-7 bg-slate-900 text-white rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:bg-black hover:-translate-y-1 transition-all duration-300"
                >
                  Start Project
                </button>
                <button 
                  onClick={onStart}
                  className="w-full sm:w-auto px-10 md:px-16 py-5 md:py-7 bg-white/80 backdrop-blur-sm border-2 border-slate-100 text-slate-900 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] hover:border-slate-900 transition-all duration-300"
                >
                  View Archive
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 md:py-40 bg-slate-50 px-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          <div className="space-y-4 md:space-y-6">
            <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">High Precision</span>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter jakarta">Architectural Integrity</h3>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">Our visualizers respect structural proportions, ensuring every render looks indistinguishable from reality.</p>
          </div>
          <div className="space-y-4 md:space-y-6">
            <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Speed Optimized</span>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter jakarta">3 Business Days</h3>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">Studio delivery within 3 business days (excluding order date & weekends). Precision staging on your schedule.</p>
          </div>
          <div className="space-y-4 md:space-y-6">
            <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Full Control</span>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter jakarta">Unlimited Revisions</h3>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">Direct communication with your assigned editor. Refine styles and layouts until the vision is perfect.</p>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-24 md:py-40 px-6 max-w-[1400px] mx-auto space-y-20 md:space-y-32">
        <div className="text-center space-y-4 md:space-y-6">
          <h2 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase jakarta">Tailored Solutions</h2>
          <p className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.5em]">Select your strategy to begin transformation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
          {Object.entries(PLAN_DETAILS).map(([key, plan]) => (
            <div key={key} className="group flex flex-col p-10 md:p-16 bg-white rounded-[3rem] md:rounded-[4rem] border border-slate-100 hover:border-slate-900 transition-all duration-700 hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)]">
              <div className="text-5xl md:text-6xl mb-8 md:mb-12 grayscale group-hover:grayscale-0 transition-all duration-500">{plan.icon}</div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 md:mb-6 uppercase tracking-tight jakarta">{plan.title}</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 md:mb-16 min-h-[3rem] md:min-h-[5rem]">{plan.description}</p>
              <div className="mt-auto flex items-end justify-between pt-8 md:pt-12 border-t border-slate-50">
                <div className="flex flex-col">
                   <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Starting from</span>
                   <span className="text-3xl md:text-4xl font-black text-slate-900 jakarta">{plan.price}</span>
                </div>
                <button onClick={onStart} className="w-10 h-10 md:w-12 md:h-12 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Delivery Banner */}
      <section className="py-24 md:py-32 bg-slate-900 relative overflow-hidden px-6">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center overflow-hidden">
           <span className="text-[40vw] font-black text-white leading-none jakarta select-none">DELIVERY</span>
        </div>
        <div className="max-w-[1400px] mx-auto relative z-10 text-center space-y-8 md:space-y-12">
           <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter uppercase jakarta italic">
             3 Business Days <br className="sm:hidden" /> Guaranteed.
           </h2>
           <p className="text-slate-400 text-[9px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.5em]">
             *Excluding order date, Saturdays, and Sundays.
           </p>
           <button 
             onClick={onStart}
             className="px-10 md:px-16 py-5 md:py-6 bg-white text-slate-900 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] hover:scale-105 transition-all shadow-2xl"
           >
             Join the Studio
           </button>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 md:py-40 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-24">
          {[
            { n: '01', t: 'Upload', d: 'Securely upload your RAW or high-res spatial assets to our studio cluster.' },
            { n: '02', t: 'Compose', d: 'Our visualizers remove clutter and place digital furniture with architectural precision.' },
            { n: '03', t: 'Execute', d: 'Receive production-ready renders in 3 business days via your private dashboard.' }
          ].map((s) => (
            <div key={s.n} className="space-y-6 md:space-y-8 relative">
              <div className="text-6xl md:text-8xl font-black text-slate-50 jakarta absolute -top-8 md:-top-12 -left-2 md:-left-4 -z-10 select-none">{s.n}</div>
              <h4 className="text-xl md:text-2xl font-black uppercase text-slate-900 tracking-tight pt-2 md:pt-4">{s.t}</h4>
              <p className="text-xs md:text-sm font-medium text-slate-500 leading-loose">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-16 md:py-20 border-t border-slate-100 text-center px-6">
        <p className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-4">StagingPro International Studio</p>
        <p className="text-[8px] md:text-[9px] font-bold text-slate-200 uppercase tracking-widest leading-loose max-w-xs md:max-w-none mx-auto">Visualizing the future of real estate assets since 2025.</p>
      </footer>
    </div>
  );
};
