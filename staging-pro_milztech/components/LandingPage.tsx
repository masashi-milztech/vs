
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
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=2000" 
            className="w-full h-full object-cover scale-105 animate-pulse-slow" 
            alt="Luxury Interior" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-20"></div>
        </div>

        <div className="relative z-30 max-w-[1400px] mx-auto text-center w-full px-2">
          <div className="space-y-6 md:space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-slate-900 rounded-full mx-auto shadow-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[8px] md:text-[10px] font-black text-white uppercase tracking-[0.4em] md:tracking-[0.5em] whitespace-nowrap">
                Studio Cluster Online
              </span>
            </div>
            
            <div className="relative w-full">
              <h1 className="text-[14vw] sm:text-7xl md:text-9xl lg:text-[11rem] xl:text-[13rem] font-black text-slate-900 tracking-tighter uppercase leading-[0.8] jakarta px-2">
                Staging<span className="text-slate-200">Pro</span>
              </h1>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-6 md:space-y-10 px-4">
              <p className="text-sm md:text-2xl lg:text-3xl text-slate-500 font-medium leading-relaxed tracking-tight px-2">
                Architectural Visualization for Professionals. <br className="hidden md:block" />
                Studio-grade staging crafted with meticulous precision.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 md:pt-8">
                <button 
                  onClick={onStart}
                  className="w-full sm:w-auto px-10 md:px-16 py-5 md:py-7 bg-slate-900 text-white rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-black transition-all"
                >
                  Start Project
                </button>
                <button 
                  onClick={scrollToShowcase}
                  className="w-full sm:w-auto px-10 md:px-16 py-5 md:py-7 bg-white/80 backdrop-blur-sm border border-slate-100 text-slate-900 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.4em] hover:border-slate-900 transition-all"
                >
                  Explore Showcase
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid - Optimized Spacing */}
      <section className="py-20 md:py-40 bg-slate-50 px-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-16">
          {[
            { tag: 'Studio Quality', title: 'Precision Driven', desc: 'Every pixel is calculated. We maintain architectural integrity while maximizing visual appeal.' },
            { tag: 'Studio Standard', title: '3 Business Days', desc: 'Reliable delivery within 3 business days, excluding order date and weekends.' },
            { tag: 'Direct Access', title: 'Direct Revision', desc: 'Communicate directly with your visualizer to refine every shadow and texture.' }
          ].map((feature, i) => (
            <div key={i} className="space-y-4 md:space-y-6 text-center md:text-left">
              <span className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">{feature.tag}</span>
              <h3 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter jakarta">{feature.title}</h3>
              <p className="text-sm md:text-base text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* (Remaining LandingPage content stays logically the same, focusing on spacing) */}
      <section ref={showcaseRef} className="py-20 md:py-40 px-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10 mb-20">
          <div className="space-y-4 text-center md:text-left">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">The Archive</span>
            <h2 className="text-4xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase jakarta">Visual Standards.</h2>
          </div>
          <p className="max-w-md text-slate-400 font-medium leading-relaxed uppercase text-[9px] tracking-widest text-center md:text-right">
            A selection of recent studio deliveries. High-resolution spatial transformations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20">
           {/* Portfolio Items */}
           <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-100 relative group">
              <img src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Showcase" />
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[8px] font-black tracking-widest uppercase shadow-sm">Furniture Addition</div>
           </div>
           <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-slate-100 relative group md:translate-y-20">
              <img src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1000" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Showcase" />
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full text-[8px] font-black tracking-widest uppercase shadow-sm">Removal & Staging</div>
           </div>
        </div>
      </section>

      {/* Production Plans - Mobile Card Adjustments */}
      <section className="py-20 md:py-60 px-6 bg-white">
        <div className="max-w-[1400px] mx-auto space-y-20">
          <div className="text-center space-y-4">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.6em]">Professional Frameworks</span>
            <h2 className="text-4xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase jakarta">Production Plans</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-16">
            {Object.entries(PLAN_DETAILS).map(([key, plan]) => (
              <div key={key} className="group relative flex flex-col p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-slate-900 transition-all duration-500 overflow-hidden">
                <div className="absolute top-8 right-8 text-5xl md:text-8xl font-black text-slate-100 group-hover:text-slate-200 transition-colors pointer-events-none select-none">{plan.number}</div>
                <div className="relative space-y-10">
                  <div className="space-y-4">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight jakarta">{plan.title}</h3>
                    <p className="text-slate-400 text-xs font-medium leading-relaxed">{plan.description}</p>
                  </div>
                  <div className="flex flex-col gap-6 pt-6 border-t border-slate-100">
                    <div className="flex flex-col"><span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Fee per image</span><span className="text-3xl md:text-4xl font-black text-slate-900 jakarta">{plan.price}</span></div>
                    <button onClick={onStart} className="w-full py-5 rounded-2xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-[0.4em] shadow-xl">Initialize</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
