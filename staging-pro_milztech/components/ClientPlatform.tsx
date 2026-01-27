
import React, { useState, useEffect } from 'react';
import { PlanType, Submission, User, PLAN_DETAILS, ReferenceImage, getEstimatedDeliveryDate } from '../types';
import { PlanCard } from './PlanCard';
import { FileUpload } from './FileUpload';
import { DetailModal } from './DetailModal';
import { ChatBoard } from './ChatBoard';
import { ReferenceImageUpload } from './ReferenceImageUpload';
import { db, supabase } from '../lib/supabase';
import { sendStudioEmail, EMAIL_TEMPLATES } from '../lib/email';

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
  const [chattingSubmission, setChattingSubmission] = useState<Submission | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const orderId = params.get('order_id');
    const paymentStatus = params.get('payment');

    if (sessionId && orderId && paymentStatus === 'success') {
      handlePaymentSuccess(orderId, sessionId);
    }
  }, []);

  const handlePaymentSuccess = async (orderId: string, sessionId: string) => {
    try {
      await db.submissions.update(orderId, { 
        paymentStatus: 'paid',
        stripeSessionId: sessionId,
        status: 'pending'
      });

      const { data: sub } = await supabase.from('submissions').select('*').eq('id', orderId).single();
      
      if (sub && sub.ownerEmail) {
        try {
          const planInfo = PLAN_DETAILS[sub.plan];
          await sendStudioEmail(
            sub.ownerEmail,
            `Order Confirmed: ${sub.id}`,
            EMAIL_TEMPLATES.ORDER_CONFIRMED({
              orderId: sub.id,
              planName: planInfo?.title || 'Staging Service',
              price: planInfo?.price || '-',
              date: new Date(sub.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              delivery: getEstimatedDeliveryDate(sub.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              thumbnail: sub.dataUrl
            })
          );
        } catch (emailErr) {
          console.error("Order confirmation email failed:", emailErr);
        }
      }

      window.history.replaceState({}, document.title, "/");
      setShowSuccess(true);
    } catch (err) {
      console.error("Payment confirmation failed:", err);
    }
  };

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

  const handleConfirmAndPay = async () => {
    if (!selectedFile || !previewUrl || isSubmitting) return;
    const planInfo = PLAN_DETAILS[selectedPlan];
    const finalAmount = planInfo ? Number(planInfo.amount) : 0;

    if (!planInfo || isNaN(finalAmount) || finalAmount <= 0) {
      alert(`System Error: Could not determine pricing.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = Math.random().toString(36).substr(2, 9).toUpperCase();
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
        ownerEmail: user.email,
        plan: selectedPlan,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        dataUrl: publicImageUrl,
        instructions: instructions.trim(),
        referenceImages: uploadedReferences,
        timestamp: Date.now(),
        status: 'pending',
        paymentStatus: 'unpaid'
      };

      await onSubmission(submission);

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planTitle: planInfo.title,
          amount: finalAmount,
          orderId: orderId,
          userEmail: user.email
        }),
      });

      const data = await response.json();
      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.message || "Checkout failed.");
      }
    } catch (err: any) {
      alert(`PROCESS FAILED: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="max-w-xl mx-auto py-40 px-6 text-center animate-in zoom-in duration-500">
        <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-10 shadow-2xl">
           <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight jakarta uppercase">Order Confirmed</h2>
        <p className="text-slate-500 mb-12 text-lg font-medium leading-relaxed">
          Payment received. Our visualizers are now processing your request.
        </p>
        <button onClick={() => setShowSuccess(false)} className="bg-slate-900 text-white px-12 py-5 rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-2xl">Return to Studio</button>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto py-16 px-6 lg:px-12">
      {viewingDetail && <DetailModal submission={viewingDetail} onClose={() => setViewingDetail(null)} />}
      {chattingSubmission && <ChatBoard submission={chattingSubmission} user={user} onClose={() => setChattingSubmission(null)} />}

      {isConfirming && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative p-8 md:p-12 space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black uppercase tracking-tight jakarta">Review & Payment</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden shadow-inner">
                <img src={previewUrl || ''} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                  <div className="flex justify-between items-center border-b pb-2"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Plan</span><span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{PLAN_DETAILS[selectedPlan]?.title}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</span><span className="text-xl font-black text-slate-900 jakarta">{PLAN_DETAILS[selectedPlan]?.price} <span className="text-[10px]">USD</span></span></div>
                </div>
              </div>
            </div>
            <div className="pt-6 border-t flex gap-4">
              <button onClick={() => setIsConfirming(false)} className="flex-1 py-5 border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300">Back</button>
              <button onClick={handleConfirmAndPay} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl">Confirm & Pay</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-20 items-start">
        <div className="flex-1 space-y-12">
          <header className="space-y-6">
            <h1 className="text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.85] jakarta">Order <br/> Staging.</h1>
          </header>

          <div className="space-y-8">
            <div className="card-premium rounded-[3rem] p-10 md:p-14">
              <div className="flex items-center gap-6 mb-12"><span className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl font-black text-lg">01</span><h2 className="text-2xl font-black text-slate-900 uppercase">Select Service</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <PlanCard type={PlanType.FURNITURE_REMOVE} isSelected={selectedPlan === PlanType.FURNITURE_REMOVE} onSelect={setSelectedPlan} />
                <PlanCard type={PlanType.FURNITURE_ADD} isSelected={selectedPlan === PlanType.FURNITURE_ADD} onSelect={setSelectedPlan} />
                <PlanCard type={PlanType.FURNITURE_BOTH} isSelected={selectedPlan === PlanType.FURNITURE_BOTH} onSelect={setSelectedPlan} />
              </div>
            </div>

            <div className="card-premium rounded-[3rem] p-10 md:p-14">
              <div className="flex items-center gap-6 mb-12"><span className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl font-black text-lg">02</span><h2 className="text-2xl font-black text-slate-900 uppercase">Upload Assets</h2></div>
              <div className="space-y-12">
                <FileUpload onFileSelect={handleFileSelect} />
                <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Specific requests..." className="w-full bg-slate-50 p-8 rounded-[2rem] min-h-[160px] text-sm font-medium outline-none transition-all resize-none" />
                <ReferenceImageUpload references={referenceImages} setReferences={setReferenceImages} />
                <button onClick={handleInitiate} disabled={!selectedFile || isSubmitting} className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] text-[12px] font-black uppercase tracking-[0.4em] shadow-2xl disabled:opacity-20 flex items-center justify-center gap-4 group">
                  {isSubmitting ? 'SYNCING...' : <span>Submit & Proceed to Checkout</span>}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[450px] space-y-8">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900">Project History</h2>
            <div className="w-7 h-7 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black">{userSubmissions.filter(s => s.paymentStatus === 'paid').length}</div>
          </div>

          <div className="space-y-4">
            {userSubmissions.filter(s => s.paymentStatus === 'paid').map((sub) => (
              <div key={sub.id} className="group flex flex-col p-5 bg-white rounded-[2.5rem] border border-slate-100 hover:border-slate-900 hover:shadow-xl transition-all">
                <div className="flex gap-4 mb-4">
                  <div onClick={() => setViewingDetail(sub)} className="w-20 h-20 rounded-[1.2rem] overflow-hidden flex-shrink-0 bg-slate-100 relative cursor-pointer">
                    <img src={sub.dataUrl} className="w-full h-full object-cover" alt="" />
                    {sub.status === 'completed' && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></div>}
                  </div>
                  <div className="flex-grow min-w-0">
                    <span onClick={() => setViewingDetail(sub)} className="text-[10px] font-black text-slate-900 uppercase tracking-widest truncate block mb-1 cursor-pointer">{PLAN_DETAILS[sub.plan]?.title}</span>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2"><span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${sub.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{sub.status}</span></div>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Est. Delivery:</span>
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{getEstimatedDeliveryDate(sub.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setChattingSubmission(sub)}
                  className="w-full py-3.5 bg-slate-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Contact Studio
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
