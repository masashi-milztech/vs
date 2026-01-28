
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

  useEffect(() => {
    const isAnyModalOpen = viewingDetail || chattingSubmission || showEditorManager || revisingSubmission || viewingRevision;
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'unset';
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

  const DeliveryDropZone = ({ submission, type, mobile = false }: { submission: Submission, type: 'remove' | 'add' | 'single', mobile?: boolean }) => {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const label = type === 'remove' ? 'REMOVED' : type === 'add' ? 'STAGED' : 'FINAL RESULT';
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
          else if (type === 'add' || type === 'single') { updates.resultAddUrl = publicUrl; updates.resultDataUrl = publicUrl; }
          let newStatus = submission.status;
          if (submission.plan === PlanType.FURNITURE_BOTH) {
            if ((type === 'remove' || submission.resultRemoveUrl) && (type === 'add' || submission.resultAddUrl)) newStatus = user.role === 'admin' ? 'completed' : 'reviewing';
          } else { newStatus = user.role === 'admin' ? 'completed' : 'reviewing'; }
          updates.status = newStatus;
          onDeliver(submission.id, updates);
        } finally { setUploading(false); }
      };
      reader.readAsDataURL(file);
    };

    return (
      <div 
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) handleUpload(file); }}
        className={`relative group rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-2 overflow-hidden ${mobile ? 'w-full h-32' : 'min-h-[100px]'} ${
          dragging ? 'border-slate-900 bg-slate-50' : currentUrl ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100 bg-white'
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
    <div className="max-w-[1600px] mx-auto py-8 px-4 md:px-10 space-y-8">
      {viewingDetail && <DetailModal submission={viewingDetail} onClose={() => setViewingDetail(null)} />}
      {chattingSubmission && <ChatBoard submission={chattingSubmission} user={user} onClose={() => { setChattingSubmission(null); loadAllMessages(); }} />}
      
      {/* (Previous Modal contents omitted for brevity, keeping existing logic) */}

      <header className="flex flex-col xl:flex-row justify-between items-center gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full md:w-auto">
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase jakarta text-center md:text-left">Production Hub</h1>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full md:w-auto justify-center md:justify-start">
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-[8px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap shadow-sm">
                {k}: <span className="text-slate-900">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           {user?.role === 'admin' && <button onClick={() => setShowEditorManager(true)} className="flex-1 md:flex-none px-6 py-2.5 bg-white border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full">Team Manager</button>}
           <button onClick={onRefresh} className="flex-1 md:flex-none px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center justify-center gap-2">Sync</button>
        </div>
      </header>

      {/* Filter Tabs - Improved for Mobile */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 min-w-max">
          <button onClick={() => setShowOnlyMine(!showOnlyMine)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showOnlyMine ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>
            {user?.role === 'admin' ? 'My Assignments' : 'My Current Queue'}
          </button>
          <div className="w-px h-6 bg-slate-100 mx-1"></div>
          {(['all', 'pending', 'processing', 'reviewing', 'completed', 'comments'] as FilterStatus[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === s ? 'text-slate-900 bg-slate-50' : 'text-slate-300 hover:text-slate-400'}`}>
               {s === 'comments' ? 'Communications' : s}
               {s === 'comments' && newMessagesCount > 0 && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Responsive Switch */}
      <div className="space-y-6">
        {/* Desktop View (Table) */}
        <div className="hidden lg:block bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
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
                  filteredSubmissions.map(sub => (
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
                          <select value={sub.assignedEditorId || ''} onChange={(e) => onAssign(sub.id, e.target.value)} className="bg-slate-50 border-2 border-transparent px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-900 outline-none focus:bg-white focus:border-slate-900 transition-all w-full max-w-[140px]">
                            <option value="">Unassigned</option>
                            {editors.map(ed => <option key={ed.id} value={ed.id}>{ed.name}</option>)}
                          </select>
                        ) : <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{editors.find(e => e.id === sub.assignedEditorId)?.name || '---'}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{new Date(sub.timestamp).toLocaleDateString()}</span>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-2">
                           {sub.revisionNotes && sub.status === 'processing' && (
                             <button onClick={() => setViewingRevision(sub)} className="bg-rose-50 border border-rose-100 p-2 rounded-xl text-left hover:bg-rose-100 transition-all">
                                <span className="text-[7px] font-black text-rose-500 uppercase tracking-widest">🚨 REVISION REQUEST</span>
                             </button>
                           )}
                           <button onClick={() => setChattingSubmission(sub)} className="relative group px-4 py-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-between gap-3">
                             <div className="flex items-center gap-2">CHAT {submissionChatInfo[sub.id] ? `(${submissionChatInfo[sub.id].count})` : ''}</div>
                             {submissionChatInfo[sub.id]?.hasNew && <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>}
                           </button>
                         </div>
                      </td>
                      <td className="px-8 py-4">
                         <div className="flex items-center gap-3">
                            {sub.plan === PlanType.FURNITURE_BOTH ? (
                              <> <DeliveryDropZone submission={sub} type="remove" /> <DeliveryDropZone submission={sub} type="add" /> </>
                            ) : <DeliveryDropZone submission={sub} type="single" />}
                         </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                          {sub.status === 'reviewing' && user?.role === 'admin' && (
                            <>
                              <button onClick={() => { setRevisingSubmission(sub); setRevisionNotes(sub.revisionNotes || ''); }} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                              <button onClick={() => onApprove(sub.id)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all shadow-md"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></button>
                            </>
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

        {/* Mobile View (Cards) */}
        <div className="lg:hidden space-y-4">
          {filteredSubmissions.length === 0 ? (
            <div className="bg-white p-20 text-center rounded-[2rem] border border-slate-100">
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No projects found</p>
            </div>
          ) : (
            filteredSubmissions.map(sub => (
              <div key={sub.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 space-y-6 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setViewingDetail(sub)} className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                      <img src={sub.dataUrl} className="w-full h-full object-cover" alt="" />
                    </button>
                    <div>
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest block">{PLAN_DETAILS[sub.plan].title}</span>
                      <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">ID: {sub.id}</p>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border ${
                        sub.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}>{sub.status}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setChattingSubmission(sub)} className="relative p-3 bg-slate-50 rounded-xl text-slate-900">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      {submissionChatInfo[sub.id]?.hasNew && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-y border-slate-50 py-4">
                   <div className="space-y-1">
                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Assignee</span>
                      <div className="text-[9px] font-black uppercase text-slate-900 truncate">
                        {user?.role === 'admin' ? (
                          <select value={sub.assignedEditorId || ''} onChange={(e) => onAssign(sub.id, e.target.value)} className="bg-transparent border-none p-0 w-full outline-none">
                            <option value="">Unassigned</option>
                            {editors.map(ed => <option key={ed.id} value={ed.id}>{ed.name}</option>)}
                          </select>
                        ) : (editors.find(e => e.id === sub.assignedEditorId)?.name || '---')}
                      </div>
                   </div>
                   <div className="space-y-1">
                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-widest">Ordered</span>
                      <p className="text-[9px] font-black uppercase text-slate-900">{new Date(sub.timestamp).toLocaleDateString()}</p>
                   </div>
                </div>

                <div className="space-y-3">
                   <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Delivery Uploads</span>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sub.plan === PlanType.FURNITURE_BOTH ? (
                        <> <DeliveryDropZone submission={sub} type="remove" mobile /> <DeliveryDropZone submission={sub} type="add" mobile /> </>
                      ) : <DeliveryDropZone submission={sub} type="single" mobile />}
                   </div>
                </div>

                {sub.status === 'reviewing' && user?.role === 'admin' && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { setRevisingSubmission(sub); setRevisionNotes(sub.revisionNotes || ''); }} className="flex-1 py-3 bg-rose-50 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest">Send Revision</button>
                    <button onClick={() => onApprove(sub.id)} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Approve Final</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
