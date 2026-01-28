
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Submission, PLAN_DETAILS, Editor, User, PlanType, getEstimatedDeliveryDate, Message } from '../types';
import { DetailModal } from './DetailModal';
import { ChatBoard } from './ChatBoard';
import { db } from '../lib/supabase';

interface AdminDashboardProps {
  user: User;
  submissions: Submission[];
  onDelete: (id: string) => void;
  onDeliver: (id: string, updates: Partial<Submission>) => void;
  onRefresh: () => void;
  onAssign: (id: string, editorId: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string, notes?: string) => void;
  isSyncing: boolean;
  editors: Editor[];
  onAddEditor: (name: string, specialty: string, email?: string) => void;
  onDeleteEditor: (id: string) => void;
}

type FilterStatus = 'all' | 'pending' | 'processing' | 'reviewing' | 'completed' | 'comments';
type SortField = 'orderedDate' | 'deliveryDate';
type SortDirection = 'asc' | 'desc';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  user, submissions, onDelete, onDeliver, onRefresh, onAssign, onApprove, onReject, isSyncing, editors, onAddEditor, onDeleteEditor
}) => {
  if (!user) return null;

  const [showOnlyMine, setShowOnlyMine] = useState(user?.role === 'editor');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [planFilter, setPlanFilter] = useState<PlanType | 'all'>('all');
  const [viewingDetail, setViewingDetail] = useState<Submission | null>(null);
  const [chattingSubmission, setChattingSubmission] = useState<Submission | null>(null);
  const [showEditorManager, setShowEditorManager] = useState(false);
  const [revisingSubmission, setRevisingSubmission] = useState<Submission | null>(null);
  const [viewingRevision, setViewingRevision] = useState<Submission | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  
  const [newEdName, setNewEdName] = useState('');
  const [newEdEmail, setNewEdEmail] = useState('');
  const [newEdSpecialty, setNewEdSpecialty] = useState('Generalist');

  const [sortField, setSortField] = useState<SortField>('orderedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Background scroll lock logic
  useEffect(() => {
    const isAnyModalOpen = viewingDetail || chattingSubmission || showEditorManager || revisingSubmission || viewingRevision;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [viewingDetail, chattingSubmission, showEditorManager, revisingSubmission, viewingRevision]);

  useEffect(() => {
    loadAllMessages();
    const interval = setInterval(loadAllMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAllMessages = async () => {
    try {
      const msgs = await db.messages.fetchAll() as Message[];
      setAllMessages(msgs);
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const submissionChatInfo = useMemo(() => {
    const info: Record<string, { count: number, lastMessage?: Message, hasNew: boolean }> = {};
    allMessages.forEach(msg => {
      const sId = msg.submission_id || msg.submissionId;
      if (!sId) return;
      if (!info[sId]) info[sId] = { count: 0, hasNew: false };
      info[sId].count += 1;
      if (!info[sId].lastMessage || msg.timestamp > info[sId].lastMessage.timestamp) {
        info[sId].lastMessage = msg;
        const role = msg.sender_role || msg.senderRole;
        info[sId].hasNew = (role === 'user');
      }
    });
    return info;
  }, [allMessages]);

  const newMessagesCount = useMemo(() => {
    return Object.values(submissionChatInfo).filter((info: { hasNew: boolean }) => info.hasNew).length;
  }, [submissionChatInfo]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredSubmissions = useMemo(() => {
    let result = submissions.filter(s => s.paymentStatus === 'paid');
    if (showOnlyMine && user?.editorRecordId) {
      const myId = String(user.editorRecordId);
      result = result.filter(s => String(s.assignedEditorId) === myId);
    }
    if (statusFilter === 'comments') {
      result = result.filter(s => (submissionChatInfo[s.id]?.count || 0) > 0);
      result.sort((a, b) => {
        const timeA = submissionChatInfo[a.id]?.lastMessage?.timestamp || 0;
        const timeB = submissionChatInfo[b.id]?.lastMessage?.timestamp || 0;
        return timeB - timeA;
      });
    } else {
      if (statusFilter !== 'all') result = result.filter(s => s.status === statusFilter);
      result.sort((a, b) => {
        let valA = a.timestamp;
        let valB = b.timestamp;
        if (sortField === 'deliveryDate') {
          valA = getEstimatedDeliveryDate(a.timestamp).getTime();
          valB = getEstimatedDeliveryDate(b.timestamp).getTime();
        }
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
    }
    if (planFilter !== 'all') result = result.filter(s => s.plan === planFilter);
    return result;
  }, [submissions, statusFilter, planFilter, user?.editorRecordId, showOnlyMine, submissionChatInfo, sortField, sortDirection]);

  const stats = {
    total: submissions.filter(s => s.paymentStatus === 'paid').length,
    pending: submissions.filter(s => s.status === 'pending' && s.paymentStatus === 'paid').length,
    processing: submissions.filter(s => s.status === 'processing' && s.paymentStatus === 'paid').length,
    reviewing: submissions.filter(s => s.status === 'reviewing' && s.paymentStatus === 'paid').length,
    completed: submissions.filter(s => s.status === 'completed' && s.paymentStatus === 'paid').length,
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <svg className="w-3 h-3 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path d="M5 10l5-5 5 5H5zM5 12l5 5 5-5H5z" /></svg>;
    return sortDirection === 'asc' 
      ? <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path d="M5 15l5-5 5 5H5z" /></svg>
      : <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path d="M15 5l-5 5-5-5h10z" /></svg>;
  };

  const handleAddNewEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEdName.trim() || !newEdEmail.trim()) return;
    onAddEditor(newEdName, newEdSpecialty, newEdEmail);
    setNewEdName('');
    setNewEdEmail('');
    setNewEdSpecialty('Generalist');
  };

  // 納品用ドロップコンポーネント
  const DeliveryDropZone = ({ 
    submission, 
    type 
  }: { 
    submission: Submission, 
    type: 'remove' | 'add' | 'single' 
  }) => {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const label = type === 'remove' ? 'REMOVED' : type === 'add' ? 'STAGED' : 'FINAL RESULT';
    const isBoth = submission.plan === PlanType.FURNITURE_BOTH;
    
    // 現在のプレビュー
    const currentUrl = type === 'remove' ? submission.resultRemoveUrl : (type === 'add' ? submission.resultAddUrl : (submission.resultAddUrl || submission.resultDataUrl));

    const handleUpload = async (file: File) => {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const path = `results/${submission.id}_${type}.jpg`;
          const publicUrl = await db.storage.upload(path, base64);
          
          const updates: Partial<Submission> = {};
          if (type === 'remove') updates.resultRemoveUrl = publicUrl;
          else if (type === 'add' || type === 'single') {
            updates.resultAddUrl = publicUrl;
            updates.resultDataUrl = publicUrl; // 互換性
          }

          // 両方必要なBothプランの場合、両方揃っていたらreviewingへ
          let newStatus = submission.status;
          if (isBoth) {
            const hasRemove = type === 'remove' || !!submission.resultRemoveUrl;
            const hasAdd = type === 'add' || !!submission.resultAddUrl;
            if (hasRemove && hasAdd) newStatus = user.role === 'admin' ? 'completed' : 'reviewing';
          } else {
            newStatus = user.role === 'admin' ? 'completed' : 'reviewing';
          }
          updates.status = newStatus;

          onDeliver(submission.id, updates);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    };

    return (
      <div 
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleUpload(file); }}
        className={`relative group rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-2 min-h-[100px] overflow-hidden ${
          dragging ? 'border-slate-900 bg-slate-50' : 
          currentUrl ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100 bg-white'
        }`}
      >
        {currentUrl ? (
          <>
            <img src={currentUrl} className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity" alt="" />
            <div className="relative z-10 text-center">
              <span className="text-[7px] font-black text-emerald-600 tracking-widest block uppercase mb-1">{label} UPLOADED</span>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e: any) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }; input.click(); }} className="text-[8px] font-black text-slate-900 uppercase underline">Replace</button>
            </div>
          </>
        ) : uploading ? (
          <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <div className="text-center p-2">
            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest block mb-1">DROP {label}</span>
            <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e: any) => { const file = e.target.files?.[0]; if (file) handleUpload(file); }; input.click(); }} className="text-[7px] font-black text-slate-400 uppercase tracking-widest border border-slate-100 rounded-lg px-2 py-1 hover:bg-white transition-all shadow-sm">Browse</button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-6 lg:px-10 space-y-8">
      {viewingDetail && <DetailModal submission={viewingDetail} onClose={() => setViewingDetail(null)} />}
      {chattingSubmission && <ChatBoard submission={chattingSubmission} user={user} onClose={() => { setChattingSubmission(null); loadAllMessages(); }} />}
      
      {/* Revision Reading Modal */}
      {viewingRevision && (
        <div className="fixed inset-0 z-[140] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setViewingRevision(null)}>
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight jakarta">Revision Request</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Specific instructions from the lead visualizer.</p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 italic font-medium text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              "{viewingRevision.revisionNotes}"
            </div>
            <button onClick={() => setViewingRevision(null)} className="w-full py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Close & Continue Work</button>
          </div>
        </div>
      )}

      {revisingSubmission && (
        <div className="fixed inset-0 z-[130] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setRevisingSubmission(null)}>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8 animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-black uppercase tracking-tight jakarta">Internal Feedback</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Private instructions for the assigned editor.</p>
            </div>
            <textarea
              className="w-full min-h-[180px] bg-slate-50 border-2 border-transparent p-6 rounded-2xl text-xs font-medium focus:bg-white focus:border-slate-900 outline-none transition-all resize-none shadow-inner"
              placeholder="Example: Please brighten the room and fix the shadow under the sofa..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setRevisingSubmission(null)} className="flex-1 py-4 border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300">Cancel</button>
              <button 
                onClick={() => { onReject(revisingSubmission.id, revisionNotes); setRevisingSubmission(null); setRevisionNotes(''); }} 
                disabled={!revisionNotes.trim()} 
                className="flex-1 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-20"
              >
                Send to Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditorManager && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setShowEditorManager(false)}>
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="px-10 py-8 border-b flex justify-between items-center bg-slate-50/50">
              <div className="space-y-1">
                <h3 className="text-xl font-black uppercase tracking-tighter jakarta">Studio Team</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Management and Member Authorization</p>
              </div>
              <button onClick={() => setShowEditorManager(false)} className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-900 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">Add New Visualizer</h4>
                 <form onSubmit={handleAddNewEditor} className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <input value={newEdName} onChange={(e) => setNewEdName(e.target.value)} placeholder="Full Name" className="bg-white px-5 py-3.5 rounded-xl text-[11px] font-medium border border-transparent focus:border-slate-900 outline-none w-full" required />
                     <input value={newEdEmail} onChange={(e) => setNewEdEmail(e.target.value)} type="email" placeholder="Email Address" className="bg-white px-5 py-3.5 rounded-xl text-[11px] font-medium border border-transparent focus:border-slate-900 outline-none w-full" required />
                   </div>
                   <div className="flex gap-4">
                     <select value={newEdSpecialty} onChange={(e) => setNewEdSpecialty(e.target.value)} className="bg-white px-5 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-widest outline-none flex-grow">
                        <option>Generalist</option>
                        <option>3D Modeler</option>
                        <option>Interior Designer</option>
                        <option>Lead Visualizer</option>
                     </select>
                     <button type="submit" className="px-10 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg">Authorize</button>
                   </div>
                 </form>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 px-2">Current Active Members</h4>
                <div className="space-y-3">
                  {editors.map(ed => (
                    <div key={ed.id} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center rounded-xl font-black text-xs">{ed.name.charAt(0)}</div>
                        <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">{ed.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ed.email} • {ed.specialty}</span>
                        </div>
                      </div>
                      <button onClick={() => onDeleteEditor(ed.id)} className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
           {user?.role === 'admin' && <button onClick={() => setShowEditorManager(true)} className="px-6 py-2.5 bg-white border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full">Team Manager</button>}
           <button onClick={onRefresh} className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">Sync</button>
        </div>
      </header>

      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowOnlyMine(!showOnlyMine)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showOnlyMine ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>
            {user?.role === 'admin' ? 'My Assignments' : 'My Current Queue'}
          </button>
          <div className="w-px h-6 bg-slate-100 mx-2"></div>
          {(['all', 'pending', 'processing', 'reviewing', 'completed', 'comments'] as FilterStatus[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === s ? 'text-slate-900 bg-slate-50 font-black' : 'text-slate-300 hover:text-slate-400'}`}>
               {s === 'comments' ? (
                 <>
                   <span>Communications</span>
                   {newMessagesCount > 0 && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>}
                 </>
               ) : s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1300px]">
            <thead>
              <tr className="bg-slate-50/50 border-b">
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">Source</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Project Detail</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Assignee</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100/50" onClick={() => handleSort('orderedDate')}>
                  <div className="flex items-center gap-2">Ordered Date <SortIcon field="orderedDate" /></div>
                </th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Feedback / Chat</th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Delivery Drop</th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSubmissions.length === 0 ? (
                <tr><td colSpan={8} className="px-8 py-32 text-center text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 italic">No matching projects found.</td></tr>
              ) : (
                filteredSubmissions.map(sub => {
                  const chatInfo = submissionChatInfo[sub.id];
                  const assignedEditor = editors.find(e => e.id === sub.assignedEditorId);
                  const isBoth = sub.plan === PlanType.FURNITURE_BOTH;
                  
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-4 text-center">
                         <button onClick={() => setViewingDetail(sub)} className="w-14 h-14 relative group rounded-xl overflow-hidden border border-slate-100 hover:border-slate-900 shadow-sm bg-slate-50 inline-block">
                            <img src={sub.dataUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Source" />
                         </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                          sub.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                          sub.status === 'reviewing' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>{sub.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none block">{PLAN_DETAILS[sub.plan].title}</span>
                          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">ID: {sub.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user?.role === 'admin' ? (
                          <select 
                            value={sub.assignedEditorId || ''} 
                            onChange={(e) => onAssign(sub.id, e.target.value)}
                            className="bg-slate-50 border-2 border-transparent px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all w-full max-w-[140px]"
                          >
                            <option value="">Unassigned</option>
                            {editors.map(ed => <option key={ed.id} value={ed.id}>{ed.name}</option>)}
                          </select>
                        ) : (
                          <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{assignedEditor?.name || '---'}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{new Date(sub.timestamp).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-2">
                           {sub.revisionNotes && sub.status === 'processing' && (
                             <button 
                               onClick={() => setViewingRevision(sub)}
                               className="bg-rose-50 border border-rose-100 p-2 rounded-xl text-left hover:bg-rose-100 transition-all group/rev"
                             >
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest">🚨 REVISION REQUEST</span>
                                  <svg className="w-2 h-2 text-rose-300 group-hover/rev:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                </div>
                                <p className="text-[8px] font-medium text-rose-800 line-clamp-1 leading-tight italic">Click to view notes</p>
                             </button>
                           )}
                           <button onClick={() => setChattingSubmission(sub)} className="relative group px-4 py-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-between gap-3">
                             <div className="flex items-center gap-2 font-black tracking-widest">CHAT {chatInfo ? `(${chatInfo.count})` : ''}</div>
                             {chatInfo?.hasNew && <span className="flex items-center gap-1 bg-emerald-500 text-white px-1.5 py-0.5 rounded-md text-[7px] animate-pulse">NEW</span>}
                           </button>
                         </div>
                      </td>
                      <td className="px-8 py-4">
                         <div className="flex items-center gap-3">
                            {isBoth ? (
                              <>
                                <DeliveryDropZone submission={sub} type="remove" />
                                <DeliveryDropZone submission={sub} type="add" />
                              </>
                            ) : (
                              <DeliveryDropZone submission={sub} type="single" />
                            )}
                         </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                          {sub.status === 'reviewing' && user?.role === 'admin' && (
                            <>
                              <button onClick={() => { setRevisingSubmission(sub); setRevisionNotes(sub.revisionNotes || ''); }} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm" title="Reject & Send Back"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                              <button onClick={() => onApprove(sub.id)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-md" title="Approve & Finalize"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></button>
                            </>
                          )}
                         </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
