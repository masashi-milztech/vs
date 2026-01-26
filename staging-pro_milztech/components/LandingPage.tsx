
import React, { useRef } from 'react';
import { PLAN_DETAILS } from '../types';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const showcaseRef = useRef<HTMLDivElement>(null);

  const scrollToShowcase = () => {
    showcaseRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white selection:bg-slate-900 selection:text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[100svh] flex items-center justify-center overflow-hidden px-4 md:px-10 pt-10">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover scale-105 animate-pulse-slow" 
            alt="Luxury Interior" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-20"></div>
        </div>

        <div className="relative z-30 max-w-[1400px] mx-auto text-center w-full px-2">
          <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-slate-900 rounded-full mx-auto shadow-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[9px] md:text-[10px] font-black text-white uppercase tracking-[0.4em] md:tracking-[0.5em] whitespace-nowrap">
                Studio Cluster Online
              </span>
            </div>
            
            <div className="relative w-full max-w-[100vw]">
              {/* Responsive Font Size with clamp to prevent cutting off */}
              <h1 className="text-[12vw] sm:text-7xl md:text-9xl lg:text-[11rem] xl:text-[13rem] font-black text-slate-900 tracking-tighter uppercase leading-[0.85] md:leading-[0.8] jakarta whitespace-nowrap">
                Staging<span className="text-slate-300">Pro</span>
              </h1>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-8 px-4">
              <p className="text-lg md:text-2xl lg:text-3xl text-slate-500 font-medium leading-tight tracking-tight">
                Architectural Visualization for Elite Real Estate. <br className="hidden sm:block" />
                Experience 3-day rapid delivery.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                <button 
                  onClick={onStart}
                  className="w-full sm:w-auto px-12 md:px-16 py-5 md:py-7 bg-slate-900 text-white rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:bg-black hover:-translate-y-1 transition-all duration-300"
                >
                  Start Project
                </button>
                <button 
                  onClick={scrollToShowcase}
                  className="w-full sm:w-auto px-12 md:px-16 py-5 md:py-7 bg-white/80 backdrop-blur-sm border-2 border-slate-100 text-slate-900 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] hover:border-slate-900 transition-all duration-300"
                >
                  Explore Showcase
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
            <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Studio Quality</span>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter jakarta">Precision Driven</h3>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">Every pixel is calculated. We maintain architectural integrity while maximizing visual appeal.</p>
          </div>
          <div className="space-y-4 md:space-y-6">
            <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Elite Timeline</span>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter jakarta">3 Business Days</h3>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">Guaranteed delivery within 3 business days, excluding order date and weekends. No compromises.</p>
          </div>
          <div className="space-y-4 md:space-y-6">
            <span className="text-[9px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Direct Access</span>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter jakarta">Direct Revision</h3>
            <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">Communicate directly with your assigned visualizer to refine every shadow and texture.</p>
          </div>
        </div>
      </section>

      {/* NEW Showcase Section */}
      <section ref={showcaseRef} className="py-24 md:py-40 px-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20 md:mb-32">
          <div className="space-y-4">
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">The Archive</span>
            <h2 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase jakarta">Visual <br/> Standards.</h2>
          </div>
          <p className="max-w-md text-slate-400 font-medium leading-relaxed uppercase text-xs tracking-widest">
            A selection of recent studio deliveries. From empty shells to fully realized living environments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
          <div className="space-y-8 group">
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-slate-100 relative">
               <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Showcase" />
               <div className="absolute top-8 left-8 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase">Furniture Addition</div>
            </div>
            <div className="flex justify-between items-center px-4">
               <h4 className="text-xl font-black uppercase jakarta">Modern Loft</h4>
               <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">New York, NY</span>
            </div>
          </div>
          <div className="space-y-8 group md:translate-y-24">
            <div className="aspect-[4/5] rounded-[3rem] overflow-hidden bg-slate-100 relative">
               <img src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Showcase" />
               <div className="absolute top-8 left-8 bg-white/90 backdrop-blur px-4 py-2 rounded-full text-[9px] font-black tracking-widest uppercase">Removal & Staging</div>
            </div>
            <div className="flex justify-between items-center px-4">
               <h4 className="text-xl font-black uppercase jakarta">Lakeside Villa</h4>
               <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Tokyo, JP</span>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-24 md:py-48 px-6 max-w-[1400px] mx-auto space-y-20 md:space-y-32">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase jakarta">Production Plans</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.5em]">Select your strategy to begin transformation</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {Object.entries(PLAN_DETAILS).map(([key, plan]) => (
            <div key={key} className="group flex flex-col p-10 md:p-16 bg-white rounded-[4rem] border border-slate-100 hover:border-slate-900 transition-all duration-700 hover:shadow-2xl">
              <div className="text-5xl md:text-6xl mb-8 md:mb-12 grayscale group-hover:grayscale-0 transition-all duration-500">{plan.icon}</div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 uppercase tracking-tight jakarta">{plan.title}</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 min-h-[4rem]">{plan.description}</p>
              <div className="mt-auto flex items-end justify-between pt-8 border-t border-slate-50">
                <div className="flex flex-col">
                   <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Fee per image</span>
                   <span className="text-3xl md:text-4xl font-black text-slate-900 jakarta">{plan.price}</span>
                </div>
                <button onClick={onStart} className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Delivery Banner */}
      <section className="py-24 md:py-32 bg-slate-900 relative overflow-hidden px-6">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none flex items-center justify-center">
           <span className="text-[40vw] font-black text-white leading-none jakarta select-none">STUDIO</span>
        </div>
        <div className="max-w-[1400px] mx-auto relative z-10 text-center space-y-8 md:space-y-12">
           <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase jakarta italic">
             3 Business Days <br className="sm:hidden" /> Delivery.
           </h2>
           <p className="text-slate-400 text-[9px] md:text-xs font-black uppercase tracking-[0.5em]">
             *Excluding order date, Saturdays, and Sundays.
           </p>
           <button 
             onClick={onStart}
             className="px-12 md:px-20 py-5 md:py-8 bg-white text-slate-900 rounded-full text-[10px] md:text-[14px] font-black uppercase tracking-[0.4em] hover:scale-105 transition-all shadow-2xl"
           >
             Join the Circle
           </button>
        </div>
      </section>

      <footer className="py-16 md:py-24 border-t border-slate-100 text-center px-6 bg-white">
        <p className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.6em] mb-4">StagingPro International Studio</p>
        <p className="text-[8px] md:text-[9px] font-bold text-slate-200 uppercase tracking-widest leading-loose">Visualizing the future of real estate assets since 2025.</p>
      </footer>
    </div>
  );
};
