
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Submission, PLAN_DETAILS, Editor, User, PlanType, getEstimatedDeliveryDate } from '../types';
import { DetailModal } from './DetailModal';
import { db } from '../lib/supabase';

interface AdminDashboardProps {
  user: User;
  submissions: Submission[];
  onDelete: (id: string) => void;
  onDeliver: (id: string, resultDataUrl: string) => void;
  onRefresh: () => void;
  onAssign: (id: string, editorId: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, notes?: string) => void;
  isSyncing: boolean;
  editors: Editor[];
  onAddEditor: (name: string, specialty: string, email?: string) => void;
  onDeleteEditor: (id: string) => void;
}

type FilterStatus = 'all' | 'pending' | 'processing' | 'reviewing' | 'completed';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, submissions, onDelete, onDeliver, onRefresh, onAssign, onApprove, onReject, isSyncing, editors, onAddEditor, onDeleteEditor
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSubmissionId = useRef<string | null>(null);
  
  const [showOnlyMine, setShowOnlyMine] = useState(user.role === 'editor');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [planFilter, setPlanFilter] = useState<PlanType | 'all'>('all');
  const [editorFilter, setEditorFilter] = useState<string>('all');
  const [viewingDetail, setViewingDetail] = useState<Submission | null>(null);
  const [showEditorManager, setShowEditorManager] = useState(false);
  const [isUploadingResult, setIsUploadingResult] = useState(false);
  
  const [revisingSubmission, setRevisingSubmission] = useState<Submission | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');

  const [newEdName, setNewEdName] = useState('');
  const [newEdEmail, setNewEdEmail] = useState('');
  const [newEdSpecialty, setNewEdSpecialty] = useState('');

  const filteredSubmissions = useMemo(() => {
    let result = [...submissions];
    if (showOnlyMine && user.editorRecordId) {
      const myId = String(user.editorRecordId);
      result = result.filter(s => String(s.assignedEditorId) === myId);
    }
    if (statusFilter !== 'all') result = result.filter(s => s.status === statusFilter);
    if (planFilter !== 'all') result = result.filter(s => s.plan === planFilter);
    if (user.role === 'admin' && !showOnlyMine && editorFilter !== 'all') {
      result = result.filter(s => s.assignedEditorId === editorFilter);
    }
    return result;
  }, [submissions, statusFilter, planFilter, editorFilter, user.editorRecordId, showOnlyMine, user.role]);

  const handleDeliverClick = (id: string) => {
    activeSubmissionId.current = id;
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeSubmissionId.current) {
      setIsUploadingResult(true);
      const subId = activeSubmissionId.current;
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const path = `results/${subId}_final.jpg`;
          const publicUrl = await db.storage.upload(path, base64);
          
          onDeliver(subId, publicUrl);
          activeSubmissionId.current = null;
        } catch (err) {
          alert("Storage upload failed.");
        } finally {
          setIsUploadingResult(false);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const submitRevision = () => {
    if (revisingSubmission) {
      onReject(revisingSubmission.id, revisionNotes);
      setRevisingSubmission(null);
      setRevisionNotes('');
    }
  };

  const stats = {
    total: filteredSubmissions.length,
    pending: filteredSubmissions.filter(s => s.status === 'pending').length,
    processing: filteredSubmissions.filter(s => s.status === 'processing').length,
    reviewing: filteredSubmissions.filter(s => s.status === 'reviewing').length,
    completed: filteredSubmissions.filter(s => s.status === 'completed').length,
  };

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-6 lg:px-10 space-y-8">
      {viewingDetail && <DetailModal submission={viewingDetail} onClose={() => setViewingDetail(null)} />}
      
      {revisingSubmission && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight jakarta">Revision Request</h3>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">Provide specific instructions for the editor</p>
            </div>
            <textarea
              className="w-full min-h-[160px] bg-slate-50 border-2 border-transparent p-6 rounded-2xl text-xs font-medium focus:bg-white focus:border-slate-900 outline-none transition-all resize-none"
              placeholder="Ex: Please change the sofa color to light grey..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
            />
            <div className="flex gap-4">
              <button 
                onClick={() => setRevisingSubmission(null)}
                className="flex-1 py-4 border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-900 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={submitRevision}
                disabled={!revisionNotes.trim()}
                className="flex-1 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all disabled:opacity-20"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditorManager && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tighter jakarta">Studio Team</h3>
              <button onClick={() => setShowEditorManager(false)} className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-100 hover:bg-slate-900 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
              <div className="bg-slate-50 p-6 rounded-2xl space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Name" value={newEdName} onChange={e => setNewEdName(e.target.value)} className="w-full px-5 py-3 rounded-xl bg-white text-[11px] font-bold uppercase tracking-widest outline-none border border-transparent focus:border-slate-900 shadow-sm" />
                  <input placeholder="Specialty" value={newEdSpecialty} onChange={e => setNewEdSpecialty(e.target.value)} className="w-full px-5 py-3 rounded-xl bg-white text-[11px] font-bold uppercase tracking-widest outline-none border border-transparent focus:border-slate-900 shadow-sm" />
                </div>
                <input placeholder="Email" value={newEdEmail} onChange={e => setNewEdEmail(e.target.value)} className="w-full px-5 py-3 rounded-xl bg-white text-[11px] font-bold uppercase tracking-widest outline-none border border-transparent focus:border-slate-900 shadow-sm" />
                <button onClick={() => { onAddEditor(newEdName, newEdSpecialty, newEdEmail); setNewEdName(''); setNewEdEmail(''); setNewEdSpecialty(''); }} className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.4em] shadow-lg">Register Editor</button>
              </div>
              <div className="space-y-2">
                {editors.map(ed => (
                  <div key={ed.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">{ed.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ed.email} {ed.specialty && `• ${ed.specialty}`}</span>
                    </div>
                    <button onClick={() => onDeleteEditor(ed.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />

      <header className="flex flex-col xl:flex-row justify-between items-center gap-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase jakarta">Production Hub</h1>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap shadow-sm">
                {k}: <span className="text-slate-900">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
           {user.editorRecordId && (
             <div className="flex items-center gap-3 bg-emerald-50 px-5 py-2.5 rounded-full border border-emerald-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  LINKED: {editors.find(e => e.id === user.editorRecordId)?.name || 'ACTIVE'}
                </span>
             </div>
           )}
           {user.role === 'admin' && <button onClick={() => setShowEditorManager(true)} className="px-6 py-2.5 bg-white border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-slate-900 hover:text-white transition-all">Team</button>}
           <button onClick={onRefresh} className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-black shadow-lg flex items-center gap-2">
              <svg className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Sync
           </button>
        </div>
      </header>

      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setShowOnlyMine(!showOnlyMine)} 
            className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showOnlyMine ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
          >
            {user.role === 'admin' ? 'My Assignments' : 'My Projects'}
          </button>
          <div className="w-px h-6 bg-slate-100 mx-2"></div>
          {(['all', 'pending', 'processing', 'reviewing', 'completed'] as FilterStatus[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'text-slate-900 bg-slate-50 font-black' : 'text-slate-300 hover:text-slate-400'}`}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-4 pr-3">
           <select value={planFilter} onChange={e => setPlanFilter(e.target.value as any)} className="bg-slate-50 border-none px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer">
              <option value="all">Plan: All</option>
              {Object.values(PlanType).map(p => <option key={p} value={p}>{p}</option>)}
           </select>
           {user.role === 'admin' && (
             <select value={editorFilter} onChange={e => setEditorFilter(e.target.value)} className="bg-slate-50 border-none px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer">
                <option value="all">Editor: All</option>
                {editors.map(ed => <option key={ed.id} value={ed.id}>{ed.name}</option>)}
             </select>
           )}
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">View</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Preview</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Project Detail</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Schedule</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">Assignee</th>
                <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-32 text-center">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 italic mb-4">
                      {isSyncing ? 'Loading from Studio...' : 'Queue is empty in this view'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-4 text-center">
                       <button 
                        onClick={() => setViewingDetail(sub)}
                        className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-slate-100 hover:bg-slate-900 hover:text-white transition-all shadow-sm bg-white"
                        title="View Details"
                       >
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                         </svg>
                       </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="w-20 h-14 mx-auto rounded-lg bg-slate-100 overflow-hidden cursor-pointer shadow-sm border border-slate-100 hover:scale-105 transition-transform" onClick={() => setViewingDetail(sub)}>
                        <img src={sub.dataUrl} className="w-full h-full object-cover" alt="" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        sub.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        sub.status === 'reviewing' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                        sub.status === 'processing' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>{sub.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5 cursor-pointer" onClick={() => setViewingDetail(sub)}>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest hover:underline">
                            {PLAN_DETAILS[sub.plan].title}
                          </span>
                        </div>
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">ID: {sub.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest w-8">Ord:</span>
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                            {new Date(sub.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-black text-blue-300 uppercase tracking-widest w-8">Due:</span>
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                            {getEstimatedDeliveryDate(sub.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       {user.role === 'admin' ? (
                         <select 
                           value={sub.assignedEditorId || ''} 
                           onChange={(e) => onAssign(sub.id, e.target.value)}
                           className="bg-slate-50 border-none px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest outline-none cursor-pointer w-full max-w-[140px]"
                         >
                           <option value="">Unassigned</option>
                           {editors.map(ed => (
                             <option key={ed.id} value={ed.id}>{ed.name}</option>
                           ))}
                         </select>
                       ) : (
                         <div className="flex flex-col">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                             {editors.find(e => e.id === sub.assignedEditorId)?.name || 'Unassigned'}
                           </span>
                         </div>
                       )}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {sub.status === 'reviewing' && user.role === 'admin' && (
                          <>
                            <button onClick={() => onApprove(sub.id)} className="w-8 h-8 flex items-center justify-center bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-sm"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></button>
                            <button onClick={() => setRevisingSubmission(sub)} className="w-8 h-8 flex items-center justify-center bg-amber-500 text-white rounded-lg hover:bg-amber-600 shadow-sm"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </>
                        )}
                        {(sub.status === 'processing' || sub.status === 'reviewing' || sub.status === 'completed') && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => setRevisingSubmission(sub)} className="p-2 text-slate-300 hover:text-slate-900"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                            {(sub.status === 'processing' || sub.status === 'reviewing') && (
                              <button onClick={() => handleDeliverClick(sub.id)} className="px-5 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">Upload Result</button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
