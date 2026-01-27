
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Submission, PLAN_DETAILS, Editor, User, PlanType, getEstimatedDeliveryDate, Message } from '../types';
import { DetailModal } from './DetailModal';
import { ChatBoard } from './ChatBoard';
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

type FilterStatus = 'all' | 'pending' | 'processing' | 'reviewing' | 'completed' | 'comments';
type SortField = 'orderedDate' | 'deliveryDate';
type SortDirection = 'asc' | 'desc';

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
  const [chattingSubmission, setChattingSubmission] = useState<Submission | null>(null);
  const [showEditorManager, setShowEditorManager] = useState(false);
  const [isUploadingResult, setIsUploadingResult] = useState(false);
  const [revisingSubmission, setRevisingSubmission] = useState<Submission | null>(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  
  // ソート設定
  const [sortField, setSortField] = useState<SortField>('orderedDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
    
    if (showOnlyMine && user.editorRecordId) {
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
      if (statusFilter !== 'all') {
        result = result.filter(s => s.status === statusFilter);
      }

      // ソート処理 (orderedDate または deliveryDate)
      // 今回のロジックでは deliveryDate はOrderedDateに比例するため値の比較は同じですが、UI上の意図を反映
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
    if (user.role === 'admin' && !showOnlyMine && editorFilter !== 'all') {
      result = result.filter(s => s.assignedEditorId === editorFilter);
    }
    return result;
  }, [submissions, statusFilter, planFilter, editorFilter, user.editorRecordId, showOnlyMine, user.role, submissionChatInfo, sortField, sortDirection]);

  const stats = {
    total: submissions.filter(s => s.paymentStatus === 'paid').length,
    pending: submissions.filter(s => s.status === 'pending' && s.paymentStatus === 'paid').length,
    processing: submissions.filter(s => s.status === 'processing' && s.paymentStatus === 'paid').length,
    completed: submissions.filter(s => s.status === 'completed' && s.paymentStatus === 'paid').length,
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <svg className="w-3 h-3 opacity-20" fill="currentColor" viewBox="0 0 20 20"><path d="M5 10l5-5 5 5H5zM5 12l5 5 5-5H5z" /></svg>;
    return sortDirection === 'asc' 
      ? <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path d="M5 15l5-5 5 5H5z" /></svg>
      : <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path d="M15 5l-5 5-5-5h10z" /></svg>;
  };

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-6 lg:px-10 space-y-8">
      {viewingDetail && <DetailModal submission={viewingDetail} onClose={() => setViewingDetail(null)} />}
      {chattingSubmission && <ChatBoard submission={chattingSubmission} user={user} onClose={() => { setChattingSubmission(null); loadAllMessages(); }} />}
      
      {revisingSubmission && (
        <div className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 space-y-8">
            <h3 className="text-xl font-black uppercase tracking-tight jakarta text-center">Revision Request</h3>
            <textarea
              className="w-full min-h-[160px] bg-slate-50 border-2 border-transparent p-6 rounded-2xl text-xs font-medium focus:bg-white focus:border-slate-900 outline-none transition-all resize-none"
              placeholder="Ex: Please change the sofa color to light grey..."
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
            />
            <div className="flex gap-4">
              <button onClick={() => setRevisingSubmission(null)} className="flex-1 py-4 border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300">Cancel</button>
              <button onClick={() => { onReject(revisingSubmission.id, revisionNotes); setRevisingSubmission(null); setRevisionNotes(''); }} disabled={!revisionNotes.trim()} className="flex-1 py-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl disabled:opacity-20">Send Request</button>
            </div>
          </div>
        </div>
      )}

      {showEditorManager && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-10 py-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-black uppercase tracking-tighter jakarta">Studio Team</h3>
              <button onClick={() => setShowEditorManager(false)} className="w-10 h-10 flex items-center justify-center rounded-full border border-slate-100 hover:bg-slate-900 hover:text-white transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
              {editors.map(ed => (
                <div key={ed.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">{ed.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ed.email} • {ed.specialty}</span>
                  </div>
                  <button onClick={() => onDeleteEditor(ed.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file && activeSubmissionId.current) {
          setIsUploadingResult(true);
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64 = reader.result as string;
              const path = `results/${activeSubmissionId.current}_final.jpg`;
              const publicUrl = await db.storage.upload(path, base64);
              onDeliver(activeSubmissionId.current!, publicUrl);
              activeSubmissionId.current = null;
            } finally { setIsUploadingResult(false); }
          };
          reader.readAsDataURL(file);
        }
      }} accept="image/*" className="hidden" />

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
           {user.role === 'admin' && <button onClick={() => setShowEditorManager(true)} className="px-6 py-2.5 bg-white border-2 border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-full">Team</button>}
           <button onClick={onRefresh} className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-2">Sync</button>
        </div>
      </header>

      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowOnlyMine(!showOnlyMine)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showOnlyMine ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}>
            {user.role === 'admin' ? 'My Assignments' : 'My Projects'}
          </button>
          <div className="w-px h-6 bg-slate-100 mx-2"></div>
          {(['all', 'pending', 'processing', 'reviewing', 'completed', 'comments'] as FilterStatus[]).map(s => (
            <button 
              key={s} 
              onClick={() => setStatusFilter(s)} 
              className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusFilter === s ? 'text-slate-900 bg-slate-50 font-black' : 'text-slate-300 hover:text-slate-400'}`}
            >
               {s === 'comments' ? (
                 <>
                   <span>Communications ✉️</span>
                   {newMessagesCount > 0 && (
                     <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                   )}
                 </>
               ) : s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50/50 border-b">
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-center">View</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Project Detail</th>
                <th 
                  className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('orderedDate')}
                >
                  <div className="flex items-center gap-2">
                    Ordered Date <SortIcon field="orderedDate" />
                  </div>
                </th>
                <th 
                  className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 cursor-pointer hover:bg-slate-100/50 transition-colors"
                  onClick={() => handleSort('deliveryDate')}
                >
                  <div className="flex items-center gap-2">
                    Estimated Delivery <SortIcon field="deliveryDate" />
                  </div>
                </th>
                <th className="px-6 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Communication</th>
                <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSubmissions.length === 0 ? (
                <tr><td colSpan={7} className="px-8 py-32 text-center text-[11px] font-black uppercase tracking-[0.4em] text-slate-300 italic">No matching projects found.</td></tr>
              ) : (
                filteredSubmissions.map(sub => {
                  const chatInfo = submissionChatInfo[sub.id];
                  
                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-all group">
                      <td className="px-8 py-4 text-center">
                         <button 
                          onClick={() => setViewingDetail(sub)} 
                          className="w-14 h-14 relative group rounded-xl overflow-hidden border border-slate-100 hover:border-slate-900 transition-all shadow-sm bg-slate-50 inline-block"
                         >
                            <img src={sub.dataUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Source" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </div>
                         </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${sub.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{sub.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none block">{PLAN_DETAILS[sub.plan].title}</span>
                          <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">ID: {sub.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                            {new Date(sub.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">
                            At {new Date(sub.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{getEstimatedDeliveryDate(sub.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">Due at 6:00 PM</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-2">
                           <button onClick={() => setChattingSubmission(sub)} className="relative group px-4 py-2 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-between gap-3">
                             <div className="flex items-center gap-2">
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                               {chatInfo ? `Channel (${chatInfo.count})` : 'Open Channel'}
                             </div>
                             {chatInfo?.hasNew && (
                               <span className="flex items-center gap-1 bg-emerald-500 text-white px-1.5 py-0.5 rounded-md text-[7px] animate-bounce">
                                 NEW
                               </span>
                             )}
                           </button>
                           {chatInfo?.lastMessage && (
                             <p className="text-[8px] font-medium text-slate-400 line-clamp-1 px-2 italic">
                               "{chatInfo.lastMessage.content}"
                             </p>
                           )}
                         </div>
                      </td>
                      <td className="px-8 py-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                          {sub.status !== 'completed' && (
                            <button onClick={() => { activeSubmissionId.current = sub.id; fileInputRef.current?.click(); }} className="px-5 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all">Upload Result</button>
                          )}
                          {sub.status === 'reviewing' && user.role === 'admin' && (
                            <button onClick={() => onApprove(sub.id)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></button>
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
