
import React, { useState, useRef, useEffect } from 'react';
import { Submission, PLAN_DETAILS } from '../types';

interface DetailModalProps {
  submission: Submission;
  onClose: () => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ submission, onClose }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleDownload = (url: string, prefix: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prefix}_${submission.fileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(Math.max(position, 0), 100));
  };

  const handleStart = () => { isDragging.current = true; };
  const handleEnd = () => { isDragging.current = false; };

  useEffect(() => {
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-12 bg-black/95 animate-in fade-in duration-500 overflow-hidden">
      <div className="bg-white w-full h-full md:rounded-[2rem] overflow-hidden flex flex-col relative">
        
        <div className="px-10 py-8 border-b border-neutral-100 flex justify-between items-center bg-white sticky top-0 z-20">
          <div className="flex items-center gap-8">
            <h2 className="serif text-3xl font-bold text-black lowercase">{PLAN_DETAILS[submission.plan].title}</h2>
            <div className="px-4 py-1.5 bg-neutral-50 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-neutral-300">
              Project Archive {submission.id}
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center rounded-full border border-neutral-100 hover:bg-black hover:text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-16 hide-scrollbar">
          <div className="max-w-5xl mx-auto space-y-32">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 p-10 bg-neutral-50 rounded-[2rem]">
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300">Timestamp</span>
                <p className="text-xs font-bold text-black">{new Date(submission.timestamp).toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300">Current Phase</span>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-black flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${submission.status === 'completed' ? 'bg-black' : 'bg-neutral-200 animate-pulse'}`}></span>
                  {submission.status}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-300">Design Guidance</span>
                <div className="space-y-4">
                  <p className="text-xs font-medium text-neutral-500 italic leading-relaxed">
                    {submission.instructions || "No specific instructions provided."}
                  </p>
                  {submission.revisionNotes && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-2">
                      <span className="text-[8px] font-black uppercase tracking-widest text-amber-600">Revision Instructions:</span>
                      <p className="text-xs font-bold text-slate-900 leading-relaxed">{submission.revisionNotes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-12">
              <div className="flex justify-between items-end border-b border-neutral-100 pb-8">
                <h3 className="serif text-4xl font-light italic">Spatial Comparison</h3>
                <div className="flex gap-6">
                  <button onClick={() => handleDownload(submission.dataUrl, 'ORIGINAL')} className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-300 hover:text-black transition-colors">Source File</button>
                  {submission.resultDataUrl && (
                    <button onClick={() => handleDownload(submission.resultDataUrl!, 'STAGED')} className="text-[9px] font-black uppercase tracking-[0.3em] border-b-2 border-black pb-1">Final Deliverable</button>
                  )}
                </div>
              </div>

              <div className="relative w-full aspect-video rounded-[1.5rem] overflow-hidden bg-neutral-100 shadow-2xl group cursor-ew-resize select-none touch-none" ref={containerRef}>
                {submission.resultDataUrl ? (
                  <>
                    <img src={submission.resultDataUrl} className="absolute inset-0 w-full h-full object-cover" alt="After" />
                    <div 
                      className="absolute inset-0 w-full h-full overflow-hidden border-r border-white/40"
                      style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
                    >
                      <img src={submission.dataUrl} className="absolute inset-0 w-full h-full object-cover" alt="Before" />
                    </div>

                    <div 
                      className="absolute inset-y-0 z-10"
                      style={{ left: `${sliderPos}%` }}
                      onMouseDown={handleStart}
                      onTouchStart={handleStart}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-white/90 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-center transition-transform group-active:scale-90">
                        <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 9l-3 3m0 0l3 3m-3-3h14m-3-3l3 3m0 0l-3 3" />
                        </svg>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-300 text-center space-y-4">
                    <span className="serif text-7xl font-light italic opacity-20">Processing</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Digital transformation underway</p>
                  </div>
                )}
              </div>
            </div>

            {submission.referenceImages && submission.referenceImages.length > 0 && (
              <div className="space-y-16 border-t border-neutral-100 pt-32 pb-10">
                <h3 className="serif text-3xl font-light italic">Design Benchmarks</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  {submission.referenceImages.map((ref) => (
                    <div key={ref.id} className="space-y-6 group">
                      <div className="relative aspect-[3/4] bg-neutral-50 rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-500">
                        <img src={ref.dataUrl} className="w-full h-full object-cover" alt="Reference" />
                        <button 
                          onClick={() => handleDownload(ref.dataUrl, 'REFERENCE')}
                          className="absolute bottom-5 right-5 p-3 bg-white text-black rounded-full shadow-xl opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        </button>
                      </div>
                      {ref.description && (
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-300 leading-relaxed px-1">
                          Ref: {ref.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
