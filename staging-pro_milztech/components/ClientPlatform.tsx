
import React, { useState } from 'react';
import { PlanType, Submission, User, PLAN_DETAILS, ReferenceImage, getEstimatedDeliveryDate } from '../types';
import { PlanCard } from './PlanCard';
import { FileUpload } from './FileUpload';
import { DetailModal } from './DetailModal';
import { ReferenceImageUpload } from './ReferenceImageUpload';
import { sendStudioEmail, EMAIL_TEMPLATES } from '../lib/email';
import { db } from '../lib/supabase';

interface ClientPlatformProps {
  user: User;
  onSubmission: (submission: Submission) => Promise<void>;
  userSubmissions: Submission[];
}

export const ClientPlatform: React.FC<ClientPlatformProps> = ({ user, onSubmission, userSubmissions }) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.FURNITURE_REMOVE);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState('');
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [viewingDetail, setViewingDetail] = useState<Submission | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleInitiate = () => {
    if (!selectedFile) return;
    setIsConfirming(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedFile || !previewUrl || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      const orderId = Math.random().toString(36).substr(2, 9);
      
      const storagePath = `${user.id}/${orderId}_source.jpg`;
      const publicImageUrl = await db.storage.upload(storagePath, previewUrl);

      const uploadedReferences = await Promise.all(
        referenceImages.map(async (ref, idx) => {
          const refPath = `${user.id}/${orderId}_ref_${idx}.jpg`;
          const url = await db.storage.upload(refPath, ref.dataUrl);
          return { ...ref, dataUrl: url };
        })
      );

      const submission: Submission = {
        id: orderId,
        ownerId: user.id,
        plan: selectedPlan,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        dataUrl: publicImageUrl,
        instructions: instructions.trim(),
        referenceImages: uploadedReferences,
        timestamp: Date.now(),
        status: 'pending'
      };

      await onSubmission(submission);
      
      try {
        await sendStudioEmail(
          user.email,
          `Order Confirmed: ${submission.id}`,
          EMAIL_TEMPLATES.ORDER_CONFIRMED(submission.id, PLAN_DETAILS[selectedPlan].title)
        );
      } catch (e) {
        console.warn("Email notification failed, but order was saved.");
      }
      
      setShowSuccess(true);
      setIsConfirming(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setInstructions('');
      setReferenceImages([]);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error("Submit Error:", err);
      alert(`ORDER FAILED: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="max-w-xl mx-auto py-40 px-6 text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl">
           <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight jakarta uppercase">Order Completed</h2>
        <p className="text-slate-500 mb-12 text-lg font-medium leading-relaxed">
          The studio designers have been assigned to your project.<br/>Monitor the progress in your archive below.
        </p>
        <button 
          onClick={() => {
            setShowSuccess(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="bg-slate-900 text-white px-12 py-5 rounded-3xl text-xs font-extrabold uppercase tracking-widest shadow-2xl hover:bg-black transition-all"
        >
          Start Another Room
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto py-16 px-6 lg:px-12">
      {viewingDetail && (
        <DetailModal submission={viewingDetail} onClose={() => setViewingDetail(null)} />
      )}

      {isConfirming && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative p-8 md:p-12 space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight jakarta">Confirm Your Order</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Please review the details below before proceeding.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-6">
                <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 shadow-inner">
                  <img src={previewUrl || ''} className="w-full h-full object-cover" alt="Preview" />
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Plan</span>
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{PLAN_DETAILS[selectedPlan].title}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
                    <span className="text-lg font-black text-slate-900 jakarta">{PLAN_DETAILS[selectedPlan].price}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Order Date</p>
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">{new Date().toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Est. Delivery</p>
                    <p className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">{getEstimatedDeliveryDate(Date.now()).toLocaleDateString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Detailed Instructions</p>
                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic line-clamp-4">
                      {instructions.trim() || "No specific instructions."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col md:flex-row gap-4">
              <button 
                onClick={() => setIsConfirming(false)}
                className="flex-1 py-5 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-all"
              >
                Back to Edit
              </button>
              <button 
                onClick={handleConfirmSubmit}
                disabled={isSubmitting}
                className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.4em] shadow-xl hover:bg-black transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Uploading to Studio...' : 'Confirm and Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-20 items-start">
        <div className="flex-1 space-y-12">
          <header className="space-y-6">
            <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85] jakarta">
              High-End <br/> Visualization.
            </h1>
          </header>

          <div className="space-y-8">
            <div className="card-premium rounded-[3rem] p-10 md:p-14">
              <div className="flex items-center gap-6 mb-12">
                <span className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl font-black text-lg">01</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight jakarta uppercase">Choose Strategy</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <PlanCard type={PlanType.FURNITURE_REMOVE} isSelected={selectedPlan === PlanType.FURNITURE_REMOVE} onSelect={setSelectedPlan} />
                <PlanCard type={PlanType.FURNITURE_ADD} isSelected={selectedPlan === PlanType.FURNITURE_ADD} onSelect={setSelectedPlan} />
                <PlanCard type={PlanType.FURNITURE_BOTH} isSelected={selectedPlan === PlanType.FURNITURE_BOTH} onSelect={setSelectedPlan} />
              </div>
            </div>

            <div className="card-premium rounded-[3rem] p-10 md:p-14">
              <div className="flex items-center gap-6 mb-12">
                <span className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl font-black text-lg">02</span>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight jakarta uppercase">Input Assets</h2>
              </div>
              <div className="space-y-12">
                <div className="bg-slate-50 rounded-[2rem] p-4">
                  <FileUpload onFileSelect={handleFileSelect} />
                </div>
                
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-2">Studio Instructions</label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Describe styles..."
                    className="w-full bg-slate-50 border-2 border-transparent p-8 rounded-[2rem] min-h-[160px] text-sm font-medium focus:bg-white focus:border-slate-900 outline-none transition-all resize-none"
                  />
                </div>

                <ReferenceImageUpload references={referenceImages} setReferences={setReferenceImages} />

                <button
                  onClick={handleInitiate}
                  disabled={!selectedFile || isSubmitting}
                  className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] hover:bg-black transition-all shadow-2xl disabled:opacity-20 flex items-center justify-center gap-4 group"
                >
                  {isSubmitting ? 'SYNCING WITH STUDIO...' : (
                    <>
                      <span>Initiate Staging Session</span>
                      <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[450px] space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900">Order Archive</h2>
            <div className="w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black">
              {userSubmissions.length}
            </div>
          </div>

          <div className="space-y-4">
            {userSubmissions.length === 0 ? (
              <div className="card-premium rounded-[2.5rem] p-12 text-center border-dashed border-2 bg-slate-50/50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-relaxed">No projects in pipeline.</p>
              </div>
            ) : (
              userSubmissions.map((sub) => (
                <div 
                  key={sub.id} 
                  onClick={() => setViewingDetail(sub)}
                  className="group flex items-center gap-5 p-4 bg-white rounded-[2rem] border border-slate-100 hover:border-slate-900 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-[1.2rem] overflow-hidden flex-shrink-0 bg-slate-100 relative">
                    <img src={sub.dataUrl} className="w-full h-full object-cover transition-all duration-700" alt="" />
                    {sub.status === 'completed' && (
                       <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest truncate">
                        {PLAN_DETAILS[sub.plan].title}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                          sub.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                        }`}>{sub.status}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(sub.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
